"""Loads the historical World Cup matches CSV once at application startup."""
import logging
from functools import lru_cache
import pandas as pd

from app.config import settings

logger = logging.getLogger(__name__)

# Columns we rely on. Names follow the dataset convention.
SHOOTOUT_COLUMNS = [
    "home_penalty_shootout_goal_long",
    "home_penalty_shootout_miss_long",
    "away_penalty_shootout_goal_long",
    "away_penalty_shootout_miss_long",
]


@lru_cache(maxsize=1)
def load_matches() -> pd.DataFrame:
    """Load the matches CSV into memory. Cached for the process lifetime."""
    logger.info("Loading matches CSV from %s", settings.csv_path)
    df = pd.read_csv(settings.csv_path, low_memory=False)

    # Normalise: ensure shootout columns exist (some CSV exports may omit them).
    for col in SHOOTOUT_COLUMNS:
        if col not in df.columns:
            logger.warning("Expected column %s missing; creating empty.", col)
            df[col] = pd.NA

    logger.info("Loaded %d match rows.", len(df))
    return df