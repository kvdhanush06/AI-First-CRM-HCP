"""
LangGraph Tools for AI-First CRM HCP Module
============================================
Five tools used by the LangGraph agent for pharma field rep workflows:

1. log_interaction       – Create new HCP interaction record with AI enrichment
2. edit_interaction      – Modify existing interaction with optional re-summarization
3. lookup_hcp            – Search HCP database by name, specialty, or affiliation
4. get_interaction_history – Retrieve filtered interaction history for an HCP
5. suggest_next_action   – AI-powered next best action recommendation
"""

import json
import asyncio
from datetime import datetime, timezone
from typing import Optional, List
from langchain_core.tools import tool
from sqlalchemy import select, or_, func
from sqlalchemy.orm import selectinload

from backend.database.connection import AsyncSessionLocal
from backend.database.models import HCP, Interaction, InteractionType, SentimentType
from backend.agent.llm import get_nlp_llm



# ─────────────────────────────────────────────────────────────────────────────
# Helper: AI Enrichment using gemma2-9b-it
# ─────────────────────────────────────────────────────────────────────────────

async def _enrich_interaction_with_ai(notes: str, interaction_type: str) -> dict:
    """
    Uses gemma2-9b-it to enrich interaction notes with:
    - A concise summary
    - Detected product mentions
    - Sentiment classification
    - Follow-up action extraction
    """
    if not notes or len(notes.strip()) < 10:
        return {
            "summary": "No detailed notes provided.",
            "sentiment": "neutral",
            "products": [],
            "follow_ups": [],
        }

    nlp_llm = get_nlp_llm()
    prompt = f"""You are an AI assistant for a pharmaceutical CRM system. Analyze the following field representative's interaction notes and return a JSON object.

Interaction Type: {interaction_type}
Notes: {notes}

Return ONLY a valid JSON object with these exact fields:
{{
  "summary": "A concise 1-2 sentence summary of the interaction",
  "sentiment": "positive" or "neutral" or "negative",
  "products_mentioned": ["list of pharmaceutical product names mentioned"],
  "follow_up_actions": ["list of specific follow-up actions mentioned or implied"]
}}

JSON response:"""

    try:
        response = await nlp_llm.ainvoke(prompt)
        content = response.content.strip()
        # Extract JSON from potential markdown code blocks
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        # Find the JSON object in the response
        start = content.find("{")
        end = content.rfind("}") + 1
        if start >= 0 and end > start:
            content = content[start:end]
        
        parsed = json.loads(content)
        return {
            "summary": parsed.get("summary", "Interaction logged successfully."),
            "sentiment": parsed.get("sentiment", "neutral"),
            "products": parsed.get("products_mentioned", []),
            "follow_ups": parsed.get("follow_up_actions", []),
        }
    except Exception as e:
        print(f"AI enrichment error: {e}")
        return {
            "summary": notes[:200] + "..." if len(notes) > 200 else notes,
            "sentiment": "neutral",
            "products": [],
            "follow_ups": [],
        }


# ─────────────────────────────────────────────────────────────────────────────
# Tool 1: log_interaction
# ─────────────────────────────────────────────────────────────────────────────

@tool
async def log_interaction(
    hcp_name: str,
    interaction_type: str,
    notes: str,
    rep_name: str = "Field Representative",
    date: Optional[str] = None,
    products_discussed: Optional[str] = None,
) -> str:
    """
    Log a new interaction with a Healthcare Professional (HCP) in the CRM.
    
    Use this tool when the user wants to record/log/document a meeting, call, 
    visit, email, or any other interaction with a doctor or HCP.
    
    Args:
        hcp_name: Full name or partial name of the HCP (e.g. "Dr. Johnson", "Sarah Johnson")
        interaction_type: Type of interaction. Must be one of: detail_call, phone_call, 
                         email, virtual_meeting, sample_drop, conference, follow_up
        notes: Detailed notes about what happened during the interaction
        rep_name: Name of the field representative logging the interaction
        date: Date of interaction in ISO format (YYYY-MM-DD). Defaults to today if not provided.
        products_discussed: Comma-separated list of products discussed (optional)
    
    Returns:
        Confirmation message with the created interaction ID and AI-generated summary
    """
    async with AsyncSessionLocal() as session:
        # Find HCP by name (partial match)
        name_parts = hcp_name.replace("Dr.", "").strip().split()
        conditions = []
        for part in name_parts:
            conditions.append(HCP.first_name.ilike(f"%{part}%"))
            conditions.append(HCP.last_name.ilike(f"%{part}%"))
        
        result = await session.execute(
            select(HCP).where(or_(*conditions)).limit(1)
        )
        hcp = result.scalar_one_or_none()
        
        if not hcp:
            return f"Could not find HCP matching '{hcp_name}'. Please use the lookup_hcp tool first to find the correct HCP name."
        
        # Parse interaction type
        type_map = {
            "detail_call": InteractionType.detail_call,
            "phone_call": InteractionType.phone_call,
            "email": InteractionType.email,
            "virtual_meeting": InteractionType.virtual_meeting,
            "sample_drop": InteractionType.sample_drop,
            "conference": InteractionType.conference,
            "follow_up": InteractionType.follow_up,
            "call": InteractionType.phone_call,
            "meeting": InteractionType.virtual_meeting,
            "detail": InteractionType.detail_call,
            "sample": InteractionType.sample_drop,
        }
        itype = type_map.get(interaction_type.lower().replace(" ", "_"), InteractionType.detail_call)
        
        # Parse date
        if date:
            try:
                interaction_date = datetime.fromisoformat(date).replace(tzinfo=timezone.utc)
            except ValueError:
                interaction_date = datetime.now(timezone.utc)
        else:
            interaction_date = datetime.now(timezone.utc)
        
        # Parse products
        prods = [p.strip() for p in products_discussed.split(",")] if products_discussed else []
        
        # AI enrichment using gemma2-9b-it
        enrichment = await _enrich_interaction_with_ai(notes, itype.value)
        
        # Merge AI-detected products with manually provided ones
        all_products = list(set(prods + enrichment["products"]))
        
        # Map sentiment
        sentiment_map = {
            "positive": SentimentType.positive,
            "neutral": SentimentType.neutral,
            "negative": SentimentType.negative,
        }
        sentiment = sentiment_map.get(enrichment["sentiment"], SentimentType.neutral)
        
        # Create interaction
        interaction = Interaction(
            hcp_id=hcp.id,
            rep_name=rep_name,
            interaction_type=itype,
            date=interaction_date,
            notes=notes,
            ai_summary=enrichment["summary"],
            sentiment=sentiment,
            products_discussed=all_products,
            follow_up_actions=enrichment["follow_ups"],
        )
        session.add(interaction)
        await session.commit()
        await session.refresh(interaction)
        
        return (
            f"Interaction logged successfully!\n"
            f"Interaction ID: {interaction.id}\n"
            f"HCP: {hcp.full_name} ({hcp.specialty})\n"
            f"Date: {interaction_date.strftime('%B %d, %Y')}\n"
            f"Type: {itype.value.replace('_', ' ').title()}\n"
            f"Products: {', '.join(all_products) if all_products else 'None specified'}\n"
            f"Sentiment: {enrichment['sentiment'].title()}\n"
            f"AI Summary: {enrichment['summary']}\n"
            f"Follow-up Actions: {'; '.join(enrichment['follow_ups']) if enrichment['follow_ups'] else 'None identified'}"
        )


# ─────────────────────────────────────────────────────────────────────────────
# Tool 2: edit_interaction
# ─────────────────────────────────────────────────────────────────────────────

@tool
async def edit_interaction(
    interaction_id: int,
    notes: Optional[str] = None,
    interaction_type: Optional[str] = None,
    date: Optional[str] = None,
    products_discussed: Optional[str] = None,
    follow_up_actions: Optional[str] = None,
) -> str:
    """
    Edit or update an existing HCP interaction record in the CRM.
    
    Use this tool when the user wants to modify, update, correct, or change 
    details of a previously logged interaction.
    
    Args:
        interaction_id: The numeric ID of the interaction to edit
        notes: Updated notes for the interaction (optional - triggers AI re-summarization)
        interaction_type: Updated interaction type (optional)
        date: Updated date in ISO format YYYY-MM-DD (optional)  
        products_discussed: Updated comma-separated list of products (optional)
        follow_up_actions: Updated comma-separated list of follow-up actions (optional)
    
    Returns:
        Confirmation of what was updated, with new AI summary if notes were changed
    """
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Interaction).options(selectinload(Interaction.hcp))
            .where(Interaction.id == interaction_id)
        )
        interaction = result.scalar_one_or_none()
        
        if not interaction:
            return f"No interaction found with ID {interaction_id}. Use get_interaction_history to find valid IDs."
        
        updates = []
        
        # Update notes and re-run AI enrichment if notes changed
        if notes is not None:
            interaction.notes = notes
            enrichment = await _enrich_interaction_with_ai(notes, interaction.interaction_type.value)
            interaction.ai_summary = enrichment["summary"]
            sentiment_map = {"positive": SentimentType.positive, "neutral": SentimentType.neutral, "negative": SentimentType.negative}
            interaction.sentiment = sentiment_map.get(enrichment["sentiment"], SentimentType.neutral)
            interaction.follow_up_actions = enrichment["follow_ups"]
            updates.append(f"Notes updated + AI re-summarized")
        
        # Update interaction type
        if interaction_type is not None:
            type_map = {
                "detail_call": InteractionType.detail_call,
                "phone_call": InteractionType.phone_call,
                "email": InteractionType.email,
                "virtual_meeting": InteractionType.virtual_meeting,
                "sample_drop": InteractionType.sample_drop,
                "conference": InteractionType.conference,
                "follow_up": InteractionType.follow_up,
            }
            new_type = type_map.get(interaction_type.lower().replace(" ", "_"))
            if new_type:
                interaction.interaction_type = new_type
                updates.append(f"Type -> {new_type.value.replace('_', ' ').title()}")
        
        # Update date
        if date is not None:
            try:
                interaction.date = datetime.fromisoformat(date).replace(tzinfo=timezone.utc)
                updates.append(f"Date -> {interaction.date.strftime('%B %d, %Y')}")
            except ValueError:
                pass
        
        # Update products
        if products_discussed is not None:
            interaction.products_discussed = [p.strip() for p in products_discussed.split(",")]
            updates.append(f"Products -> {products_discussed}")
        
        # Update follow-ups (manual override)
        if follow_up_actions is not None:
            interaction.follow_up_actions = [f.strip() for f in follow_up_actions.split(",")]
            updates.append(f"Follow-ups updated")
        
        interaction.updated_at = datetime.now(timezone.utc)
        await session.commit()
        
        hcp_name = interaction.hcp.full_name if interaction.hcp else f"HCP #{interaction.hcp_id}"
        
        return (
            f"Interaction #{interaction_id} updated successfully!\n"
            f"HCP: {hcp_name}\n"
            f"Changes made:\n" + "\n".join(f"  • {u}" for u in updates) +
            (f"\nNew AI Summary: {interaction.ai_summary}" if notes else "")
        )


# ─────────────────────────────────────────────────────────────────────────────
# Tool 3: lookup_hcp
# ─────────────────────────────────────────────────────────────────────────────

@tool
async def lookup_hcp(query: str) -> str:
    """
    Search for Healthcare Professionals (HCPs) in the CRM database.
    
    Use this tool to find doctors by name, specialty, affiliation, or city 
    before logging an interaction, or when the user asks about a specific HCP.
    
    Args:
        query: Search term - can be a doctor's name, specialty (e.g. 'Cardiologist'),
               hospital/clinic name, or city
    
    Returns:
        List of matching HCPs with their ID, name, specialty, and affiliation
    """
    async with AsyncSessionLocal() as session:
        terms = query.replace("Dr.", "").strip().split()
        conditions = []
        for term in terms:
            conditions.extend([
                HCP.first_name.ilike(f"%{term}%"),
                HCP.last_name.ilike(f"%{term}%"),
                HCP.specialty.ilike(f"%{term}%"),
                HCP.affiliation.ilike(f"%{term}%"),
                HCP.city.ilike(f"%{term}%"),
            ])
        
        result = await session.execute(
            select(HCP).where(or_(*conditions)).limit(10)
        )
        hcps = result.scalars().all()
        
        if not hcps:
            return f"No HCPs found matching '{query}'. Try a different name, specialty, or location."
        
        lines = [f"Found {len(hcps)} HCP(s) matching '{query}':\n"]
        for hcp in hcps:
            lines.append(
                f"  • ID: {hcp.id} | {hcp.full_name}\n"
                f"    Specialty: {hcp.specialty or 'N/A'}\n"
                f"    Affiliation: {hcp.affiliation or 'N/A'}\n"
                f"    Location: {hcp.city}, {hcp.state}\n"
                f"    NPI: {hcp.npi_number or 'N/A'}\n"
            )
        return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# Tool 4: get_interaction_history
# ─────────────────────────────────────────────────────────────────────────────

@tool
async def get_interaction_history(
    hcp_name: Optional[str] = None,
    hcp_id: Optional[int] = None,
    interaction_type: Optional[str] = None,
    limit: int = 5,
) -> str:
    """
    Retrieve the history of interactions with a specific HCP or all recent interactions.
    
    Use this tool when the user wants to:
    - Review past interactions before a new visit
    - See what was discussed previously with a doctor
    - Find the IDs of interactions to edit
    - Check their engagement history
    
    Args:
        hcp_name: Name of the HCP to filter by (optional - can use hcp_id instead)
        hcp_id: Numeric ID of the HCP (optional - more precise than name)
        interaction_type: Filter by type: detail_call, phone_call, email, 
                         virtual_meeting, sample_drop, conference, follow_up (optional)
        limit: Maximum number of interactions to return (default 5, max 20)
    
    Returns:
        Formatted list of past interactions with dates, types, and AI summaries
    """
    async with AsyncSessionLocal() as session:
        query = select(Interaction).options(selectinload(Interaction.hcp))
        
        # Filter by HCP
        if hcp_id:
            query = query.where(Interaction.hcp_id == hcp_id)
        elif hcp_name:
            name_parts = hcp_name.replace("Dr.", "").strip().split()
            conditions = []
            for part in name_parts:
                conditions.append(HCP.first_name.ilike(f"%{part}%"))
                conditions.append(HCP.last_name.ilike(f"%{part}%"))
            query = query.join(HCP).where(or_(*conditions))
        
        # Filter by type
        if interaction_type:
            type_map = {
                "detail_call": InteractionType.detail_call,
                "phone_call": InteractionType.phone_call,
                "email": InteractionType.email,
                "virtual_meeting": InteractionType.virtual_meeting,
                "sample_drop": InteractionType.sample_drop,
                "conference": InteractionType.conference,
                "follow_up": InteractionType.follow_up,
            }
            itype = type_map.get(interaction_type.lower().replace(" ", "_"))
            if itype:
                query = query.where(Interaction.interaction_type == itype)
        
        # Order and limit
        query = query.order_by(Interaction.date.desc()).limit(min(limit, 20))
        
        result = await session.execute(query)
        interactions = result.scalars().all()
        
        if not interactions:
            filter_desc = hcp_name or (f"HCP #{hcp_id}" if hcp_id else "all HCPs")
            return f"No interactions found for {filter_desc}."
        
        lines = [f"Found {len(interactions)} interaction(s):\n"]
        for ix in interactions:
            hcp_display = ix.hcp.full_name if ix.hcp else f"HCP #{ix.hcp_id}"
            lines.append(
                f"  ─────────────────────────\n"
                f"  ID: {ix.id}\n"
                f"  HCP: {hcp_display}\n"
                f"  Date: {ix.date.strftime('%B %d, %Y')}\n"
                f"  Type: {ix.interaction_type.value.replace('_', ' ').title()}\n"
                f"  Sentiment: {ix.sentiment.value.title() if ix.sentiment else 'N/A'}\n"
                f"  Products: {', '.join(ix.products_discussed) if ix.products_discussed else 'None'}\n"
                f"  Summary: {ix.ai_summary or ix.notes or 'No notes'}\n"
                f"  Follow-ups: {'; '.join(ix.follow_up_actions) if ix.follow_up_actions else 'None'}\n"
            )
        
        return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# Tool 5: suggest_next_action
# ─────────────────────────────────────────────────────────────────────────────

@tool
async def suggest_next_action(
    hcp_name: Optional[str] = None,
    hcp_id: Optional[int] = None,
) -> str:
    """
    Get an AI-powered Next Best Action recommendation for engaging with a specific HCP.
    
    Use this tool when the user asks what they should do next with a doctor,
    how to follow up, or wants strategic recommendations for their next visit.
    
    This tool uses gemma2-9b-it to analyze the HCP's profile, interaction history,
    sentiment trends, and products discussed to generate actionable recommendations.
    
    Args:
        hcp_name: Name of the HCP to analyze (optional - can use hcp_id instead)
        hcp_id: Numeric ID of the HCP (more precise, optional)
    
    Returns:
        Strategic next best action recommendation with reasoning
    """
    async with AsyncSessionLocal() as session:
        # Find HCP
        if hcp_id:
            result = await session.execute(select(HCP).where(HCP.id == hcp_id))
            hcp = result.scalar_one_or_none()
        elif hcp_name:
            name_parts = hcp_name.replace("Dr.", "").strip().split()
            conditions = [HCP.first_name.ilike(f"%{p}%") for p in name_parts] + \
                         [HCP.last_name.ilike(f"%{p}%") for p in name_parts]
            result = await session.execute(select(HCP).where(or_(*conditions)).limit(1))
            hcp = result.scalar_one_or_none()
        else:
            return "Please provide either an HCP name or HCP ID to get a recommendation."
        
        if not hcp:
            return f"HCP not found. Use lookup_hcp to find the correct name."
        
        # Get recent interactions (last 5)
        ix_result = await session.execute(
            select(Interaction)
            .where(Interaction.hcp_id == hcp.id)
            .order_by(Interaction.date.desc())
            .limit(5)
        )
        interactions = ix_result.scalars().all()
        
        # Build context for the LLM
        if not interactions:
            history_summary = "No previous interactions recorded."
        else:
            history_lines = []
            for ix in interactions:
                history_lines.append(
                    f"- {ix.date.strftime('%Y-%m-%d')}: {ix.interaction_type.value} | "
                    f"Sentiment: {ix.sentiment.value if ix.sentiment else 'unknown'} | "
                    f"Products: {', '.join(ix.products_discussed) if ix.products_discussed else 'none'} | "
                    f"Summary: {ix.ai_summary or 'No summary'}"
                )
            history_summary = "\n".join(history_lines)
        
        # Use gemma2-9b-it for the recommendation
        nlp_llm = get_nlp_llm()
        prompt = f"""You are an expert pharmaceutical field representative coach. 
Based on the HCP profile and interaction history below, provide a specific, actionable Next Best Action recommendation.

HCP Profile:
- Name: {hcp.full_name}
- Specialty: {hcp.specialty}
- Affiliation: {hcp.affiliation}
- Location: {hcp.city}, {hcp.state}

Recent Interaction History (last {len(interactions)} interactions):
{history_summary}

Provide a structured recommendation covering:
1. Recommended next action (call, visit, email, conference invite, etc.)
2. Key talking points or materials to prepare
3. Products to focus on and why
4. Timing recommendation
5. Strategic rationale

Be specific and practical for a pharma field representative."""

        try:
            response = await nlp_llm.ainvoke(prompt)
            recommendation = response.content.strip()
        except Exception as e:
            recommendation = f"AI recommendation unavailable: {str(e)}"
        
        return (
            f"Next Best Action for {hcp.full_name}\n"
            f"{'─' * 50}\n"
            f"Specialty: {hcp.specialty} | {hcp.affiliation}\n"
            f"Analyzed {len(interactions)} recent interaction(s)\n\n"
            f"AI Recommendation (gemma2-9b-it):\n"
            f"{recommendation}"
        )


# ─────────────────────────────────────────────────────────────────────────────
# Export all tools
# ─────────────────────────────────────────────────────────────────────────────

ALL_TOOLS = [
    log_interaction,
    edit_interaction,
    lookup_hcp,
    get_interaction_history,
    suggest_next_action,
]
