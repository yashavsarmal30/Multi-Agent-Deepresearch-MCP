"""FastAPI backend providing REST and SSE streaming for the Deep Researcher React UI."""

from __future__ import annotations

import asyncio
import json
import logging
import os
import urllib.request
from datetime import datetime
from typing import Any, Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from agents import (
    REPORTS_DIR,
    async_run_research,
    get_llm_client,
    run_research,
)
from tools.search import perform_search

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("deep-researcher-api")

app = FastAPI(
    title="Deep Researcher API",
    description="Backend API supporting Multi-Agent Deep Research with CrewAI and MCP",
    version="1.0.0",
)

# Enable CORS for local React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ResearchRequest(BaseModel):
    query: str = Field(..., description="The research topic or question")
    depth: Literal["standard", "deep"] = Field(
        default="standard",
        description="Depth of research investigation"
    )
    search_engine: Literal["auto", "linkup", "duckduckgo"] = Field(
        default="auto",
        description="Search engine provider"
    )
    model: str | None = Field(default=None, description="Model override")
    provider: str | None = Field(default=None, description="LLM Provider override")
    api_key: str | None = Field(default=None, description="Optional LLM API key override")
    linkup_api_key: str | None = Field(default=None, description="Optional LinkUp API key override")
    gemini_api_key: str | None = Field(default=None, description="Optional Google Gemini API key override")


class SearchRequest(BaseModel):
    query: str = Field(..., description="The search query")
    max_results: int = Field(default=5, description="Maximum results")
    search_engine: Literal["auto", "linkup", "duckduckgo"] = Field(default="auto")


class ConfigUpdateRequest(BaseModel):
    linkup_api_key: str | None = None
    openai_api_key: str | None = None
    groq_api_key: str | None = None
    anthropic_api_key: str | None = None
    gemini_api_key: str | None = None
    deepseek_api_key: str | None = None
    ollama_base_url: str | None = None
    llm_model: str | None = None
    llm_provider: str | None = None


def check_ollama_reachable(base_url: str = "http://localhost:11434") -> bool:
    """Quick check if Ollama is running locally."""
    try:
        req = urllib.request.Request(f"{base_url.rstrip('/')}/api/tags", method="GET")
        with urllib.request.urlopen(req, timeout=1.0) as resp:
            return resp.status == 200
    except Exception:
        return False


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "deep-researcher-api"}


@app.get("/api/config")
def get_config() -> dict[str, Any]:
    """Return configured providers and system status (masked for security)."""
    ollama_running = check_ollama_reachable()

    # Determine default provider
    active_provider = os.getenv("LLM_PROVIDER")
    if not active_provider:
        if os.getenv("OPENAI_API_KEY"):
            active_provider = "openai"
        elif os.getenv("GROQ_API_KEY"):
            active_provider = "groq"
        elif os.getenv("ANTHROPIC_API_KEY"):
            active_provider = "anthropic"
        elif os.getenv("GEMINI_API_KEY"):
            active_provider = "gemini"
        elif ollama_running:
            active_provider = "ollama"
        else:
            active_provider = "none"

    return {
        "providers": {
            "linkup": bool(os.getenv("LINKUP_API_KEY")),
            "openai": bool(os.getenv("OPENAI_API_KEY")),
            "groq": bool(os.getenv("GROQ_API_KEY")),
            "anthropic": bool(os.getenv("ANTHROPIC_API_KEY")),
            "gemini": bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")),
            "deepseek": bool(os.getenv("DEEPSEEK_API_KEY")),
            "ollama": ollama_running,
            "duckduckgo": True,
        },
        "active_provider": active_provider,
        "active_model": os.getenv("LLM_MODEL", "auto"),
        "default_search_engine": "linkup" if os.getenv("LINKUP_API_KEY") else "duckduckgo",
    }


@app.post("/api/config")
def update_config(body: ConfigUpdateRequest) -> dict[str, Any]:
    """Update runtime configuration / keys in memory."""
    if body.linkup_api_key is not None:
        os.environ["LINKUP_API_KEY"] = body.linkup_api_key.strip()
    if body.openai_api_key is not None:
        os.environ["OPENAI_API_KEY"] = body.openai_api_key.strip()
    if body.groq_api_key is not None:
        os.environ["GROQ_API_KEY"] = body.groq_api_key.strip()
    if body.anthropic_api_key is not None:
        os.environ["ANTHROPIC_API_KEY"] = body.anthropic_api_key.strip()
    if body.gemini_api_key is not None:
        os.environ["GEMINI_API_KEY"] = body.gemini_api_key.strip()
        os.environ["GOOGLE_API_KEY"] = body.gemini_api_key.strip()
    if body.deepseek_api_key is not None:
        os.environ["DEEPSEEK_API_KEY"] = body.deepseek_api_key.strip()
    if body.ollama_base_url is not None:
        os.environ["OLLAMA_BASE_URL"] = body.ollama_base_url.strip()
    if body.llm_model is not None:
        os.environ["LLM_MODEL"] = body.llm_model.strip()
    if body.llm_provider is not None:
        os.environ["LLM_PROVIDER"] = body.llm_provider.strip()

    return {"status": "success", "message": "Configuration updated successfully"}


@app.post("/api/search")
def quick_search_endpoint(req: SearchRequest) -> dict[str, Any]:
    """Direct search endpoint for quick queries."""
    res = perform_search(
        query=req.query,
        provider=req.search_engine,
        max_results=req.max_results,
    )
    return res


@app.post("/api/research")
async def execute_research(req: ResearchRequest) -> dict[str, Any]:
    """Execute research and return complete Markdown report."""
    if req.linkup_api_key:
        os.environ["LINKUP_API_KEY"] = req.linkup_api_key.strip()
    if req.gemini_api_key:
        os.environ["GEMINI_API_KEY"] = req.gemini_api_key.strip()
        os.environ["GOOGLE_API_KEY"] = req.gemini_api_key.strip()

    result = await async_run_research(
        query=req.query,
        depth=req.depth,
        search_engine=req.search_engine,
        model=req.model,
        provider=req.provider,
        api_key=req.api_key or req.gemini_api_key,
    )
    return result


@app.get("/api/research/stream")
async def stream_research(
    query: str,
    depth: str = "standard",
    search_engine: str = "auto",
    model: str | None = None,
    provider: str | None = None,
    api_key: str | None = None,
    linkup_key: str | None = None,
    gemini_key: str | None = None,
) -> StreamingResponse:
    """Stream research execution stages and output using Server-Sent Events (SSE)."""
    if linkup_key:
        os.environ["LINKUP_API_KEY"] = linkup_key.strip()
    if gemini_key:
        os.environ["GEMINI_API_KEY"] = gemini_key.strip()
        os.environ["GOOGLE_API_KEY"] = gemini_key.strip()

    async def event_generator():
        yield f"data: {json.dumps({'type': 'stage', 'stage': 'init', 'message': f'Initializing Multi-Agent Crew for: {query}'})}\n\n"
        await asyncio.sleep(0.5)

        yield f"data: {json.dumps({'type': 'stage', 'stage': 'planning', 'message': 'Formulating search strategies and query decomposition...'})}\n\n"
        await asyncio.sleep(1.0)

        yield f"data: {json.dumps({'type': 'stage', 'stage': 'searching', 'message': f'Lead Web Researcher querying live web ({search_engine})...'})}\n\n"

        # Execute research in background thread
        try:
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(
                None,
                lambda: run_research(
                    query=query,
                    depth=depth,
                    search_engine=search_engine,
                    model=model,
                    provider=provider,
                    api_key=api_key,
                ),
            )

            if result.get("success"):
                yield f"data: {json.dumps({'type': 'stage', 'stage': 'analyzing', 'message': 'Principal Analyst synthesizing verified findings...'})}\n\n"
                await asyncio.sleep(0.5)

                yield f"data: {json.dumps({'type': 'stage', 'stage': 'writing', 'message': 'Technical Writer generating publication report...'})}\n\n"
                await asyncio.sleep(0.5)

                yield f"data: {json.dumps({'type': 'complete', 'result': result})}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'error', 'error': result.get('error', 'Research failed')})}\n\n"

        except Exception as exc:
            logger.exception("Error in stream_research")
            yield f"data: {json.dumps({'type': 'error', 'error': str(exc)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/history")
def get_reports_history() -> list[dict[str, Any]]:
    """Retrieve history of saved research reports."""
    if not os.path.exists(REPORTS_DIR):
        return []

    reports = []
    for fname in sorted(os.listdir(REPORTS_DIR), reverse=True):
        if fname.endswith(".md"):
            fpath = os.path.join(REPORTS_DIR, fname)
            stat = os.stat(fpath)
            reports.append({
                "id": fname,
                "filename": fname,
                "created_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "size_bytes": stat.st_size,
            })
    return reports


@app.get("/api/history/{filename}")
def get_report_by_name(filename: str) -> dict[str, Any]:
    """Retrieve full markdown content of a saved report."""
    safe_name = os.path.basename(filename)
    fpath = os.path.join(REPORTS_DIR, safe_name)
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail="Report not found")

    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()

    return {
        "filename": safe_name,
        "content": content,
    }


@app.delete("/api/history/{filename}")
def delete_report_by_name(filename: str) -> dict[str, Any]:
    """Delete a saved research report."""
    safe_name = os.path.basename(filename)
    fpath = os.path.join(REPORTS_DIR, safe_name)
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail="Report not found")

    os.remove(fpath)
    return {"status": "success", "deleted": safe_name}


# Serve built React frontend if dist exists
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))


def main():
    """Run the FastAPI backend with uvicorn."""
    import uvicorn

    port = int(os.getenv("PORT", "5000"))
    logger.info(f"Starting Deep Researcher Web API on port {port}...")
    uvicorn.run("api:app", host="0.0.0.0", port=port, reload=True)


if __name__ == "__main__":
    main()
