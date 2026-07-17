from fastapi import APIRouter
from backend.schemas import ChatRequest, ChatResponse
from backend.agent.graph import chat_with_agent

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send a message to the LangGraph AI agent.
    The agent uses llama-3.3-70b-versatile for reasoning and tool selection,
    and gemma2-9b-it for NLP tasks (summarization, extraction, recommendations).
    
    Session state is maintained per session_id for multi-turn conversations.
    """
    # Prepend rep name context to the message so tools can use it
    contextualized_message = request.message
    if request.rep_name and request.rep_name != "Field Representative":
        contextualized_message = f"[Rep: {request.rep_name}] {request.message}"
    
    result = await chat_with_agent(
        message=contextualized_message,
        session_id=request.session_id,
    )
    
    return ChatResponse(
        message=result["response"],
        session_id=request.session_id,
        tool_calls=result["tool_calls"],
    )
