"""HTTP routes exposed by the application."""
import logging
from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    CountriesResponse,
    MatchInfo,
    StoryRequest,
    StoryResponse,
)
from app.services.data_loader import load_matches
from app.services.shootout_finder import find_shootouts_for_country, pick_random_match
from app.services.shootout_parser import parse_shootout
from app.services.story_generator import (
    OllamaUnavailableError,
    generate_story,
    generate_story_without_history,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api")

# Curated list of the 48 nations qualified for FIFA World Cup 2026.
WC2026_COUNTRIES = sorted([
    "Canada", "Mexico", "United States",
    "Argentina", "Brazil", "Uruguay", "Colombia", "Ecuador", "Paraguay",
    "France", "England", "Spain", "Germany", "Portugal", "Netherlands",
    "Italy", "Belgium", "Croatia", "Switzerland", "Denmark", "Poland",
    "Japan", "South Korea", "Australia", "Iran", "Saudi Arabia", "Qatar",
    "Morocco", "Senegal", "Tunisia", "Cameroon", "Ghana", "Nigeria",
    "Egypt", "Algeria", "Ivory Coast", "South Africa",
    "Costa Rica", "Panama", "Jamaica", "Honduras",
    "Chile", "Peru", "Bolivia", "Venezuela",
    "Serbia", "Austria", "Turkey", "Norway",
])


@router.get("/countries", response_model=CountriesResponse)
async def get_countries() -> CountriesResponse:
    """Return the curated list of WC 2026 qualified countries."""
    return CountriesResponse(countries=WC2026_COUNTRIES)


@router.post("/story", response_model=StoryResponse)
async def post_story(request: StoryRequest) -> StoryResponse:
    """
    Find all shootouts for the country and generate a comprehensive narrative.
    If the country has no shootout history, generate a speculative story
    based on national footballing character instead.
    """
    country = request.country.strip()

    if country not in WC2026_COUNTRIES:
        raise HTTPException(status_code=400, detail=f"Unknown country: {country}")

    df = load_matches()
    matches_df = find_shootouts_for_country(df, country)

    # ---------- Branch A: country has shootout history ----------
    if not matches_df.empty:
        # Process ALL matches for this country
        all_matches = []
        for idx, row in matches_df.iterrows():
            kicks = parse_shootout(row)

            date_value = row.get("Date")
            year_value = None
            if date_value and isinstance(date_value, str) and len(date_value) >= 4:
                try:
                    year_value = int(date_value[:4])
                except ValueError:
                    year_value = None

            home_score = row.get("home_score")
            away_score = row.get("away_score")
            score_str = (
                f"{int(home_score)}-{int(away_score)}"
                if home_score is not None and away_score is not None
                and str(home_score).strip() and str(away_score).strip()
                else None
            )

            home_pen = row.get("home_penalty")
            away_pen = row.get("away_penalty")
            pen_str = (
                f"{int(home_pen)}-{int(away_pen)}"
                if home_pen is not None and away_pen is not None
                and str(home_pen).strip() and str(away_pen).strip()
                else None
            )

            match_info = MatchInfo(
                home_team=str(row.get("home_team", "")),
                away_team=str(row.get("away_team", "")),
                date=str(date_value) if date_value else None,
                year=str(row.get("Year", "")),
                venue=str(row.get("Venue", "")),
                round=str(row.get("Round", "")),
                score=score_str,
                penalty_score=pen_str,
                kicks=kicks,
            )
            all_matches.append(match_info)

        logger.info("Found %d shootout matches for %s", len(all_matches), country)

        try:
            story = await generate_story(country, all_matches)
        except OllamaUnavailableError as exc:
            logger.exception("Ollama unavailable")
            raise HTTPException(status_code=503, detail=str(exc)) from exc

        return StoryResponse(
            country=country,
            has_history=True,
            matches=all_matches,
            story=story,
        )

    # ---------- Branch B: no shootout history ----------
    logger.info(
        "No shootout history for %s — generating speculative story.", country
    )
    try:
        story = await generate_story_without_history(country)
    except OllamaUnavailableError as exc:
        logger.exception("Ollama unavailable")
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return StoryResponse(
        country=country,
        has_history=False,
        matches=[],
        story=story,
    )