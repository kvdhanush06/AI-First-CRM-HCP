# AI-First CRM for HCPs (Healthcare Professionals)

An AI-first Customer Relationship Management (CRM) module focused on the pharmaceutical representative workflow of logging and managing interactions with Healthcare Professionals (HCPs).

This project consists of a **Vite + React + Redux** frontend, a **FastAPI** backend, and a **LangGraph-powered AI Agent** integrated with Groq LLMs.

---

## Key Features

1. **Dual-Interface Logging**:
   - **Conversational Chat**: Type or speak natural language commands (e.g. _"Log a virtual meeting with Dr. Sarah Jenkins yesterday about Lipitor. She had concerns about side effects and requested clinical trials."_). The LangGraph agent identifies the doctor, logs the interaction, selects the products discussed, and triggers follow-up actions automatically.
   - **Structured CRM Form**: A classic, highly functional form with autocompleting HCP selectors, therapeutic product grids, and editable task checklists.
2. **AI-Extracted Insights**:
   - Every note is analyzed for executive summaries, doctor sentiment evaluation, and actionable follow-ups.
3. **Audit Trail Logs**:
   - Full history of interaction logs with options to edit and delete logs. Editing notes will automatically trigger AI re-summarization.
4. **HCP Directory**:
   - Detailed profiles including NPI, specialty, affiliation, and a history tree of past representative calls.

---

## Tech Stack & Architecture

### Frontend

- **Framework**: React 18 + Vite (fast developer server)
- **State Management**: Redux Toolkit (managing slices for HCPs, logs, chat messages, and UI states)
- **Styling**: Vanilla CSS (Premium Dark Theme, Glassmorphism, custom bouncing animations, responsive grid layouts)
- **Icons**: Lucide React

### Backend

- **Framework**: FastAPI (high performance, asynchronous endpoints)
- **Database**: PostgreSQL 16
- **ORM**: SQLAlchemy (asyncpg async engine + session factory)
- **AI Agent Orchestration**: LangGraph (StateGraph with MemorySaver for session history)
- **Models**:
  - `llama-3.3-70b-versatile` (via Groq) for reasoning, tool calling, and workflow steering.
  - `gemma2-9b-it` (via Groq) for summarization, entity extraction, and sentiment.

---

## Project Structure

```text
AI-First-CRM-HCP/
├── backend/
│   ├── agent/                 # LangGraph Agent logic
│   │   ├── __init__.py
│   │   ├── graph.py          # StateGraph definitions
│   │   ├── llm.py            # Groq model configurations
│   │   └── tools.py          # 5 agent tool functions
│   ├── database/              # DB connection and seeding
│   │   ├── connection.py
│   │   ├── models.py         # SQLAlchemy tables (HCP, Product, Interaction)
│   │   └── seed.py           # Sample HCP & Product database seeders
│   ├── routers/               # FastAPI controllers
│   │   ├── chat.py
│   │   ├── hcps.py
│   │   ├── interactions.py
│   │   └── products.py
│   ├── config.py              # Pydantic environment configurations
│   ├── main.py                # FastAPI initialization and lifespan setup
│   ├── schemas.py             # Pydantic schemas (DTOs)
│   ├── requirements.txt
│   └── Dockerfile             # Backend Docker configuration
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/          # ChatInterface, ChatMessage, ToolCallBadge
│   │   │   ├── common/        # AIInsightPanel
│   │   │   ├── interactions/  # InteractionForm
│   │   │   └── layout/        # Sidebar, TopBar
│   │   ├── pages/             # DashboardPage, LogInteractionPage, HCPDirectoryPage, InteractionHistoryPage
│   │   ├── store/             # store.js & slices (hcpSlice, interactionSlice, chatSlice, uiSlice)
│   │   ├── App.jsx            # Routing, floating toast notification layout
│   │   ├── index.css          # Design system variable definitions & utility styles
│   │   └── main.jsx
│   ├── index.html
│   ├── nginx.conf             # Nginx reverse proxy configuration for Docker
│   ├── package.json
│   ├── Dockerfile             # Frontend Docker configuration
│   └── vite.config.js         # Port proxy rules (/api -> port 8000)
├── docker-compose.yml         # PostgreSQL image spin-up
└── README.md
```

---

## Configuration (.env files)

The application requires setting up environment configurations on the backend. No separate configuration is needed for the frontend (the Vite proxy handles development, and Nginx handles Docker proxying automatically).

### Backend `.env` Setup

Create a file named `.env` in the `backend/` directory:

```bash
# In backend/ directory
cp .env.example .env
```

Open `backend/.env` and update the values:

1. **`GROQ_API_KEY`**: Obtain your API Key from the Groq Console and add it here.
2. **`DATABASE_URL`**: Change this based on how you run the application:
   - **Local Development (No Docker or Local DB)**:
     `DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/crm_hcp`
   - **Docker Containers separately (with network bridge)**:
     `DATABASE_URL=postgresql+asyncpg://postgres:postgres@crm_postgres:5432/crm_hcp`

---

## Running Locally (Direct Commands)

### 1. Spin up Database (PostgreSQL)

We use Docker Compose to run the PostgreSQL database locally:

```bash
# Run from the project root
docker-compose up -d postgres
```

This spins up PostgreSQL on port `5432` with username `postgres`, password `postgres`, and database `crm_hcp`.

### 2. Start the Backend Server

Navigate to the `backend/` directory:

```bash
cd backend
python -m venv venv
# Activate the virtual environment:
# - On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# - On macOS/Linux:
source venv/bin/activate

# Install dependencies:
pip install -r requirements.txt

# Run server:
uvicorn backend.main:app --reload --port 8000
```

_Note: On startup, the database schemas are created, and seeded with sample HCP profiles, pharmaceutical products, and past interactions._

### 3. Start the Frontend Dev Server

In a new terminal, navigate to the `frontend/` directory:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. The Vite server proxies all `/api/*` requests to the FastAPI backend running on port `8000`.

---

## Running in Docker (Separate Containers)

Follow these commands to build and run the services in separate Docker containers.

### 1. Create a Docker Network

Create a bridge network so containers can communicate using their container names as hostnames:

```bash
docker network create crm-network
```

### 2. Run the PostgreSQL Database

```bash
docker run -d \
  --name crm_postgres \
  --network crm-network \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=crm_hcp \
  -p 5432:5432 \
  -v crm_postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine
```

### 3. Build & Run the Backend Container

Compile the backend image and run it within the same network. Pass the `GROQ_API_KEY` and the updated database hostname (`crm_postgres`):

```bash
# Run from the project root
docker build -t crm-backend -f backend/Dockerfile .

# Run the container (named "backend" to match Nginx proxy targets)
docker run -d \
  --name backend \
  --network crm-network \
  -p 8000:8000 \
  -e GROQ_API_KEY=gsk_your_actual_key_here \
  -e DATABASE_URL=postgresql+asyncpg://postgres:postgres@crm_postgres:5432/crm_hcp \
  crm-backend
```

### 4. Build & Run the Frontend Container

Compile the React build and serve it using Nginx. The Nginx server automatically routes traffic on port 80:

```bash
# Run from the project root
docker build -t crm-frontend -f frontend/Dockerfile .

# Run the container
docker run -d \
  --name crm_frontend_app \
  --network crm-network \
  -p 80:80 \
  crm-frontend
```

Open `http://localhost` (or `http://localhost:80`) in your browser to interact with the application.
