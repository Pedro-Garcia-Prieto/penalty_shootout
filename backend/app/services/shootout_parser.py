"""Parses penalty shootout strings from the matches CSV into structured kicks."""
import ast
import logging
from typing import List, Optional
import pandas as pd

from app.models.schemas import Kick

logger = logging.getLogger(__name__)


def _parse_single_kick(raw: str, team: str, scored: bool) -> Optional[Kick]:
    """Parse one 'kick_number|running_score|player' triplet."""
    parts = [p.strip() for p in raw.split("|")]
    if len(parts) < 3:
        logger.warning("Skipping malformed kick entry: %r", raw)
        return None
    try:
        kick_number = int(parts[0])
    except ValueError:
        logger.warning("Skipping kick with non-integer order: %r", raw)
        return None
    running_score = parts[1].replace(":", "-")
    player = "|".join(parts[2:]).strip()
    return Kick(
        team=team,
        kick_number=kick_number,
        running_score=running_score,
        player=player,
        scored=scored,
    )


def _coerce_entries(value) -> List[str]:
    """Normalize a shootout field into a list of raw kick strings."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return []

    if isinstance(value, list):
        return [str(entry).strip() for entry in value if str(entry).strip()]

    text = str(value).strip()
    if not text:
        return []

    if text.startswith("[") and text.endswith("]"):
        try:
            parsed = ast.literal_eval(text)
        except (SyntaxError, ValueError):
            parsed = None
        if isinstance(parsed, list):
            return [str(entry).strip() for entry in parsed if str(entry).strip()]

    return [entry.strip() for entry in text.split(",") if entry.strip()]


def _parse_field(value, team: str, scored: bool) -> List[Kick]:
    """Split a kicks field and parse each entry."""
    kicks: List[Kick] = []
    for entry in _coerce_entries(value):
        kick = _parse_single_kick(entry, team=team, scored=scored)
        if kick is not None:
            kicks.append(kick)
    return kicks


def parse_shootout(row: pd.Series) -> List[Kick]:
    """Build the chronologically-ordered list of kicks for a match row."""
    home = str(row.get("home_team", "Home"))
    away = str(row.get("away_team", "Away"))

    kicks: List[Kick] = []
    kicks += _parse_field(row.get("home_penalty_shootout_goal_long"), home, True)
    kicks += _parse_field(row.get("home_penalty_shootout_miss_long"), home, False)
    kicks += _parse_field(row.get("away_penalty_shootout_goal_long"), away, True)
    kicks += _parse_field(row.get("away_penalty_shootout_miss_long"), away, False)

    # Chronological order across both teams.
    kicks.sort(key=lambda k: k.kick_number)
    return kicks