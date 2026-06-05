# World Cup Penalty Shootout Storyteller

A full-stack app that lets users pick a national team and generate a narrative about a historical FIFA World Cup penalty shootout involving that country. If the selected country has no World Cup shootout history, the app generates a speculative story instead.

## Project structure

- [`backend/`](backend/) — FastAPI API, CSV data loading, shootout parsing, and Ollama-powered story generation
- [`frontend/`](frontend/) — React + TypeScript UI for selecting countries and displaying generated stories
- [`backend/data/matches_1930_2022.csv`](backend/data/matches_1930_2022.csv) — historical World Cup match dataset

## Features

- Browse a curated list of World Cup countries
- Find historical penalty shootouts for a selected country
- Parse kick-by-kick shootout data from CSV fields
- Generate AI-written stories using a local Ollama model
- Fall back to speculative storytelling when no historical shootout exists

## Tech stack

### Backend

- Python
- FastAPI
- Pandas
- Pydantic
- HTTPX
- Pytest

### Frontend

- React
- TypeScript
- Vite
- Vitest

## Requirements

### Backend

- Python 3.11+ recommended
- A virtual environment
- Local Ollama server running at `http://localhost:11434`
- Ollama model available locally, for example `llama3.1:8b`

### Frontend

- Node.js 18+ recommended
- npm

## Backend setup

From [`backend/`](backend/):

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

## Frontend setup

From [`frontend/`](frontend/):

```bash
npm install
cp .env.example .env
npm run dev
```

The frontend will usually run at `http://localhost:5173`.

## Running tests

### Backend tests

Run from [`backend/`](backend/) with the virtual environment activated:

```bash
pytest -v
```

### Frontend tests

Run from [`frontend/`](frontend/):

```bash
npm test
```

## API overview

### [`GET /api/countries`](backend/app/api/routes.py)

Returns the curated list of countries available in the UI.

### [`POST /api/story`](backend/app/api/routes.py)

Generates a story for the selected country.

Example request body:

```json
{
  "country": "Spain"
}
```

Example response shape:

```json
{
  "country": "Spain",
  "has_history": true,
  "match": {
    "home_team": "Spain",
    "away_team": "Italy",
    "date": "1934-06-01",
    "year": 1934,
    "venue": "Example Stadium",
    "score": "1-1",
    "penalty_score": "4-2",
    "kicks": []
  },
  "story": "..."
}
```

## Notes

- Backend logging is configured in [`backend/app/main.py`](backend/app/main.py) and prints to the terminal running the API
- Frontend API requests default to `http://localhost:8000/api` if [`VITE_API_BASE_URL`](frontend/src/api/client.ts:1) is not set
- Frontend request timeout is 90 seconds because LLM responses may be slow
- The backend loads the CSV once and caches it for the process lifetime

## Git and secrets

The repository includes [`.gitignore`](.gitignore) to avoid committing:

- local environment files
- Python virtual environments and caches
- frontend dependencies and build output
- editor and OS-specific files

Do not commit real secrets from [`backend/.env`](backend/.env) or [`frontend/.env`](frontend/.env).

## Future improvements

- Add Docker support
- Add end-to-end tests
- Improve prompt templates
- Expose more match metadata such as stage and venue consistently
- Add deployment instructions
