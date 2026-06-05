"""Filters the matches DataFrame for shootouts involving a given country."""
import random
from typing import Optional
import pandas as pd

from app.config import settings
from app.services.data_loader import SHOOTOUT_COLUMNS


def _has_shootout_data(row: pd.Series) -> bool:
    """True if at least one of the four shootout columns has content."""
    for col in SHOOTOUT_COLUMNS:
        value = row.get(col)
        if value is None:
            continue
        if isinstance(value, float) and pd.isna(value):
            continue
        if str(value).strip():
            return True
    return False


def find_shootouts_for_country(df: pd.DataFrame, country: str) -> pd.DataFrame:
    """Return all rows where the country played AND a shootout occurred."""
    country_norm = country.strip().casefold()

    home = df["home_team"].astype(str).str.casefold() == country_norm
    away = df["away_team"].astype(str).str.casefold() == country_norm
    candidate = df[home | away]

    mask = candidate.apply(_has_shootout_data, axis=1)
    return candidate[mask]


def pick_random_match(df: pd.DataFrame) -> Optional[pd.Series]:
    """Pick one row uniformly at random; None if empty."""
    if df.empty:
        return None
    rng = random.Random(settings.random_seed) if settings.random_seed is not None else random
    idx = rng.choice(df.index.tolist())
    return df.loc[idx]