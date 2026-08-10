import { useEffect, useMemo, useState } from "react";

const KEY = "customs-ledger-v1";
const today = () => new Date().toISOString().slice(0, 10);
const names = (text) =>
  text
    .split(/[,\n]/)
    .map((name) => name.trim())
    .filter(Boolean);

function MatchForm({ addMatch }) {
  const empty = () => ({
    date: today(),
    map: "",
    blue: "",
    red: "",
    winner: "",
    notes: "",
  });
  const [form, setForm] = useState(empty);
  const change = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));
  function submit(event) {
    event.preventDefault();
    addMatch({
      id: crypto.randomUUID(),
      date: form.date,
      map: form.map.trim(),
      blue: names(form.blue),
      red: names(form.red),
      winner: form.winner,
      notes: form.notes.trim(),
    });
    setForm(empty());
  }
  return (
    <div className="panel entry-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">NEW ENTRY</p>
          <h2>Log a custom</h2>
        </div>
        <span className="step">01 / 01</span>
      </div>
      <form onSubmit={submit}>
        <label>
          Date
          <input
            type="date"
            required
            value={form.date}
            onChange={change("date")}
          />
        </label>
        <label>
          Series / map
          <input
            placeholder="e.g. Finals · Game 3"
            value={form.map}
            onChange={change("map")}
          />
        </label>
        <div className="team-grid">
          <div className="team-block blue">
            <div className="team-title">
              <span className="team-dot" />
              BLUE TEAM
            </div>
            <textarea
              required
              placeholder="One player per line"
              value={form.blue}
              onChange={change("blue")}
            />
          </div>
          <div className="team-block red">
            <div className="team-title">
              <span className="team-dot" />
              RED TEAM
            </div>
            <textarea
              required
              placeholder="One player per line"
              value={form.red}
              onChange={change("red")}
            />
          </div>
        </div>
        <div className="winner-row">
          <span className="label">WINNER</span>
          <div className="winner-options">
            {["blue", "red"].map((team) => (
              <label key={team}>
                <input
                  type="radio"
                  name="winner"
                  required
                  value={team}
                  checked={form.winner === team}
                  onChange={change("winner")}
                />
                <span>{team[0].toUpperCase() + team.slice(1)} team</span>
              </label>
            ))}
          </div>
        </div>
        <label>
          Notes
          <input
            placeholder="Optional context"
            value={form.notes}
            onChange={change("notes")}
          />
        </label>
        <button className="primary-btn" type="submit">
          Save match <span>↗</span>
        </button>
      </form>
    </div>
  );
}

function App() {
  const [matches, setMatches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  });
  const [search, setSearch] = useState("");
  useEffect(
    () => localStorage.setItem(KEY, JSON.stringify(matches)),
    [matches],
  );
  const stats = useMemo(() => {
    const result = {};
    matches.forEach((match) =>
      [...match.blue, ...match.red].forEach((name) => {
        result[name] ??= { wins: 0, games: 0 };
        result[name].games++;
        if (
          (match.winner === "blue" && match.blue.includes(name)) ||
          (match.winner === "red" && match.red.includes(name))
        )
          result[name].wins++;
      }),
    );
    return result;
  }, [matches]);
  const ranked = Object.entries(stats).sort(
    ([, a], [, b]) => b.games - a.games || b.wins / b.games - a.wins / a.games,
  );
  const me = ranked.find(([name]) => name.toLowerCase() === "me");
  const top = [...ranked].sort(
    ([, a], [, b]) => b.wins / b.games - a.wins / a.games,
  )[0];
  const visible = matches.filter((match) =>
    `${match.blue.join(" ")} ${match.red.join(" ")} ${match.map}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  function exportData() {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([JSON.stringify(matches, null, 2)], {
        type: "application/json",
      }),
    );
    link.download = "customs-ledger.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">✦</span>Customs Ledger
        </div>
        <div className="top-actions">
          <span className="local-pill">
            <i /> LOCAL DATA
          </span>
          <button
            className="ghost-btn"
            onClick={() =>
              matches.length &&
              confirm("Delete every logged match?") &&
              setMatches([])
            }
          >
            Clear all
          </button>
        </div>
      </header>
      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">LEAGUE OF LEGENDS / PRIVATE LOBBIES</p>
            <h1>
              Your games,
              <br />
              <em>your record.</em>
            </h1>
            <p className="lede">
              A clean ledger for custom games. Log the matchup, mark the winner,
              and let the numbers do the talking.
            </p>
          </div>
          <div className="hero-badge">
            <span>NO API REQUIRED</span>
            <strong>100%</strong>
            <small>manual tracking</small>
          </div>
        </section>
        <section className="stats">
          <div className="stat-card accent">
            <span className="label">TOTAL GAMES</span>
            <strong>{matches.length}</strong>
            <span className="sub">all recorded matches</span>
          </div>
          <div className="stat-card">
            <span className="label">YOUR WINRATE</span>
            <strong>
              {me ? `${Math.round((me[1].wins / me[1].games) * 100)}%` : "—"}
            </strong>
            <span className="sub">
              {me
                ? `${me[1].wins}W — ${me[1].games - me[1].wins}L`
                : "name yourself “Me” to track"}
            </span>
          </div>
          <div className="stat-card">
            <span className="label">LATEST RESULT</span>
            <strong>
              {matches[0] ? `${matches[0].winner[0].toUpperCase()} win` : "—"}
            </strong>
            <span className="sub">
              {matches[0] ? `${matches[0].winner} team` : "no games yet"}
            </span>
          </div>
          <div className="stat-card">
            <span className="label">TOP PLAYER</span>
            <strong>{top?.[0] || "—"}</strong>
            <span className="sub">
              {top
                ? `${Math.round((top[1].wins / top[1].games) * 100)}% winrate`
                : "not enough data"}
            </span>
          </div>
        </section>
        <section className="workspace">
          <MatchForm
            addMatch={(match) => setMatches((current) => [match, ...current])}
          />
          <div className="panel history-panel">
            <div className="panel-head history-head">
              <div>
                <p className="eyebrow">THE LEDGER</p>
                <h2>Match history</h2>
              </div>
              <div className="history-tools">
                <input
                  type="search"
                  placeholder="Search player…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <button onClick={exportData} className="ghost-btn">
                  Export JSON
                </button>
              </div>
            </div>
            <div className="history">
              {visible.length ? (
                visible.map((match, index) => (
                  <div className="match" key={match.id || index}>
                    <div className="match-date">{match.date}</div>
                    <div>
                      <div className="match-map">
                        {match.map || "Custom game"}
                      </div>
                      <div className="match-teams">
                        <span style={{ color: "var(--blue)" }}>
                          {match.blue.join(", ")}
                        </span>{" "}
                        vs{" "}
                        <span style={{ color: "var(--red)" }}>
                          {match.red.join(", ")}
                        </span>
                      </div>
                    </div>
                    <div className={`result ${match.winner}`}>
                      {match.winner.toUpperCase()} WIN
                    </div>
                    <button
                      className="delete"
                      aria-label="Delete match"
                      onClick={() =>
                        setMatches((current) =>
                          current.filter((item) => item !== match),
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty">
                  No matches found.
                  <br />
                  Use the form to add your first custom.
                </div>
              )}
            </div>
          </div>
        </section>
        <section className="panel insights-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">WHO IS IN FORM?</p>
              <h2>Player win rates</h2>
            </div>
            <span className="muted">Sorted by games played</span>
          </div>
          <div className="player-grid">
            {ranked.length ? (
              ranked.map(([name, stat]) => {
                const rate = Math.round((stat.wins / stat.games) * 100);
                return (
                  <div className="player" key={name}>
                    <div className="player-name">{name}</div>
                    <div className="player-rate">{rate}%</div>
                    <div className="player-meta">
                      {stat.wins} W / {stat.games - stat.wins} L · {stat.games}{" "}
                      games
                    </div>
                    <div className="bar">
                      <i style={{ width: `${rate}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty">No player stats yet.</div>
            )}
          </div>
        </section>
      </main>
      <footer>Built for the five-stack. Data never leaves this browser.</footer>
    </div>
  );
}
export default App;
