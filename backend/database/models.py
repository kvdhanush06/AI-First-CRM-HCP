import enum
from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Enum,
    JSON,
    func,
)
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()


class InteractionType(str, enum.Enum):
    detail_call = "detail_call"
    phone_call = "phone_call"
    email = "email"
    virtual_meeting = "virtual_meeting"
    sample_drop = "sample_drop"
    conference = "conference"
    follow_up = "follow_up"


class SentimentType(str, enum.Enum):
    positive = "positive"
    neutral = "neutral"
    negative = "negative"


class HCP(Base):
    __tablename__ = "hcps"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    specialty = Column(String(150))
    affiliation = Column(String(200))
    email = Column(String(200))
    phone = Column(String(20))
    npi_number = Column(String(20))
    city = Column(String(100))
    state = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    interactions = relationship("Interaction", back_populates="hcp", cascade="all, delete-orphan")

    @property
    def full_name(self):
        return f"Dr. {self.first_name} {self.last_name}"


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    therapeutic_area = Column(String(150))
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    hcp_id = Column(Integer, ForeignKey("hcps.id"), nullable=False)
    rep_name = Column(String(150), nullable=False)
    interaction_type = Column(Enum(InteractionType), nullable=False, default=InteractionType.detail_call)
    date = Column(DateTime(timezone=True), nullable=False)
    notes = Column(Text)
    ai_summary = Column(Text)
    sentiment = Column(Enum(SentimentType), default=SentimentType.neutral)
    products_discussed = Column(JSON, default=list)
    follow_up_actions = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    hcp = relationship("HCP", back_populates="interactions")
