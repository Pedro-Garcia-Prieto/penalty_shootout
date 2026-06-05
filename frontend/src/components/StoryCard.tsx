import type { StoryResponse } from "../types";

export function StoryCard({ data }: { data: StoryResponse }) {
  const { country, has_history, match, story } = data;

  return (
    <article
      className={`story-card ${has_history ? "historical" : "speculative"}`}
    >
      <header>
        <div>
          <p className="section-kicker">Generated narrative</p>
          <h2>{country}</h2>
        </div>
        <span className="badge">
          {has_history ? "📜 Historical shootout" : "🔮 Speculative tale"}
        </span>
      </header>

      {has_history && match && (
        <section className="match-meta">
          <p>
            <strong>{match.home_team}</strong> vs{" "}
            <strong>{match.away_team}</strong>
            {match.year ? ` — World Cup ${match.year}` : ""}
            {match.stage ? ` · ${match.stage}` : ""}
          </p>
          {match.venue && <p>Venue: {match.venue}</p>}
          {match.score && <p>Score after extra time: {match.score}</p>}
          {match.penalty_score && (
            <p>Penalty shootout: {match.penalty_score}</p>
          )}

          {match.kicks.length > 0 && (
            <details>
              <summary>Kick-by-kick drama</summary>
              <ol>
                {match.kicks.map((k) => (
                  <li key={`${k.team}-${k.kick_number}`}>
                    <strong>{k.team}</strong> — {k.player}{" "}
                    {k.scored ? "⚽ GOAL" : "❌ MISS"}{" "}
                    <em>({k.running_score})</em>
                  </li>
                ))}
              </ol>
            </details>
          )}
        </section>
      )}

      <section className="story-body">
        {story
          .split("\n")
          .filter(Boolean)
          .map((p, i) => (
            <p key={i}>{p}</p>
          ))}
      </section>
    </article>
  );
}
