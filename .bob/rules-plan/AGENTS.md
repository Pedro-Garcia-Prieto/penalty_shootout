# Project Architecture Rules (Non-Obvious Only)

## System Architecture

- **Monorepo with separate runtimes**: Backend (Python/FastAPI) and frontend (React/Vite) run independently
- **External LLM dependency**: Requires local Ollama server - not optional, not cloud-based
- **Data caching strategy**: CSV loaded once at startup via lifespan context manager, cached with `@lru_cache`
- **Proxy pattern**: Frontend proxies `/api` requests to backend via Vite config (not CORS-only)

## Hidden Constraints

- **Shootout detection complexity**: Must check 4 separate CSV columns - any non-empty means shootout exists
- **Kick data parsing**: CSV uses non-standard pipe-delimited format within comma-separated cells
- **Test isolation pattern**: Fixtures must patch imports in TWO locations due to FastAPI's import behavior
- **Random seed design**: `settings.random_seed` controls match selection - enables deterministic testing without mocking
- **Timeout architecture**: 90-second frontend timeout is intentional - LLM generation is inherently slow

## Performance Considerations

- **CSV caching**: Data loaded once at startup, not per-request - lifespan manager ensures this
- **LLM timeout**: 60-second backend timeout for Ollama calls - frontend allows 90 seconds total
- **No database**: All data from static CSV - no persistence layer needed

## Testing Architecture

- **Directory-dependent tests**: Backend tests fail if not run from `backend/` directory
- **Dual patching requirement**: Must patch `load_matches()` in both module and routes import locations
- **Vitest globals**: Test imports not needed - configured globally in vite.config.ts
