from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from backend.database.models import InteractionType, SentimentType


# ── HCP Schemas ─────────────────────────────────────────────────────────────

class HCPBase(BaseModel):
    first_name: str
    last_name: str
    specialty: Optional[str] = None
    affiliation: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    npi_number: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None


class HCPCreate(HCPBase):
    pass


class HCPRead(HCPBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class HCPWithInteractions(HCPRead):
    interactions: List["InteractionRead"] = []


# ── Product Schemas ──────────────────────────────────────────────────────────

class ProductRead(BaseModel):
    id: int
    name: str
    therapeutic_area: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


# ── Interaction Schemas ──────────────────────────────────────────────────────

class InteractionCreate(BaseModel):
    hcp_id: int
    rep_name: str = "Field Representative"
    interaction_type: InteractionType
    date: datetime
    notes: Optional[str] = None
    products_discussed: Optional[List[str]] = []
    follow_up_actions: Optional[List[str]] = []


class InteractionUpdate(BaseModel):
    interaction_type: Optional[InteractionType] = None
    date: Optional[datetime] = None
    notes: Optional[str] = None
    products_discussed: Optional[List[str]] = None
    follow_up_actions: Optional[List[str]] = None
    ai_summary: Optional[str] = None
    sentiment: Optional[SentimentType] = None


class InteractionRead(BaseModel):
    id: int
    hcp_id: int
    rep_name: str
    interaction_type: InteractionType
    date: datetime
    notes: Optional[str] = None
    ai_summary: Optional[str] = None
    sentiment: Optional[SentimentType] = None
    products_discussed: Optional[List[str]] = []
    follow_up_actions: Optional[List[str]] = []
    created_at: datetime
    updated_at: datetime
    hcp: Optional[HCPRead] = None

    class Config:
        from_attributes = True


# ── Chat Schemas ─────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    session_id: str = Field(default="default-session")
    rep_name: str = "Field Representative"


class ChatResponse(BaseModel):
    message: str
    session_id: str
    tool_calls: Optional[List[Any]] = []


# ── Pagination ───────────────────────────────────────────────────────────────

class PaginatedInteractions(BaseModel):
    items: List[InteractionRead]
    total: int
    page: int
    size: int


# Update forward ref
HCPWithInteractions.model_rebuild()
