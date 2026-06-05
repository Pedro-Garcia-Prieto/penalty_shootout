"""Builds prompts and calls the local Ollama server to generate narratives."""
import logging
from pathlib import Path
from typing import List

import httpx

from app.config import settings
from app.models.schemas import Kick, MatchInfo

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).resolve().parent.parent / "prompts"
SHOOTOUT_PROMPT_PATH = PROMPTS_DIR / "shootout_story.txt"
NO_HISTORY_PROMPT_PATH = PROMPTS_DIR / "no_history_story.txt"


class OllamaUnavailableError(RuntimeError):
    """Raised when the local Ollama server cannot be reached or fails."""


# ---------- Prompt building helpers ----------

def _format_kicks_block(kicks: List[Kick]) -> str:
    if not kicks:
        return "  (no kick-by-kick data available)"
    lines = []
    for k in kicks:
        outcome = "GOAL" if k.scored else "MISS"
        lines.append(
            f"  {k.kick_number}. {k.team} - {k.player} ({outcome}) "
            f"[running score: {k.running_score}]"
        )
    return "\n".join(lines)


def _read_template(path: Path) -> str:
    if not path.exists():
        raise FileNotFoundError(f"Prompt template not found at {path}")
    return path.read_text(encoding="utf-8")


def build_prompt(match: MatchInfo) -> str:
    """Inject match facts into the historical-shootout prompt template."""
    template = _read_template(SHOOTOUT_PROMPT_PATH)
    return template.format(
        year=match.year if match.year is not None else "unknown",
        home_team=match.home_team,
        away_team=match.away_team,
        date=match.date or "unknown",
        venue=match.venue or "unknown",
        score=match.score or "unknown",
        penalty_score=match.penalty_score or "unknown",
        kicks_block=_format_kicks_block(match.kicks),
    )


def build_no_history_prompt(country: str) -> str:
    """Inject the country name into the no-history speculative template."""
    template = _read_template(NO_HISTORY_PROMPT_PATH)
    return template.format(country=country)


# ---------- Ollama HTTP call ----------

async def _call_ollama(prompt: str) -> str:
    """Send a prompt to the local Ollama server and return the response text."""
    url = f"{settings.ollama_url.rstrip('/')}/api/generate"
    # Send the prompt to LitLLM as proxy
    #url = f"{settings.ollama_url.rstrip('/')}/v1/completions"
    payload = {
        "model": settings.ollama_model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.7,
            "top_p": 0.9,
            "num_predict": 400,
        },
    }

    logger.info("Calling Ollama at %s with model %s", url, settings.ollama_model)

    logger.info("PROMPT: %s", payload["prompt"])

    try:
        async with httpx.AsyncClient(timeout=settings.ollama_timeout_seconds) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
    except httpx.TimeoutException as exc:
        logger.error("Ollama request timed out: %s", exc)
        raise OllamaUnavailableError("Ollama request timed out.") from exc
    except httpx.HTTPError as exc:
        logger.error("Ollama HTTP error: %s", exc)
        raise OllamaUnavailableError(f"Ollama HTTP error: {exc}") from exc

    data = response.json()
    text = (data.get("response") or "").strip()
    if not text:
        raise OllamaUnavailableError("Ollama returned an empty response.")
    return text


# ---------- Public API ----------

async def generate_story(match: MatchInfo) -> str:
    """Generate a narrative for a real, historical penalty shootout."""
    prompt = build_prompt(match)
    return await _call_ollama(prompt)


async def generate_story_without_history(country: str) -> str:
    """
    Generate a speculative narrative for a country with NO World Cup
    penalty shootout history. The story focuses on national footballing
    character and the country's likely chances in a future shootout.
    """
    prompt = build_no_history_prompt(country)
    return await _call_ollama(prompt)