"""
LangGraph Agent Graph for AI-First CRM HCP Module
==================================================
Architecture:
  START → agent_node (llama-3.3-70b) → [tools_node ↔ agent_node loop] → END

The agent uses llama-3.3-70b-versatile (native tool-calling support via Groq)
to decide which tool to call. The tool node executes the tool and returns the
result back to the agent for further reasoning or final response.
"""

from typing import Annotated, Sequence
from langchain_core.messages import BaseMessage, SystemMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver
from typing_extensions import TypedDict

from backend.agent.llm import get_agent_llm
from backend.agent.tools import ALL_TOOLS


# ─────────────────────────────────────────────────────────────────────────────
# Agent State
# ─────────────────────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]


# ─────────────────────────────────────────────────────────────────────────────
# System Prompt
# ─────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an AI assistant embedded in a pharmaceutical CRM system, helping field sales representatives manage their interactions with Healthcare Professionals (HCPs).

You have access to the following tools:
1. **log_interaction** – Log a new interaction with an HCP (meeting, call, sample drop, etc.)
2. **edit_interaction** – Update/correct a previously logged interaction
3. **lookup_hcp** – Search for HCPs by name, specialty, or hospital
4. **get_interaction_history** – View past interactions with an HCP
5. **suggest_next_action** – Get AI-powered recommendations for your next engagement

Guidelines:
- Always be helpful, professional, and concise
- When logging interactions, extract all relevant details from the user's message
- If a user mentions a doctor's name, use lookup_hcp first to confirm the correct HCP
- For date references like "yesterday" or "last Monday", infer the actual date
- Format responses clearly with relevant emojis for readability
- If unclear, ask for clarification before taking action
- Never make up interaction IDs or HCP information

Today's date: {today}"""


# ─────────────────────────────────────────────────────────────────────────────
# Graph Construction
# ─────────────────────────────────────────────────────────────────────────────

def create_agent_graph():
    """Build and compile the LangGraph agent."""
    
    # Initialize LLM with tools bound
    llm = get_agent_llm()
    llm_with_tools = llm.bind_tools(ALL_TOOLS)
    
    # Agent node: calls the LLM with current message history
    def agent_node(state: AgentState):
        from datetime import date
        system_msg = SystemMessage(content=SYSTEM_PROMPT.format(today=date.today().isoformat()))
        messages = [system_msg] + list(state["messages"])
        response = llm_with_tools.invoke(messages)
        return {"messages": [response]}
    
    # Build the graph
    builder = StateGraph(AgentState)
    
    # Add nodes
    builder.add_node("agent", agent_node)
    builder.add_node("tools", ToolNode(ALL_TOOLS))
    
    # Set entry point
    builder.set_entry_point("agent")
    
    # Conditional routing: if the agent produced a tool call → tools node, else → END
    builder.add_conditional_edges("agent", tools_condition)
    
    # After tools execute, always return to agent for further reasoning
    builder.add_edge("tools", "agent")
    
    # Compile with in-memory checkpointer for multi-turn conversation support
    memory = MemorySaver()
    graph = builder.compile(checkpointer=memory)
    
    return graph


# Singleton graph instance
_graph = None


def get_graph():
    """Get or create the singleton agent graph."""
    global _graph
    if _graph is None:
        _graph = create_agent_graph()
    return _graph


async def chat_with_agent(message: str, session_id: str = "default") -> dict:
    """
    Send a message to the LangGraph agent and get a response.
    Maintains conversation history via thread_id (session_id).
    
    Returns:
        dict with 'response' (str) and 'tool_calls' (list)
    """
    from langchain_core.messages import HumanMessage
    
    graph = get_graph()
    config = {"configurable": {"thread_id": session_id}}
    
    result = await graph.ainvoke(
        {"messages": [HumanMessage(content=message)]},
        config=config,
    )
    
    # Extract the last AI message
    last_message = result["messages"][-1]
    
    # Collect tool call info for frontend display
    tool_calls_info = []
    for msg in result["messages"]:
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            for tc in msg.tool_calls:
                tool_calls_info.append({
                    "tool_name": tc.get("name", "unknown"),
                    "args": tc.get("args", {}),
                })
    
    return {
        "response": last_message.content,
        "tool_calls": tool_calls_info,
    }
