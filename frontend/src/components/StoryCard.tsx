import type { StoryResponse } from "../types";

export function StoryCard({ data }: { data: StoryResponse }) {
  const { country, has_history, matches, story } = data;

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

      {has_history && matches.length > 0 && (
        <section className="match-meta">
          <p className="matches-summary">
            <strong>{matches.length}</strong> penalty shootout
            {matches.length > 1 ? "s" : ""} found in World Cup history
          </p>
          {matches.map((match, idx) => (
            <details key={idx} open={matches.length === 1}>
              <summary>
                <strong>{match.home_team}</strong> vs{" "}
                <strong>{match.away_team}</strong>
                {match.year ? ` — World Cup ${match.year}` : ""}
              </summary>
              <div className="match-details">
                {match.round && <p>Round: {match.round}</p>}
                {match.venue && <p>Venue: {match.venue}</p>}
                {match.date && <p>Date: {match.date}</p>}
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
              </div>
            </details>
          ))}
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
