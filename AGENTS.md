# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Structure
- **pytest configuration**: Backend requires `pyproject.toml` with `pythonpath = ["."]` for tests to find the `app` module

- Monorepo: Python FastAPI backend + React TypeScript frontend
- Backend runs on port 8000, frontend on 5173 with `/api` proxy in vite.config.ts
- CSV data source: `backend/data/matches_1930_2022.csv` (World Cup matches 1930-2022)

## Running Tests

**Backend**: Must run from `backend/` directory with venv activated:

```bash
cd backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pytest tests/test_<specific_file>.py -v
```

**Frontend**: Run from `frontend/` directory:

```bash
cd frontend
npm test -- <ComponentName>  # runs specific test file matching pattern
```

## Critical Non-Obvious Patterns

### Backend

- **Ollama dependency**: Backend requires local Ollama server at `http://localhost:11434` with `llama3.1:8b` model
- **CSV caching**: `load_matches()` uses `@lru_cache` - data loaded once at startup via lifespan context manager
- **Shootout detection**: Uses 4 columns (`*_penalty_shootout_goal_long`, `*_penalty_shootout_miss_long`) - match has shootout if ANY column has content
- **Kick parsing format**: CSV uses `kick_number|running_score|player` format (e.g., `"1|1-0|Mbappé, 3|2-1|Messi"`)
- **Random seed**: `settings.random_seed` controls match selection for deterministic testing
- **Prompt templates**: Located in `backend/app/prompts/` - two templates for history vs no-history scenarios
- **Test fixtures**: `conftest.py` patches `data_loader.load_matches()` in TWO places (module + routes import)

### Frontend

- **API timeout**: Set to 90 seconds (`90_000ms`) in `client.ts` because LLM responses are slow
- **Vitest globals**: Test setup uses `globals: true` in vite.config.ts - no need to import `describe`/`it`/`expect`
- **Environment variable**: `VITE_API_BASE_URL` defaults to `http://localhost:8000/api` if not set

## Code Style

- Backend: Type hints required, async/await for I/O operations
- Frontend: TypeScript strict mode, React 19 with functional components
- Both: Descriptive variable names, docstrings/comments for non-obvious logic
