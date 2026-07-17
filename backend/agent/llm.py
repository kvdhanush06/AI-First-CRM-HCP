from langchain_groq import ChatGroq
from backend.config import settings


def get_agent_llm() -> ChatGroq:
    """
    Returns llama-3.3-70b-versatile via Groq for the LangGraph agent.
    This model has full native tool-calling support (bind_tools).
    """
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=settings.GROQ_API_KEY,
        temperature=0,
        max_retries=2,
    )


def get_nlp_llm() -> ChatGroq:
    """
    Returns gemma2-9b-it via Groq for NLP tasks:
    - Interaction summarization
    - Entity extraction (product names, follow-up actions)
    - Sentiment analysis
    - Next best action recommendations
    """
    return ChatGroq(
        model="gemma2-9b-it",
        api_key=settings.GROQ_API_KEY,
        temperature=0.2,
        max_retries=2,
    )
