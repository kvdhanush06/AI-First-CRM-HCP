"""
AI-First CRM HCP Module – FastAPI Backend
==========================================
Entry point for the backend server.

Run with:
    uvicorn backend.main:app --reload --port 8000
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database.connection import init_db
from backend.database.seed import seed_database
from backend.routers import hcps, products, interactions, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialize DB tables and seed with sample data."""
    print("Starting AI-First CRM HCP Backend...")
    await init_db()
    await seed_database()
    print("Backend ready!")
    yield
    print("Shutting down...")


app = FastAPI(
    title="AI-First CRM HCP Module",
    description=(
        "A pharmaceutical CRM backend for logging and managing HCP interactions "
        "powered by LangGraph (llama-3.3-70b-versatile + gemma2-9b-it via Groq)."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# CORS – allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(hcps.router)
app.include_router(products.router)
app.include_router(interactions.router)
app.include_router(chat.router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "ok",
        "service": "AI-First CRM HCP Module",
        "version": "1.0.0",
        "agent": "LangGraph (llama-3.3-70b-versatile + gemma2-9b-it)",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}
