// Mirrors the Pydantic schemas exposed by the backend.

export interface Kick {
  team: string;
  kick_number: number;
  running_score: string;
  player: string;
  scored: boolean;
}

export interface MatchInfo {
  home_team: string;
  away_team: string;
  date: string | null;
  year: string | null;
  round: string | null;
  venue: string | null;
  score: string | null;
  penalty_score: string | null;
  kicks: Kick[];
}

export interface StoryResponse {
  country: string;
  has_history: boolean;
  match: MatchInfo | null;
  story: string;
}

export interface CountriesResponse {
  countries: string[];
}

export interface ApiError {
  detail: string;
  status: number;
}
