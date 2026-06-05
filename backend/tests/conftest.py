"""Shared pytest fixtures for backend tests."""
import pandas as pd
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import data_loader


@pytest.fixture
def sample_matches_df() -> pd.DataFrame:
    """
    Small DataFrame mimicking the matches CSV.
    - Row 0: Argentina vs France 2022 final, with full shootout data.
    - Row 1: Brazil vs Germany, no shootout (regular match).
    - Row 2: Spain vs Italy, shootout but Italy wins.
    - Row 3: Mexico vs USA, malformed shootout entry (defensive testing).
    """
    data = {
        "home_team":  ["Argentina", "Brazil",  "Spain", "Mexico"],
        "away_team":  ["France",    "Germany", "Italy", "United States"],
        "home_score": [3, 2, 1, 1],
        "away_score": [3, 0, 1, 1],
        "home_penalty": [4, None, 2, None],
        "away_penalty": [2, None, 4, None],
        "stage": ["Final", "Group", "Round of 16", "Group"],
        "date": ["2022-12-18", "2014-07-08", "2008-06-22", "2002-06-17"],
        "home_penalty_shootout_goal_long": [
            "1|1-0|Mbappé, 3|2-1|Messi",   # Note: home/away mixing reflects raw CSV style
            None,
            "1|1-0|Xavi",
            "bad_entry_without_pipes",
        ],
        "home_penalty_shootout_miss_long": [
            "5|3-2|Montiel",
            None,
            "3|1-2|Fabregas",
            None,
        ],
        "away_penalty_shootout_goal_long": [
            "2|1-1|Dybala, 4|2-2|Paredes",
            None,
            "2|1-1|Buffon, 4|3-2|Pirlo",
            None,
        ],
        "away_penalty_shootout_miss_long": [
            "",
            None,
            "",
            None,
        ],
    }
    return pd.DataFrame(data)


@pytest.fixture
def empty_matches_df() -> pd.DataFrame:
    """Empty DataFrame with the expected schema."""
    cols = [
        "home_team", "away_team", "home_score", "away_score",
        "home_penalty", "away_penalty", "stage", "date",
        "home_penalty_shootout_goal_long", "home_penalty_shootout_miss_long",
        "away_penalty_shootout_goal_long", "away_penalty_shootout_miss_long",
    ]
    return pd.DataFrame(columns=cols)


@pytest.fixture
def patch_data_loader(monkeypatch, sample_matches_df):
    """Replace load_matches() with our in-memory fixture."""
    monkeypatch.setattr(data_loader, "load_matches", lambda: sample_matches_df)
    # Also patch where it's imported into routes module.
    from app.api import routes
    monkeypatch.setattr(routes, "load_matches", lambda: sample_matches_df)


@pytest.fixture
def client(patch_data_loader) -> TestClient:
    """FastAPI test client with the data loader patched."""
    return TestClient(app)