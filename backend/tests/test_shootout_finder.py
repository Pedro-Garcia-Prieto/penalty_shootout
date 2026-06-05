"""Unit tests for the shootout string parser."""
import pandas as pd
import pytest

from app.services.shootout_parser import (
    _parse_single_kick,
    _parse_field,
    parse_shootout,
)


def test_parse_single_kick_valid():
    kick = _parse_single_kick("1|1-0|Mbappé", team="France", scored=True)
    assert kick is not None
    assert kick.kick_number == 1
    assert kick.running_score == "1-0"
    assert kick.player == "Mbappé"
    assert kick.team == "France"
    assert kick.scored is True


def test_parse_single_kick_malformed_returns_none():
    assert _parse_single_kick("only_one_part", team="X", scored=True) is None
    assert _parse_single_kick("a|b|c", team="X", scored=True) is None  # bad int


def test_parse_field_handles_none_and_nan():
    assert _parse_field(None, team="X", scored=True) == []
    assert _parse_field(float("nan"), team="X", scored=True) == []
    assert _parse_field("", team="X", scored=True) == []


def test_parse_field_multiple_kicks():
    kicks = _parse_field("1|1-0|A, 3|2-1|B", team="X", scored=True)
    assert len(kicks) == 2
    assert [k.kick_number for k in kicks] == [1, 3]


def test_parse_shootout_chronological_order(sample_matches_df):
    row = sample_matches_df.iloc[0]  # Argentina vs France
    kicks = parse_shootout(row)
    assert len(kicks) > 0
    # Must be sorted by kick_number across both teams
    numbers = [k.kick_number for k in kicks]
    assert numbers == sorted(numbers)


def test_parse_shootout_no_data(empty_matches_df):
    row = pd.Series(
        {col: None for col in empty_matches_df.columns},
        index=empty_matches_df.columns,
    )
    assert parse_shootout(row) == []


def test_parse_shootout_skips_malformed(sample_matches_df):
    """Row 3 has a bad entry; parser should not crash."""
    row = sample_matches_df.iloc[3]
    # Should return an empty list rather than raise.
    assert parse_shootout(row) == []