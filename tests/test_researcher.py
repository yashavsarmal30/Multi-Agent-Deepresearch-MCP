"""Unit and integration tests for Deep Researcher MCP system."""

import os
import unittest
from tools.search import DuckDuckGoSearchTool, UnifiedSearchTool, perform_search
from agents import sanitize_filename, save_report_to_disk, REPORTS_DIR
from server import mcp
from fastapi.testclient import TestClient
from api import app


class TestSearchTools(unittest.TestCase):
    def test_duckduckgo_search(self):
        tool = DuckDuckGoSearchTool()
        res = tool._run(query="Python programming language", max_results=2)
        self.assertIn("DuckDuckGo Search Results", res)
        self.assertIn("Python", res)

    def test_unified_search_fallback(self):
        # Even without LINKUP_API_KEY, should fall back to DuckDuckGo cleanly
        tool = UnifiedSearchTool()
        res = tool._run(query="Artificial Intelligence news", depth="standard")
        self.assertTrue(len(res) > 20)
        self.assertFalse(res.startswith("Error occurred"))

    def test_perform_search_helper(self):
        data = perform_search("Open source software", max_results=2)
        self.assertEqual(data["engine"], "duckduckgo")
        self.assertTrue(len(data["results"]) > 0)
        self.assertTrue("url" in data["results"][0])


class TestAgentsHelpers(unittest.TestCase):
    def test_sanitize_filename(self):
        name = "What is Quantum Computing?! (2026 update)"
        clean = sanitize_filename(name)
        self.assertEqual(clean, "what_is_quantum_computing_2026_update")

    def test_save_report(self):
        query = "Test Research Topic"
        content = "# Test Research\n\nThis is a sample test report content."
        saved_path = save_report_to_disk(query, content)
        self.assertTrue(os.path.exists(saved_path))
        with open(saved_path, "r", encoding="utf-8") as f:
            read_back = f.read()
        self.assertIn(content, read_back)
        # Cleanup
        if os.path.exists(saved_path):
            os.remove(saved_path)


class TestMCPServer(unittest.TestCase):
    def test_mcp_tools_registered(self):
        tool_names = [t.name for t in mcp._tool_manager.list_tools()]
        self.assertIn("deep_research", tool_names)
        self.assertIn("quick_search", tool_names)
        self.assertIn("list_research_reports", tool_names)
        self.assertIn("read_research_report", tool_names)


class TestFastAPIServer(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health(self):
        resp = self.client.get("/api/health")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["status"], "ok")

    def test_config(self):
        resp = self.client.get("/api/config")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("providers", data)
        self.assertTrue(data["providers"]["duckduckgo"])

    def test_quick_search_api(self):
        resp = self.client.post(
            "/api/search", json={"query": "FastAPI python", "max_results": 2}
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["query"], "FastAPI python")
        self.assertTrue(len(data["results"]) > 0)

    def test_spa_serving(self):
        resp = self.client.get("/")
        self.assertEqual(resp.status_code, 200)
        self.assertIn("text/html", resp.headers["content-type"])


if __name__ == "__main__":
    unittest.main()
