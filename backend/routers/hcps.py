from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload

from backend.database.connection import get_db
from backend.database.models import HCP
from backend.schemas import HCPRead, HCPWithInteractions

router = APIRouter(prefix="/api/hcps", tags=["HCPs"])


@router.get("", response_model=list[HCPRead])
async def list_hcps(
    search: Optional[str] = Query(None, description="Search by name, specialty, or affiliation"),
    db: AsyncSession = Depends(get_db),
):
    """List all HCPs with optional search filter."""
    query = select(HCP)
    
    if search:
        terms = search.replace("Dr.", "").strip().split()
        conditions = []
        for term in terms:
            conditions.extend([
                HCP.first_name.ilike(f"%{term}%"),
                HCP.last_name.ilike(f"%{term}%"),
                HCP.specialty.ilike(f"%{term}%"),
                HCP.affiliation.ilike(f"%{term}%"),
                HCP.city.ilike(f"%{term}%"),
            ])
        query = query.where(or_(*conditions))
    
    query = query.order_by(HCP.last_name)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{hcp_id}", response_model=HCPWithInteractions)
async def get_hcp(hcp_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single HCP with their full interaction history."""
    result = await db.execute(
        select(HCP)
        .options(selectinload(HCP.interactions))
        .where(HCP.id == hcp_id)
    )
    hcp = result.scalar_one_or_none()
    if not hcp:
        raise HTTPException(status_code=404, detail=f"HCP with id {hcp_id} not found")
    return hcp
