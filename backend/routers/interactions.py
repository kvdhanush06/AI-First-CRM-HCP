from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from backend.database.connection import get_db
from backend.database.models import HCP, Interaction, InteractionType
from backend.schemas import InteractionCreate, InteractionRead, InteractionUpdate, PaginatedInteractions
from backend.agent.tools import _enrich_interaction_with_ai

router = APIRouter(prefix="/api/interactions", tags=["Interactions"])


@router.post("", response_model=InteractionRead, status_code=201)
async def create_interaction(
    payload: InteractionCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new HCP interaction (from the structured form). AI enrichment is applied automatically."""
    # Validate HCP exists
    hcp_result = await db.execute(select(HCP).where(HCP.id == payload.hcp_id))
    hcp = hcp_result.scalar_one_or_none()
    if not hcp:
        raise HTTPException(status_code=404, detail=f"HCP with id {payload.hcp_id} not found")
    
    # AI enrichment
    enrichment = await _enrich_interaction_with_ai(
        payload.notes or "",
        payload.interaction_type.value,
    )
    
    # Merge products
    from backend.database.models import SentimentType
    sentiment_map = {
        "positive": SentimentType.positive,
        "neutral": SentimentType.neutral,
        "negative": SentimentType.negative,
    }
    
    all_products = list(set((payload.products_discussed or []) + enrichment["products"]))
    
    interaction = Interaction(
        hcp_id=payload.hcp_id,
        rep_name=payload.rep_name,
        interaction_type=payload.interaction_type,
        date=payload.date,
        notes=payload.notes,
        ai_summary=enrichment["summary"],
        sentiment=sentiment_map.get(enrichment["sentiment"], SentimentType.neutral),
        products_discussed=all_products,
        follow_up_actions=enrichment["follow_ups"] or payload.follow_up_actions or [],
    )
    db.add(interaction)
    await db.commit()
    await db.refresh(interaction)
    
    # Reload with HCP relationship
    result = await db.execute(
        select(Interaction)
        .options(selectinload(Interaction.hcp))
        .where(Interaction.id == interaction.id)
    )
    return result.scalar_one()


@router.get("", response_model=PaginatedInteractions)
async def list_interactions(
    hcp_id: Optional[int] = Query(None),
    interaction_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List interactions with optional filters and pagination."""
    query = select(Interaction).options(selectinload(Interaction.hcp))
    count_query = select(func.count(Interaction.id))
    
    if hcp_id:
        query = query.where(Interaction.hcp_id == hcp_id)
        count_query = count_query.where(Interaction.hcp_id == hcp_id)
    
    if interaction_type:
        try:
            itype = InteractionType(interaction_type)
            query = query.where(Interaction.interaction_type == itype)
            count_query = count_query.where(Interaction.interaction_type == itype)
        except ValueError:
            pass
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    query = query.order_by(Interaction.date.desc()).offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    
    return {"items": result.scalars().all(), "total": total, "page": page, "size": size}


@router.get("/{interaction_id}", response_model=InteractionRead)
async def get_interaction(interaction_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single interaction by ID."""
    result = await db.execute(
        select(Interaction)
        .options(selectinload(Interaction.hcp))
        .where(Interaction.id == interaction_id)
    )
    interaction = result.scalar_one_or_none()
    if not interaction:
        raise HTTPException(status_code=404, detail=f"Interaction {interaction_id} not found")
    return interaction


@router.put("/{interaction_id}", response_model=InteractionRead)
async def update_interaction(
    interaction_id: int,
    payload: InteractionUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing interaction. If notes are updated, AI re-summarization is triggered."""
    result = await db.execute(
        select(Interaction)
        .options(selectinload(Interaction.hcp))
        .where(Interaction.id == interaction_id)
    )
    interaction = result.scalar_one_or_none()
    if not interaction:
        raise HTTPException(status_code=404, detail=f"Interaction {interaction_id} not found")
    
    update_data = payload.model_dump(exclude_unset=True)
    
    # Re-run AI enrichment if notes changed
    if "notes" in update_data and update_data["notes"]:
        from backend.database.models import SentimentType
        enrichment = _enrich_interaction_with_ai(update_data["notes"], interaction.interaction_type.value)
        interaction.ai_summary = enrichment["summary"]
        sentiment_map = {"positive": SentimentType.positive, "neutral": SentimentType.neutral, "negative": SentimentType.negative}
        interaction.sentiment = sentiment_map.get(enrichment["sentiment"], SentimentType.neutral)
        if not update_data.get("follow_up_actions"):
            interaction.follow_up_actions = enrichment["follow_ups"]
    
    for field, value in update_data.items():
        setattr(interaction, field, value)
    
    interaction.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(interaction)
    
    result = await db.execute(
        select(Interaction).options(selectinload(Interaction.hcp)).where(Interaction.id == interaction_id)
    )
    return result.scalar_one()


@router.delete("/{interaction_id}", status_code=204)
async def delete_interaction(interaction_id: int, db: AsyncSession = Depends(get_db)):
    """Delete an interaction."""
    result = await db.execute(select(Interaction).where(Interaction.id == interaction_id))
    interaction = result.scalar_one_or_none()
    if not interaction:
        raise HTTPException(status_code=404, detail=f"Interaction {interaction_id} not found")
    await db.delete(interaction)
    await db.commit()
