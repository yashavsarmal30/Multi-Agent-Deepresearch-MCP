"""Streamlit Web Interface for Agentic Deep Researcher."""

import os
import streamlit as st
from agents import run_research

# Page configuration
st.set_page_config(
    page_title="🔍 Agentic Deep Researcher",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Initialize session state variables
if "messages" not in st.session_state:
    st.session_state.messages = []
if "linkup_api_key" not in st.session_state:
    st.session_state.linkup_api_key = os.getenv("LINKUP_API_KEY", "")
if "openai_api_key" not in st.session_state:
    st.session_state.openai_api_key = os.getenv("OPENAI_API_KEY", "")
if "groq_api_key" not in st.session_state:
    st.session_state.groq_api_key = os.getenv("GROQ_API_KEY", "")
if "gemini_api_key" not in st.session_state:
    st.session_state.gemini_api_key = os.getenv("GEMINI_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "")


def reset_chat():
    st.session_state.messages = []


# Sidebar Configuration
with st.sidebar:
    st.image("https://avatars.githubusercontent.com/u/175112039?s=200&v=4", width=60)
    st.title("Researcher Settings")

    st.subheader("🌐 Search Engine")
    search_engine = st.selectbox(
        "Search Provider",
        options=["auto", "duckduckgo", "linkup"],
        format_func=lambda x: {
            "auto": "Auto (LinkUp if key set, else DuckDuckGo)",
            "duckduckgo": "DuckDuckGo (Free, No Key Required)",
            "linkup": "LinkUp (Deep Web Search)",
        }[x],
    )

    st.subheader("🤖 LLM Provider")
    llm_provider = st.selectbox(
        "Model Provider",
        options=["auto", "openai", "groq", "anthropic", "gemini", "ollama"],
        format_func=lambda x: {
            "auto": "Auto-Detect from Environment",
            "openai": "OpenAI (GPT-4o / GPT-4o-mini)",
            "groq": "Groq (Llama-3.3-70b Ultra Fast)",
            "anthropic": "Anthropic (Claude 3.5)",
            "gemini": "Google Gemini (2.0 Flash)",
            "ollama": "Ollama Local (DeepSeek-R1 / Llama3)",
        }[x],
    )

    st.subheader("⚡ Research Depth")
    depth = st.radio(
        "Investigation Depth",
        options=["standard", "deep"],
        format_func=lambda x: "Standard (Fast Overview)" if x == "standard" else "Deep Research (Exhaustive)",
    )

    st.markdown("---")
    st.subheader("🔑 API Keys (Optional)")

    linkup_key = st.text_input(
        "LinkUp API Key",
        value=st.session_state.linkup_api_key,
        type="password",
        help="Optional if using DuckDuckGo search.",
    )
    if linkup_key:
        st.session_state.linkup_api_key = linkup_key
        os.environ["LINKUP_API_KEY"] = linkup_key

    openai_key = st.text_input(
        "OpenAI API Key",
        value=st.session_state.openai_api_key,
        type="password",
        help="Required if using OpenAI provider.",
    )
    if openai_key:
        st.session_state.openai_api_key = openai_key
        os.environ["OPENAI_API_KEY"] = openai_key

    groq_key = st.text_input(
        "Groq API Key",
        value=st.session_state.groq_api_key,
        type="password",
        help="Required if using Groq provider.",
    )
    if groq_key:
        st.session_state.groq_api_key = groq_key
        os.environ["GROQ_API_KEY"] = groq_key

    gemini_key = st.text_input(
        "Google Gemini API Key",
        value=st.session_state.gemini_api_key,
        type="password",
        help="Required if using Google Gemini provider.",
    )
    if gemini_key:
        st.session_state.gemini_api_key = gemini_key
        os.environ["GEMINI_API_KEY"] = gemini_key
        os.environ["GOOGLE_API_KEY"] = gemini_key

    st.markdown("---")
    st.markdown("[Get LinkUp API key](https://app.linkup.so/sign-up)")
    st.markdown("[Get Google Gemini API key](https://aistudio.google.com/apikey)")
    st.markdown("[Get Groq API key](https://console.groq.com/keys)")

# Header
col1, col2 = st.columns([6, 1])
with col1:
    st.markdown("<h2 style='color: #3b82f6;'>🔍 Agentic Deep Researcher</h2>", unsafe_allow_html=True)
    st.caption("Autonomous multi-agent research crew powered by CrewAI, LinkUp, DuckDuckGo, and MCP.")
with col2:
    st.button("Clear Chat ↺", on_click=reset_chat)

st.markdown("<div style='height: 15px;'></div>", unsafe_allow_html=True)

# Display chat history
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# Chat input
if prompt := st.chat_input("Enter a topic or question to research..."):
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    with st.chat_message("assistant"):
        with st.spinner(f"Agents are researching '{prompt}' ({depth} depth)..."):
            try:
                selected_provider = None if llm_provider == "auto" else llm_provider
                res = run_research(
                    query=prompt,
                    depth=depth,
                    search_engine=search_engine,
                    provider=selected_provider,
                )
                if res.get("success"):
                    response = res.get("report", "")
                    if res.get("saved_file"):
                        response += f"\n\n*Saved to: `{res.get('saved_file')}`*"
                else:
                    response = f"**Research error:** {res.get('error')}"
            except Exception as e:
                response = f"An unexpected error occurred: {str(e)}"

        st.markdown(response)
        st.session_state.messages.append({"role": "assistant", "content": response})
