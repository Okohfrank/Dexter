# Dexter — Autonomous AI Social Media Employee

Dexter is a memory-centric, autonomous AI social media management backend. It securely connects to social media platforms, generates strategies, schedules posts, and learns from analytics to continuously improve social media performance for businesses.

## Architecture Overview
Dexter is built with a **memory-centric architecture**. AI agents rely on a specialized `MemoryEngine` to recall past contexts, learn from historical data, and act with context. The architecture layers are:
- **API Routes**: Thin FastAPI controllers.
- **Services layer**: Business logic (Auth, OAuth, Publishing).
- **Workers**: ARQ + Redis background jobs for heavy or scheduled tasks.
- **Event Bus**: Internal pub/sub for decoupling components and triggering reactions.

## Tech Stack
- **Python 3.10+** (Async everywhere)
- **FastAPI** (Web framework)
- **SQLAlchemy 2.0** + **Asyncpg** (Database ORM & Driver)
- **Alembic** (Database migrations)
- **Pydantic v2** (Validation & Schemas)
- **ARQ** (Redis-based job queue)
- **Structlog** (Structured JSON logging)
- **Pytest** (Testing)

## Setup Instructions

### Prerequisites
- Python 3.10+
- PostgreSQL
- Redis

### Installation

1. **Clone and Setup Virtual Environment:**
   ```bash
   git clone <repo-url> dexter
   cd dexter/backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Variables:**
   Create a `.env` file in the `backend` directory:
   ```env
   ENVIRONMENT=development
   APP_NAME=Dexter
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/dexter
   REDIS_URL=redis://localhost:6379/0
   SECRET_KEY=your-secret-key-here
   TOKEN_ENCRYPTION_KEY=32-byte-base64-key-here
   LINKEDIN_CLIENT_ID=your-client-id
   LINKEDIN_CLIENT_SECRET=your-client-secret
   ```

4. **Database & Migrations:**
   Ensure PostgreSQL is running and the database `dexter` exists.
   ```bash
   alembic upgrade head
   ```

5. **Run the API Server:**
   ```bash
   uvicorn app.main:app --reload
   ```

6. **Run the Worker:**
   ```bash
   arq app.workers.arq_app.WorkerSettings
   ```

## API Endpoints Summary

- `GET /health` - Health check.
- `POST /api/v1/auth/register` - Register a new user.
- `POST /api/v1/auth/login` - Authenticate & get JWT.
- `GET /api/v1/oauth/{platform}/authorize` - Get OAuth URL for a platform.
- `GET /api/v1/oauth/{platform}/callback` - OAuth callback handler.
- `POST /api/v1/publish/` - Schedule/Publish content.
- `GET /api/v1/publish/{post_id}/status` - Get post status.

## Development Guidelines

1. **Async Everywhere**: Use async/await for all I/O bound operations.
2. **Type Annotations**: Provide type hints for all function parameters and return types.
3. **No Business Logic in Routes**: Routes should be thin, delegating to the Services layer.
4. **Structured Logging**: Use `structlog` (`app.core.logging.get_logger`), never `print()`.
5. **Dependency Injection**: Utilize FastAPI's `Depends()` for DB sessions and services.
6. **Error Handling**: Use custom exceptions from `app.core.exceptions`.

## Project Structure

```text
backend/
├── alembic/              # Database migrations
├── app/
│   ├── api/              # FastAPI routes and dependencies
│   ├── core/             # Configuration, Database, Security, Exceptions
│   ├── events/           # Event Bus and Factories
│   ├── integrations/     # Third-party platform clients (LinkedIn, etc.)
│   ├── memory/           # Memory Engine logic
│   ├── models/           # SQLAlchemy models
│   ├── publishing/       # Publishing interfaces and implementations
│   ├── schemas/          # Pydantic models (DTOs)
│   ├── services/         # Business logic layer
│   ├── utils/            # Helpers (Crypto, etc.)
│   └── workers/          # Background tasks and ARQ config
├── tests/                # Pytest test suite
├── alembic.ini           # Alembic configuration
└── main.py               # FastAPI application entrypoint
```

## Phase Roadmap
- **Phase 1**: Core Setup & Data Models
- **Phase 2**: Services, Workers, and API (Current)
- **Phase 3**: AI Integration & Memory Engine
- **Phase 4**: Analytics & Automated Strategies
