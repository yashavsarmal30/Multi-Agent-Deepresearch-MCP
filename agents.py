"""Multi-Agent Deep Researcher using CrewAI, LinkUp, and DuckDuckGo."""

from __future__ import annotations

import asyncio
from datetime import datetime
import json
import logging
import os
import re
from typing import Any, Callable
from urllib.parse import urlparse

from dotenv import load_dotenv
from crewai import Agent, Crew, LLM, Process, Task

from tools.search import (
    DuckDuckGoSearchTool,
    LinkUpSearchTool,
    UnifiedSearchTool,
)

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

REPORTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)


import litellm

litellm.drop_params = True
litellm.num_retries = 3


class GeminiLLM(LLM):
    """Custom CrewAI LLM subclass for Google Gemini API.

    Fixes Gemini API requirement where conversation turns must alternate
    and handles rate limits (429) gracefully with backoff retries.
    """

    def call(
        self,
        messages: str | list[dict[str, str]],
        tools: list[dict] | None = None,
        callbacks: list[Any] | None = None,
        available_functions: dict[str, Any] | None = None,
    ) -> str | Any:
        if isinstance(messages, str):
            messages = [{"role": "user", "content": messages}]

        if isinstance(messages, list):
            cleaned: list[dict[str, str]] = []
            for m in messages:
                role = "user" if m.get("role") in ["user", "system"] else "assistant"
                content = str(m.get("content") or "")
                if cleaned and cleaned[-1]["role"] == role:
                    cleaned[-1]["content"] = (
                        f"{cleaned[-1]['content']}\n{content}".strip()
                    )
                else:
                    cleaned.append({"role": role, "content": content})

            if cleaned and cleaned[-1]["role"] == "assistant":
                cleaned.append(
                    {
                        "role": "user",
                        "content": "Please proceed with the research task.",
                    }
                )

            messages = cleaned

        max_attempts = 5
        for attempt in range(max_attempts):
            try:
                return super().call(
                    messages=messages,
                    tools=tools,
                    callbacks=callbacks,
                    available_functions=available_functions,
                )
            except Exception as e:
                err_str = str(e)
                if (
                    "429" in err_str
                    or "RateLimit" in err_str
                    or "RESOURCE_EXHAUSTED" in err_str
                ) and attempt < max_attempts - 1:
                    import time

                    wait_time = (attempt + 1) * 4.0
                    logger.warning(
                        f"API rate limit hit (429). Waiting {wait_time}s before retry {attempt + 1}/{max_attempts}..."
                    )
                    time.sleep(wait_time)
                else:
                    raise


def get_llm_client(
    model: str | None = None,
    provider: str | None = None,
    api_key: str | None = None,
    base_url: str | None = None,
) -> LLM:
    """Initialize and return an LLM client with intelligent provider detection.

    Supports OpenAI, Groq, Anthropic, Gemini, DeepSeek, and local Ollama.
    """
    # 1. Check explicit model
    selected_model = model or os.getenv("LLM_MODEL")

    # 2. Check provider or auto-detect from available environment keys
    detected_provider = provider or os.getenv("LLM_PROVIDER")

    if not detected_provider:
        if api_key and not selected_model:
            detected_provider = "openai"
        elif os.getenv("OPENAI_API_KEY"):
            detected_provider = "openai"
        elif os.getenv("GROQ_API_KEY"):
            detected_provider = "groq"
        elif os.getenv("ANTHROPIC_API_KEY"):
            detected_provider = "anthropic"
        elif os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"):
            detected_provider = "gemini"
        elif os.getenv("DEEPSEEK_API_KEY"):
            detected_provider = "deepseek"
        else:
            detected_provider = "ollama"

    # 3. Configure per provider
    if detected_provider == "openai":
        target_model = selected_model or "gpt-4o-mini"
        if not target_model.startswith("openai/"):
            target_model = f"openai/{target_model}"
        key = api_key or os.getenv("OPENAI_API_KEY")
        return LLM(model=target_model, api_key=key, base_url=base_url)

    elif detected_provider == "groq":
        target_model = selected_model or "groq/llama-3.3-70b-versatile"
        if not target_model.startswith("groq/"):
            target_model = f"groq/{target_model}"
        key = api_key or os.getenv("GROQ_API_KEY")
        return LLM(model=target_model, api_key=key)

    elif detected_provider == "anthropic":
        target_model = selected_model or "anthropic/claude-3-5-haiku-20241022"
        if not target_model.startswith("anthropic/"):
            target_model = f"anthropic/{target_model}"
        key = api_key or os.getenv("ANTHROPIC_API_KEY")
        return LLM(model=target_model, api_key=key)

    elif detected_provider == "gemini":
        raw_model = selected_model or os.getenv("GEMINI_MODEL") or "gemini-3.6-flash"
        if (
            "gemini-3.6-pro" in raw_model
            or raw_model.endswith("-pro")
            or raw_model == "gemini-pro"
        ):
            raw_model = "gemini-3.6-flash"
        target_model = (
            raw_model if raw_model.startswith("gemini/") else f"gemini/{raw_model}"
        )
        key = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if key:
            os.environ["GEMINI_API_KEY"] = key
            os.environ["GOOGLE_API_KEY"] = key
        return GeminiLLM(model=target_model, api_key=key)

    elif detected_provider == "deepseek":
        target_model = selected_model or "deepseek/deepseek-chat"
        key = api_key or os.getenv("DEEPSEEK_API_KEY")
        return LLM(model=target_model, api_key=key)

    else:
        # Default to Ollama
        ollama_base = base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        ollama_model = selected_model or os.getenv("OLLAMA_MODEL", "deepseek-r1:7b")
        if not ollama_model.startswith("ollama/"):
            ollama_model = f"ollama/{ollama_model}"
        return LLM(model=ollama_model, base_url=ollama_base)


def sanitize_filename(name: str) -> str:
    """Create a filesystem-safe filename from a query."""
    clean = re.sub(r"[^\w\s-]", "", name).strip().lower()
    clean = re.sub(r"[-\s]+", "_", clean)
    return clean[:50]


def create_research_crew(
    query: str,
    depth: str = "standard",
    search_engine: str = "auto",
    llm: LLM | None = None,
) -> Crew:
    """Create and configure the multi-agent research crew."""
    # Tool selection
    if search_engine == "linkup":
        search_tool = LinkUpSearchTool()
    elif search_engine == "duckduckgo":
        search_tool = DuckDuckGoSearchTool()
    else:
        search_tool = UnifiedSearchTool()

    # Model client
    client = llm or get_llm_client()

    # Agent 1: Lead Web Researcher
    researcher = Agent(
        role="Lead Web Researcher",
        goal="Discover credible, comprehensive, and up-to-date information and source links for research topics.",
        backstory=(
            "An elite investigative researcher specialized in formulating surgical search queries, "
            "evaluating information authority, and extracting key data points with original citation URLs."
        ),
        verbose=True,
        allow_delegation=False,
        tools=[search_tool],
        llm=client,
    )

    # Agent 2: Principal Research Analyst
    analyst = Agent(
        role="Principal Research Analyst",
        goal="Synthesize raw research data, detect core patterns, verify credibility, and extract deep insights.",
        backstory=(
            "A seasoned domain analyst capable of cutting through marketing hype and technical noise "
            "to construct nuanced, fact-checked, and balanced thematic analyses."
        ),
        verbose=True,
        allow_delegation=False,
        llm=client,
    )

    # Agent 3: Senior Technical Writer & Synthesizer
    writer = Agent(
        role="Senior Technical Writer",
        goal="Produce publication-ready, deeply informative markdown reports with clear executive summaries and citations.",
        backstory=(
            "A master science and technology writer who transforms complex investigative insights "
            "into structured, compelling, and actionable executive reports."
        ),
        verbose=True,
        allow_delegation=False,
        llm=client,
    )

    # Depth customization
    is_deep = depth == "deep"
    search_scope = (
        "Conduct an exhaustive multi-perspective web search covering background, current developments, "
        "technical specs, market dynamics, and future outlook."
        if is_deep
        else "Conduct a targeted search covering core concepts, latest developments, and key source references."
    )

    # Tasks
    search_task = Task(
        description=(
            f"Topic: {query}\n"
            f"Scope: {search_scope}\n"
            "Requirements:\n"
            "1. Search the web for primary data, authoritative articles, and latest findings.\n"
            "2. Note all source titles, publication dates, and exact URLs.\n"
            "3. Collect technical details, trade-offs, and critical perspectives."
        ),
        agent=researcher,
        expected_output="Curated collection of raw findings, verified facts, and corresponding source URLs.",
        tools=[search_tool],
    )

    analysis_task = Task(
        description=(
            "Review the raw research findings from the Web Researcher.\n"
            "1. Group information into structured logical themes.\n"
            "2. Identify consensus vs debated points.\n"
            "3. Extract key quantitative metrics, milestones, and breakthroughs.\n"
            "4. Ensure each key insight preserves its source URL citation."
        ),
        agent=analyst,
        expected_output="Structured analytical brief with thematic insights and linked citations.",
        context=[search_task],
    )

    writing_task = Task(
        description=(
            f"Synthesize the research analysis for '{query}' into a comprehensive, high-quality Markdown report.\n"
            "The report MUST follow this exact structure:\n"
            "# <Compelling Title>\n"
            "## 📌 Executive Summary\n"
            "## 🎯 Key Findings & Highlights\n"
            "## 🔬 Deep Dive Analysis (organized with subheadings)\n"
            "## 📊 Comparative Analysis or Strategic Implications\n"
            "## 🚀 Future Outlook & Takeaways\n"
            "## 📚 References & Sources (numbered list with markdown links [Title](URL))\n\n"
            "Maintain an objective, authoritative tone with clear readability."
        ),
        agent=writer,
        expected_output="A complete, publication-grade Markdown research report with cited sources.",
        context=[analysis_task],
    )

    return Crew(
        agents=[researcher, analyst, writer],
        tasks=[search_task, analysis_task, writing_task],
        verbose=True,
        process=Process.sequential,
        max_rpm=10,
    )


def save_report_to_disk(query: str, markdown_content: str) -> str:
    """Save the research report to the reports directory."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    slug = sanitize_filename(query)
    filename = f"{timestamp}_{slug}.md"
    file_path = os.path.join(REPORTS_DIR, filename)

    header = (
        f"---\n"
        f"title: Deep Research - {query}\n"
        f"date: {datetime.now().isoformat()}\n"
        f"query: {query}\n"
        f"---\n\n"
    )

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(header + markdown_content)

    return file_path


def run_research(
    query: str,
    depth: str = "standard",
    search_engine: str = "auto",
    model: str | None = None,
    provider: str | None = None,
    api_key: str | None = None,
    base_url: str | None = None,
    save_report: bool = True,
) -> dict[str, Any]:
    """Execute the deep research workflow and return structured results.

    Args:
        query: The research topic or question.
        depth: 'standard' or 'deep'.
        search_engine: 'auto', 'linkup', or 'duckduckgo'.
        model: Optional LLM model name (e.g., 'gpt-4o-mini', 'llama-3.3-70b-versatile').
        provider: Optional LLM provider ('openai', 'groq', 'anthropic', 'gemini', 'ollama').
        api_key: Optional API key override.
        base_url: Optional base URL for Ollama or OpenAI compatible API.
        save_report: Whether to persist the report to the reports directory.

    Returns:
        Dictionary with status, markdown report, saved path, and metadata.
    """
    try:
        llm = get_llm_client(
            model=model,
            provider=provider,
            api_key=api_key,
            base_url=base_url,
        )

        crew = create_research_crew(
            query=query,
            depth=depth,
            search_engine=search_engine,
            llm=llm,
        )

        result = crew.kickoff()
        report_markdown = str(result.raw) if hasattr(result, "raw") else str(result)

        saved_path = None
        if save_report and report_markdown:
            saved_path = save_report_to_disk(query, report_markdown)

        return {
            "success": True,
            "query": query,
            "depth": depth,
            "search_engine": search_engine,
            "report": report_markdown,
            "saved_file": saved_path,
            "timestamp": datetime.now().isoformat(),
        }

    except Exception as exc:
        logger.exception("Error during deep research execution")
        error_msg = str(exc)
        # Provide helpful hint for Ollama connection refusal
        if "10061" in error_msg or "actively refused" in error_msg:
            error_msg = (
                "Ollama connection error: Could not reach Ollama at localhost:11434. "
                "Please make sure Ollama is running (`ollama serve`), or configure an API key "
                "(e.g., OPENAI_API_KEY, GROQ_API_KEY) in .env or the Settings panel."
            )
        return {
            "success": False,
            "query": query,
            "error": error_msg,
            "report": f"### ⚠️ Research Failed\n\n{error_msg}",
            "timestamp": datetime.now().isoformat(),
        }


async def async_run_research(
    query: str,
    depth: str = "standard",
    search_engine: str = "auto",
    model: str | None = None,
    provider: str | None = None,
    api_key: str | None = None,
    base_url: str | None = None,
    save_report: bool = True,
) -> dict[str, Any]:
    """Asynchronous wrapper for run_research to prevent blocking event loops."""
    return await asyncio.to_thread(
        run_research,
        query=query,
        depth=depth,
        search_engine=search_engine,
        model=model,
        provider=provider,
        api_key=api_key,
        base_url=base_url,
        save_report=save_report,
    )
