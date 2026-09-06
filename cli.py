"""Command Line Interface (CLI) for Multi-Agent Deep Researcher."""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime

from agents import run_research
from tools.search import perform_search


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Autonomous Multi-Agent Deep Researcher CLI",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument(
        "query",
        type=str,
        help="The research query, question, or topic to investigate",
    )
    parser.add_argument(
        "--depth",
        choices=["standard", "deep"],
        default="standard",
        help="Depth of the research investigation",
    )
    parser.add_argument(
        "--engine",
        choices=["auto", "linkup", "duckduckgo"],
        default="auto",
        help="Search engine to use",
    )
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help="LLM model (e.g. gpt-4o-mini, llama-3.3-70b-versatile, deepseek-r1:7b)",
    )
    parser.add_argument(
        "--provider",
        type=str,
        choices=["openai", "groq", "anthropic", "gemini", "ollama", "deepseek"],
        default=None,
        help="LLM provider",
    )
    parser.add_argument(
        "--quick",
        action="store_true",
        help="Run a fast search lookup instead of full multi-agent synthesis",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default=None,
        help="Save report directly to a specified output file path",
    )

    args = parser.parse_args()

    print("\n" + "=" * 60)
    print("🔍 Multi-Agent Deep Researcher")
    print("=" * 60)
    print(f"Topic:         {args.query}")
    print(f"Depth:         {args.depth}")
    print(f"Search Engine: {args.engine}")
    if args.model:
        print(f"Model:         {args.model}")
    print("=" * 60 + "\n")

    if args.quick:
        print("⚡ Conducting fast web search...")
        results = perform_search(args.query, depth=args.depth, provider=args.engine)
        for idx, item in enumerate(results.get("results", []), 1):
            print(f"\n[{idx}] {item.get('title')}")
            print(f"    {item.get('url')}")
            print(f"    {item.get('snippet')}")
        return 0

    print("🤖 Launching Multi-Agent Crew (Web Researcher -> Analyst -> Writer)...")
    print("⏳ This may take 30-90 seconds depending on research depth.\n")

    res = run_research(
        query=args.query,
        depth=args.depth,
        search_engine=args.engine,
        model=args.model,
        provider=args.provider,
    )

    if not res.get("success"):
        print(f"\n❌ Research Error: {res.get('error')}", file=sys.stderr)
        return 1

    report_text = res.get("report", "")
    print("\n" + "#" * 60)
    print("RESEARCH REPORT")
    print("#" * 60 + "\n")
    print(report_text)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(report_text)
        print(f"\n✅ Output successfully written to: {args.output}")
    elif res.get("saved_file"):
        print(f"\n✅ Report saved to: {res.get('saved_file')}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
