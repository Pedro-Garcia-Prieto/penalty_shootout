import { useState } from "react";
import { CountrySelector } from "./components/CountrySelector";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { ErrorBanner } from "./components/ErrorBanner";
import { StoryCard } from "./components/StoryCard";
import { fetchStory } from "./api/client";
import type { StoryResponse, ApiError } from "./types";
import "./styles/app.css";

export default function App() {
  const [country, setCountry] = useState("");
  const [story, setStory] = useState<StoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!country) return;
    setLoading(true);
    setError(null);
    setStory(null);
    try {
      const data = await fetchStory(country);
      setStory(data);
    } catch (err) {
      const e = err as ApiError;
      setError(e.detail ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero__content">
          <span className="hero__eyebrow">
            Interactive football storytelling
          </span>
          <h1>⚽ World Cup Penalty Shootout Storyteller</h1>
          <p className="hero__lead">
            Explore the drama of football’s most nerve-shredding moments with
            cinematic stories inspired by real World Cup shootouts and
            speculative what-if scenarios.
          </p>

          <div className="hero__stats" aria-label="Application highlights">
            <div className="hero-stat">
              <strong>1930–2022</strong>
              <span>Historical World Cup data</span>
            </div>
            <div className="hero-stat">
              <strong>48 teams</strong>
              <span>Curated 2026 country selector</span>
            </div>
            <div className="hero-stat">
              <strong>AI generated</strong>
              <span>Stories powered by local Ollama</span>
            </div>
          </div>
        </div>

        <div className="hero__panel">
          <div className="hero-card">
            <div className="hero-card__stadium" aria-hidden="true">
              🏟️
            </div>
            <p className="hero-card__label">Matchday atmosphere</p>
            <h2>Pick a nation. Relive the tension.</h2>
            <p>
              From legendary heartbreak to imagined future glory, every story is
              built around the emotional rhythm of a penalty shootout.
            </p>
          </div>
        </div>
      </section>

      <section className="app">
        <section className="controls-card">
          <div className="controls-card__intro">
            <span className="section-kicker">Generate a story</span>
            <h2>Choose your country</h2>
            <p>
              Select a qualified nation and generate a richly written football
              narrative based on historical shootout data.
            </p>
          </div>

          <div className="controls">
            <CountrySelector
              value={country}
              onChange={setCountry}
              disabled={loading}
            />
            <button
              className="generate-btn"
              onClick={handleGenerate}
              disabled={!country || loading}
            >
              {loading ? "Generating..." : "Generate story"}
            </button>
          </div>
        </section>

        <section className="content-stack">
          {loading && <LoadingSpinner />}
          {error && <ErrorBanner message={error} onRetry={handleGenerate} />}
          {story && !loading && <StoryCard data={story} />}
        </section>
      </section>
    </main>
  );
}
