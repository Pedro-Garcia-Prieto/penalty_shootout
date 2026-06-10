"""Request and response schemas exposed by the API."""
from typing import List, Optional
from pydantic import BaseModel, Field


class StoryRequest(BaseModel):
    """Body of POST /api/story."""
    country: str = Field(..., min_length=1, max_length=64)


class Kick(BaseModel):
    """A single penalty kick within a shootout."""
    team: str           # Which team took the kick
    kick_number: int    # Order in the shootout (1, 2, 3, ...)
    running_score: str  # Score after this kick, e.g. "1-0"
    player: str
    scored: bool        # True if it was a goal, False if a miss


class MatchInfo(BaseModel):
    """Structured match metadata returned alongside the story."""
    home_team: str
    away_team: str
    date: Optional[str] = None
    year: Optional[str] = None
    venue: Optional[str] = None
    score: Optional[str] = None
    round: Optional[str] = None
    penalty_score: Optional[str] = None
    kicks: List[Kick] = []


class StoryResponse(BaseModel):
    """Body of a successful POST /api/story."""
    country: str
    has_history: bool                 # True if a real shootout was found
    matches: List[MatchInfo] = []     # List of all shootout matches (empty when has_history is False)
    story: str

class CountriesResponse(BaseModel):
    """Body of GET /api/countries."""
    countries: List[str]