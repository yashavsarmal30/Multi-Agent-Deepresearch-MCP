"""Model Context Protocol (MCP) Server for Multi-Agent Deep Research.

Exposes deep research capabilities, quick web search, report management,
prompts, and resources to MCP-compatible AI clients (Cursor, Claude Desktop, Antigravity, etc.).
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
from typing import Literal

from mcp.server.fastmcp import FastMCP
from agents import async_run_research, get_llm_client, run_research, REPORTS_DIR
from tools.search import perform_search

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("deep-researcher-mcp")

# Initialize FastMCP Server
mcp = FastMCP(
    name="deep-researcher-mcp",
    instructions=(
        "You have access to a multi-agent deep research system powered by CrewAI, "
        "LinkUp deep search, and DuckDuckGo. Use the 'deep_research' tool when the user asks "
        "for comprehensive, well-researched, cited answers or reports. "
        "Use 'quick_search' for immediate web lookups."
    ),
)


@mcp.tool()
async def deep_research(
    query: str,
    depth: Literal["standard", "deep"] = "deep",
    search_engine: Literal["auto", "linkup", "duckduckgo"] = "auto",
    model: str | None = None,
    provider: str | None = None,
) -> str:
    """Run an autonomous multi-agent deep research investigation on a topic.

    Coordinates a Web Researcher, Research Analyst, and Technical Writer
    to gather live web data, synthesize insights, and produce a fully cited
    Markdown report.

    Args:
        query: The research topic, query, or question to investigate.
        depth: Thoroughness level - 'standard' for concise, 'deep' for exhaustive.
        search_engine: Search engine to use - 'auto' (preferred), 'linkup', or 'duckduckgo'.
        model: Optional model identifier (e.g., 'gpt-4o-mini', 'llama-3.3-70b-versatile').
        provider: Optional provider ('openai', 'groq', 'anthropic', 'gemini', 'ollama').

    Returns:
        The complete publication-grade Markdown research report with source citations.
    """
    logger.info(f"Starting deep research for query: '{query}' (depth={depth})")
    result = await async_run_research(
        query=query,
        depth=depth,
        search_engine=search_engine,
        model=model,
        provider=provider,
    )

    if result.get("success"):
        report = result.get("report", "No report generated.")
        saved = result.get("saved_file")
        if saved:
            report += f"\n\n---\n*Report saved locally to: `{saved}`*"
        return report
    else:
        error_msg = result.get("error", "Unknown error during research.")
        return f"Error executing deep research: {error_msg}"


@mcp.tool()
async def quick_search(
    query: str,
    max_results: int = 5,
    search_engine: Literal["auto", "linkup", "duckduckgo"] = "auto",
) -> str:
    """Conduct a fast web search and return structured snippets with source URLs.

    Args:
        query: The search term or question.
        max_results: Maximum number of links to return (default: 5, max: 15).
        search_engine: Search engine to use ('auto', 'linkup', or 'duckduckgo').

    Returns:
        Formatted search results with titles, snippets, and URLs.
    """
    res = await asyncio.to_thread(
        perform_search,
        query=query,
        provider=search_engine,
        max_results=max_results,
    )

    items = res.get("results", [])
    if items:
        lines = [f"### Web Search Results for: '{query}' (via {res.get('engine')})\n"]
        for idx, item in enumerate(items, 1):
            lines.append(
                f"**{idx}. [{item.get('title')}]({item.get('url')})**\n"
                f"{item.get('snippet')}\n"
                f"URL: {item.get('url')}\n"
            )
        return "\n".join(lines)
    return res.get("raw", "No results found.")


@mcp.tool()
def list_research_reports() -> str:
    """List all previously generated research reports saved in the reports directory.

    Returns:
        JSON list of available reports with filename, query, and creation date.
    """
    if not os.path.exists(REPORTS_DIR):
        return json.dumps([])

    reports = []
    for fname in sorted(os.listdir(REPORTS_DIR), reverse=True):
        if fname.endswith(".md"):
            path = os.path.join(REPORTS_DIR, fname)
            size = os.path.getsize(path)
            reports.append(
                {
                    "filename": fname,
                    "size_bytes": size,
                    "resource_uri": f"research://reports/{fname}",
                }
            )
    return json.dumps(reports, indent=2)


@mcp.tool()
def read_research_report(filename: str) -> str:
    """Retrieve and read a saved research report from disk.

    Args:
        filename: The filename of the report (e.g., '20260306_quantum_computing.md').

    Returns:
        The full text of the research report.
    """
    safe_name = os.path.basename(filename)
    path = os.path.join(REPORTS_DIR, safe_name)
    if not os.path.exists(path):
        return f"Report '{safe_name}' not found."

    with open(path, "r", encoding="utf-8") as f:
        return f.read()


@mcp.resource("research://status")
def get_system_status() -> str:
    """Provides current configuration, search capabilities, and model provider status."""
    status = {
        "status": "ready",
        "linkup_api_configured": bool(os.getenv("LINKUP_API_KEY")),
        "openai_api_configured": bool(os.getenv("OPENAI_API_KEY")),
        "groq_api_configured": bool(os.getenv("GROQ_API_KEY")),
        "anthropic_api_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
        "gemini_api_configured": bool(
            os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        ),
        "duckduckgo_available": True,
        "default_search_engine": "linkup"
        if os.getenv("LINKUP_API_KEY")
        else "duckduckgo",
        "reports_count": len([f for f in os.listdir(REPORTS_DIR) if f.endswith(".md")])
        if os.path.exists(REPORTS_DIR)
        else 0,
    }
    return json.dumps(status, indent=2)


@mcp.resource("research://reports/{report_name}")
def get_report_resource(report_name: str) -> str:
    """Fetch a saved research report as an MCP resource."""
    safe_name = os.path.basename(report_name)
    path = os.path.join(REPORTS_DIR, safe_name)
    if not os.path.exists(path):
        return f"Report '{safe_name}' not found."
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


@mcp.prompt("deep_research_brief")
def deep_research_prompt(topic: str, focus_area: str = "general") -> str:
    """Template for initiating a structured deep research request."""
    return (
        f"Please perform a deep research investigation into '{topic}'. "
        f"Specific focus area: {focus_area}. "
        "Deliver a complete, cited Markdown report covering executive summary, "
        "key findings, technical details, market implications, and primary sources."
    )


@mcp.prompt("competitive_analysis")
def competitive_analysis_prompt(entity_a: str, entity_b: str) -> str:
    """Template for a comparative research analysis between two entities or technologies."""
    return (
        f"Execute a comparative deep research analysis comparing '{entity_a}' and '{entity_b}'. "
        "Evaluate architecture, features, market adoption, performance benchmarks, "
        "pricing/open-source availability, and key strengths and weaknesses with citations."
    )


def main():
    """Main entry point to run the MCP server."""
    parser = argparse.ArgumentParser(
        description="Multi-Agent Deep Researcher MCP Server"
    )
    parser.add_argument(
        "--transport",
        choices=["stdio", "sse"],
        default="stdio",
        help="Transport protocol to use (default: stdio)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port for SSE transport (default: 8000)",
    )
    args = parser.parse_args()

    if args.transport == "sse":
        logger.info(
            f"Starting Deep Researcher MCP Server on SSE transport (port {args.port})..."
        )
        mcp.run(transport="sse")
    else:
        logger.info("Starting Deep Researcher MCP Server on stdio transport...")
        mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
