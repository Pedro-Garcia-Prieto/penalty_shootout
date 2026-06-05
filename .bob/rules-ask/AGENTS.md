# Project Documentation Rules (Non-Obvious Only)

## Architecture Context

- **Monorepo structure**: Backend (FastAPI/Python) and frontend (React/TypeScript) are separate but related
- **Data flow**: CSV → pandas DataFrame → cached at startup → random selection → LLM prompt → narrative response
- **External dependency**: Ollama LLM server must be running locally - not a cloud service

## Non-Obvious Patterns

- **Shootout data format**: CSV uses pipe-delimited format within cells: `kick_number|running_score|player`
- **Dual template system**: Two prompt templates exist - one for historical shootouts, one for countries without history
- **Test data patching**: Tests patch `load_matches()` in TWO import locations due to how FastAPI imports work
- **Random seed control**: `settings.random_seed` enables deterministic testing - not just for production randomness
- **Timeout reasoning**: Frontend uses 90-second timeout specifically because LLM generation is slow

## Directory-Specific Commands

- **Backend tests**: Must run from `backend/` directory with activated venv
- **Frontend tests**: Must run from `frontend/` directory
- **CSV location**: Data file is at `backend/data/matches_1930_2022.csv` (not in root)
