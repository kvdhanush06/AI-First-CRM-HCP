from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database.connection import get_db
from backend.database.models import Product
from backend.schemas import ProductRead

router = APIRouter(prefix="/api/products", tags=["Products"])


@router.get("", response_model=list[ProductRead])
async def list_products(db: AsyncSession = Depends(get_db)):
    """List all pharmaceutical products."""
    result = await db.execute(select(Product).order_by(Product.name))
    return result.scalars().all()
