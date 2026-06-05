# Project Advanced Coding Rules (Non-Obvious Only)

## Backend Critical Patterns

- **pytest configuration**: Backend requires `pyproject.toml` with `pythonpath = ["."]` for tests to find the `app` module

- **Dual patching required**: Test fixtures must patch `data_loader.load_matches()` in BOTH `app.services.data_loader` AND `app.api.routes` modules (see `conftest.py:69-74`)
- **Shootout detection logic**: Match has shootout if ANY of 4 columns has content - don't check just one column
- **Kick format parsing**: CSV format is `kick_number|running_score|player` - must split on pipes, not commas (commas separate kicks)
- **Random seed usage**: Use `settings.random_seed` for deterministic selection - creates Random instance if set, uses global random if None
- **Prompt template paths**: Templates in `backend/app/prompts/` - use `Path(__file__).resolve().parent.parent / "prompts"` pattern
- **Ollama integration**: Backend requires local Ollama server at `http://localhost:11434` with `llama3.1:8b` model - not mocked in tests

## Frontend Critical Patterns

- **90-second timeout**: API client timeout is `90_000ms` (not default) because LLM responses are slow
- **Vitest globals enabled**: No need to import `describe`/`it`/`expect` - configured in vite.config.ts
- **Environment variable fallback**: `VITE_API_BASE_URL` has hardcoded fallback to `http://localhost:8000/api`
- **Proxy configuration**: Frontend proxies `/api` to backend via vite.config.ts server settings

## Testing Requirements

- **Backend tests**: MUST run from `backend/` directory with venv activated - pytest won't find modules otherwise
- **Frontend tests**: Run from `frontend/` directory - use `npm test -- <ComponentName>` for specific tests
