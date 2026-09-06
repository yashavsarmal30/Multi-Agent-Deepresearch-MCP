"""Search tools module supporting LinkUp and DuckDuckGo search engines."""

import json
import logging
import os
from typing import Any, Literal, Type
from pydantic import BaseModel, Field
from crewai.tools import BaseTool

logger = logging.getLogger(__name__)


class LinkUpSearchInput(BaseModel):
    """Input schema for LinkUp Search Tool."""

    query: str = Field(..., description="The search query to perform")
    depth: Literal["standard", "deep"] = Field(
        default="standard", description="Depth of search: 'standard' or 'deep'"
    )
    output_type: Literal["searchResults", "sourcedAnswer", "structured"] = Field(
        default="searchResults",
        description="Output type: 'searchResults', 'sourcedAnswer', or 'structured'",
    )


class LinkUpSearchTool(BaseTool):
    name: str = "LinkUp Search"
    description: str = (
        "Search the web using LinkUp's deep web search engine. "
        "Provides high-quality sourced search results and answers."
    )
    args_schema: Type[BaseModel] = LinkUpSearchInput

    def _run(
        self, query: str, depth: str = "standard", output_type: str = "searchResults"
    ) -> str:
        """Execute LinkUp search and return results."""
        api_key = os.getenv("LINKUP_API_KEY")
        if not api_key:
            return (
                "LinkUp API Key is missing. Please set LINKUP_API_KEY in your environment, "
                "or use DuckDuckGo Search."
            )

        try:
            from linkup import LinkupClient

            client = LinkupClient(api_key=api_key)
            response = client.search(query=query, depth=depth, output_type=output_type)
            return str(response)
        except Exception as exc:
            logger.warning(f"LinkUp search failed: {exc}")
            return f"LinkUp search error: {str(exc)}"


class DuckDuckGoSearchInput(BaseModel):
    """Input schema for DuckDuckGo Search Tool."""

    query: str = Field(..., description="The search query to perform")
    max_results: int = Field(
        default=6, description="Number of search results to return (max 15)"
    )


class DuckDuckGoSearchTool(BaseTool):
    name: str = "DuckDuckGo Search"
    description: str = (
        "Search the web using DuckDuckGo. Fast, comprehensive, and requires no API key. "
        "Returns titles, snippets, and source URLs."
    )
    args_schema: Type[BaseModel] = DuckDuckGoSearchInput

    def _run(self, query: str, max_results: int = 6) -> str:
        """Execute DuckDuckGo search and return structured markdown results."""
        try:
            try:
                from ddgs import DDGS
            except ImportError:
                from duckduckgo_search import DDGS

            ddgs = DDGS()
            results = ddgs.text(query, max_results=min(max(max_results, 1), 15))
            if not results:
                return f"No results found on DuckDuckGo for: '{query}'"

            formatted: list[str] = [f"### DuckDuckGo Search Results for: '{query}'\n"]
            for idx, item in enumerate(results, 1):
                title = item.get("title", "Untitled")
                link = item.get("href", item.get("link", ""))
                snippet = item.get("body", item.get("snippet", ""))
                formatted.append(
                    f"**{idx}. [{title}]({link})**\n{snippet}\nURL: {link}\n"
                )

            return "\n".join(formatted)
        except Exception as exc:
            logger.warning(f"DuckDuckGo search error: {exc}")
            return f"DuckDuckGo search error: {str(exc)}"


class UnifiedSearchInput(BaseModel):
    """Input schema for Unified Multi-Provider Search Tool."""

    query: str = Field(..., description="The search query to perform")
    depth: Literal["standard", "deep"] = Field(
        default="standard", description="Search thoroughness: 'standard' or 'deep'"
    )
    engine: Literal["auto", "linkup", "duckduckgo"] = Field(
        default="auto",
        description="Search engine to use. 'auto' selects LinkUp if API key exists, otherwise DuckDuckGo.",
    )


class UnifiedSearchTool(BaseTool):
    name: str = "Web Search Tool"
    description: str = (
        "Search the live web for verified facts, data, articles, and citations. "
        "Intelligently routes across LinkUp and DuckDuckGo search engines."
    )
    args_schema: Type[BaseModel] = UnifiedSearchInput

    def _run(self, query: str, depth: str = "standard", engine: str = "auto") -> str:
        """Execute search with intelligent fallback."""
        linkup_key = os.getenv("LINKUP_API_KEY")

        use_linkup = (engine == "linkup") or (engine == "auto" and bool(linkup_key))

        if use_linkup and linkup_key:
            try:
                linkup_tool = LinkUpSearchTool()
                result = linkup_tool._run(
                    query, depth=depth, output_type="searchResults"
                )
                # If linkup returned an error or empty, fall back to DuckDuckGo
                if (
                    result
                    and not result.startswith("LinkUp search error")
                    and not result.startswith("LinkUp API Key is missing")
                ):
                    return result
            except Exception as exc:
                logger.info(
                    f"LinkUp search failed ({exc}), falling back to DuckDuckGo."
                )

        # Fallback / Default: DuckDuckGo
        ddg_tool = DuckDuckGoSearchTool()
        max_res = 8 if depth == "deep" else 5
        return ddg_tool._run(query, max_results=max_res)


def perform_search(
    query: str, depth: str = "standard", provider: str = "auto", max_results: int = 6
) -> dict[str, Any]:
    """Helper function to execute a direct web search from Python code or API."""
    linkup_key = os.getenv("LINKUP_API_KEY")
    use_linkup = (provider == "linkup") or (provider == "auto" and bool(linkup_key))

    engine_used = "duckduckgo"
    raw_output = ""

    if use_linkup and linkup_key:
        try:
            from linkup import LinkupClient

            client = LinkupClient(api_key=linkup_key)
            resp = client.search(query=query, depth=depth, output_type="searchResults")
            raw_output = str(resp)
            engine_used = "linkup"
        except Exception as exc:
            logger.warning(f"LinkUp failed: {exc}, falling back to DuckDuckGo")

    if not raw_output:
        try:
            from ddgs import DDGS
        except ImportError:
            from duckduckgo_search import DDGS

        ddgs = DDGS()
        results = ddgs.text(query, max_results=max_results)
        items = []
        for r in results:
            items.append(
                {
                    "title": r.get("title", ""),
                    "url": r.get("href", r.get("link", "")),
                    "snippet": r.get("body", r.get("snippet", "")),
                }
            )
        return {
            "query": query,
            "engine": "duckduckgo",
            "results": items,
            "raw": str(results),
        }

    return {"query": query, "engine": engine_used, "results": [], "raw": raw_output}
