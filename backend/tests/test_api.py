"""Unit tests for the story generator and Ollama client."""
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from app.models.schemas import Kick, MatchInfo
from app.services import story_generator
from app.services.story_generator import (
    OllamaUnavailableError,
    build_no_history_prompt,
    build_prompt,
    generate_story,
    generate_story_without_history,
)


# ============================================================
# Helpers
# ============================================================

def _sample_match() -> MatchInfo:
    """Build a representative MatchInfo for prompt-building tests."""
    return MatchInfo(
        home_team="Argentina",
        away_team="France",
        year=2022,
        stage="Final",
        score="3-3",
        penalty_score="4-2",
        kicks=[
            Kick(team="France", kick_number=1, running_score="1-0",
                 player="Mbappé", scored=True),
            Kick(team="Argentina", kick_number=2, running_score="1-1",
                 player="Messi", scored=True),
            Kick(team="France", kick_number=3, running_score="1-1",
                 player="Coman", scored=False),
        ],
    )


def _mock_async_client(json_payload=None, raise_exc=None,
                       raise_for_status_exc=None):
    """
    Build a mocked httpx.AsyncClient context manager.

    - json_payload: dict returned by response.json()
    - raise_exc: exception raised by client.post(...)
    - raise_for_status_exc: exception raised by response.raise_for_status()
    """
    mock_response = MagicMock()
    if raise_for_status_exc is not None:
        mock_response.raise_for_status = MagicMock(side_effect=raise_for_status_exc)
    else:
        mock_response.raise_for_status = MagicMock()
    mock_response.json = MagicMock(return_value=json_payload or {})

    mock_client = MagicMock()
    if raise_exc is not None:
        mock_client.post = AsyncMock(side_effect=raise_exc)
    else:
        mock_client.post = AsyncMock(return_value=mock_response)

    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=mock_client)
    cm.__aexit__ = AsyncMock(return_value=False)
    return cm, mock_client


# ============================================================
# Prompt building
# ============================================================

def test_build_prompt_contains_all_facts():
    prompt = build_prompt(_sample_match())
    for needle in ["Argentina", "France", "2022", "Final",
                   "3-3", "4-2", "Mbappé", "Messi", "Coman", "GOAL", "MISS"]:
        assert needle in prompt


def test_build_prompt_handles_missing_optional_fields():
    match = MatchInfo(
        home_team="Spain",
        away_team="Italy",
        year=None,
        stage=None,
        score=None,
        penalty_score=None,
        kicks=[],
    )
    prompt = build_prompt(match)
    assert "Spain" in prompt
    assert "Italy" in prompt
    assert "unknown" in prompt  # fallback for missing year / score
    assert "no kick-by-kick data available" in prompt


def test_build_no_history_prompt_contains_country():
    prompt = build_no_history_prompt("Canada")
    assert "Canada" in prompt


def test_build_no_history_prompt_uses_football_jargon():
    prompt = build_no_history_prompt("Norway")
    # The template must include at least one piece of football jargon.
    assert any(term in prompt for term in
               ["twelve yards", "spot kick", "nerves of steel",
                "ice in the veins", "dreaded lottery"])


# ============================================================
# generate_story — happy path
# ============================================================

@pytest.mark.asyncio
async def test_generate_story_returns_trimmed_text():
    cm, _ = _mock_async_client(
        json_payload={"response": "  A thrilling shootout in Lusail.  "}
    )
    with patch.object(story_generator.httpx, "AsyncClient", return_value=cm):
        story = await generate_story(_sample_match())
    assert story == "A thrilling shootout in Lusail."


@pytest.mark.asyncio
async def test_generate_story_sends_correct_payload():
    cm, mock_client = _mock_async_client(
        json_payload={"response": "ok"}
    )
    with patch.object(story_generator.httpx, "AsyncClient", return_value=cm):
        await generate_story(_sample_match())

    # Inspect the payload sent to Ollama.
    mock_client.post.assert_awaited_once()
    _, kwargs = mock_client.post.call_args
    payload = kwargs["json"]

    assert payload["model"] == story_generator.settings.ollama_model
    assert payload["stream"] is False
    assert "Argentina" in payload["prompt"]
    assert "options" in payload
    assert payload["options"]["temperature"] == 0.7


@pytest.mark.asyncio
async def test_generate_story_calls_correct_url():
    cm, mock_client = _mock_async_client(json_payload={"response": "ok"})
    with patch.object(story_generator.httpx, "AsyncClient", return_value=cm):
        await generate_story(_sample_match())

    args, _ = mock_client.post.call_args
    expected_url = (
        f"{story_generator.settings.ollama_url.rstrip('/')}/api/generate"
    )
    assert args[0] == expected_url


# ============================================================
# generate_story_without_history — happy path
# ============================================================

@pytest.mark.asyncio
async def test_generate_story_without_history_returns_text():
    cm, _ = _mock_async_client(json_payload={"response": "Speculative tale."})
    with patch.object(story_generator.httpx, "AsyncClient", return_value=cm):
        story = await generate_story_without_history("Canada")
    assert story == "Speculative tale."


@pytest.mark.asyncio
async def test_generate_story_without_history_includes_country_in_prompt():
    cm, mock_client = _mock_async_client(json_payload={"response": "ok"})
    with patch.object(story_generator.httpx, "AsyncClient", return_value=cm):
        await generate_story_without_history("Norway")

    _, kwargs = mock_client.post.call_args
    assert "Norway" in kwargs["json"]["prompt"]


# ============================================================
# Error handling — Ollama failures
# ============================================================

@pytest.mark.asyncio
async def test_generate_story_raises_on_timeout():
    cm, _ = _mock_async_client(raise_exc=httpx.TimeoutException("timed out"))
    with patch.object(story_generator.httpx, "AsyncClient", return_value=cm):
        with pytest.raises(OllamaUnavailableError, match="timed out"):
            await generate_story(_sample_match())


@pytest.mark.asyncio
async def test_generate_story_raises_on_http_error():
    cm, _ = _mock_async_client(raise_exc=httpx.ConnectError("refused"))
    with patch.object(story_generator.httpx, "AsyncClient", return_value=cm):
        with pytest.raises(OllamaUnavailableError, match="HTTP error"):
            await generate_story(_sample_match())


@pytest.mark.asyncio
async def test_generate_story_raises_on_non_2xx_status():
    http_err = httpx.HTTPStatusError(
        "500 Server Error",
        request=MagicMock(),
        response=MagicMock(status_code=500),
    )
    cm, _ = _mock_async_client(
        json_payload={"response": "ignored"},
        raise_for_status_exc=http_err,
    )
    with patch.object(story_generator.httpx, "AsyncClient", return_value=cm):
        with pytest.raises(OllamaUnavailableError):
            await generate_story(_sample_match())


@pytest.mark.asyncio
async def test_generate_story_raises_on_empty_response():
    cm, _ = _mock_async_client(json_payload={"response": "   "})
    with patch.object(story_generator.httpx, "AsyncClient", return_value=cm):
        with pytest.raises(OllamaUnavailableError, match="empty"):
            await generate_story(_sample_match())


@pytest.mark.asyncio
async def test_generate_story_raises_when_response_field_missing():
    cm, _ = _mock_async_client(json_payload={})  # no "response" key
    with patch.object(story_generator.httpx, "AsyncClient", return_value=cm):
        with pytest.raises(OllamaUnavailableError):
            await generate_story(_sample_match())


@pytest.mark.asyncio
async def test_generate_story_without_history_propagates_errors():
    cm, _ = _mock_async_client(raise_exc=httpx.TimeoutException("slow"))
    with patch.object(story_generator.httpx, "AsyncClient", return_value=cm):
        with pytest.raises(OllamaUnavailableError):
            await generate_story_without_history("Canada")