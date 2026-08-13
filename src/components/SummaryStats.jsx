import { getAverageKda, getWinRate } from "../utils/matches.js";

export default function SummaryStats({ matches, topPlayer }) {
  const completedMatches = matches.filter((match) => match.status !== "draft");
  const latestMatch = completedMatches[0];
  const latestWinner =
    latestMatch?.winner === "blue"
      ? "Blue team"
      : latestMatch?.winner === "red"
        ? "Red team"
        : "-";
  const latestType =
    latestMatch?.matchType === "spin"
      ? "Spin wheel custom"
      : "Summoner's Rift custom";
  const latestDate = latestMatch?.date
    ? new Intl.DateTimeFormat(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${latestMatch.date}T00:00:00Z`))
    : "";

  return (
    <section className="stats">
      <div className="stat-card accent">
        <span className="label">TOTAL GAMES</span>
        <strong>{completedMatches.length}</strong>
        <span className="sub">all recorded matches</span>
      </div>
      <div
        className={
          "stat-card latest-result-card " +
          (latestMatch ? `has-result winner-${latestMatch.winner}` : "empty-result")
        }
      >
        <span className="label">LATEST RESULT</span>
        {latestMatch ? (
          <>
            <strong className={"latest-result-team " + latestMatch.winner}>
              <span className="latest-result-dot" aria-hidden="true" />
              {latestWinner} victory
            </strong>
            <span className="sub latest-result-meta">
              <span>{latestDate}</span>
              <i aria-hidden="true" />
              <span>{latestType}</span>
            </span>
          </>
        ) : (
          <>
            <strong>-</strong>
            <span className="sub">no games yet</span>
          </>
        )}
      </div>
      <div className="stat-card">
        <span className="label">TOP PLAYER</span>
        <strong>{topPlayer?.[0] || "-"}</strong>
        <span className="sub">
          {topPlayer
            ? `${getWinRate(topPlayer[1])}% winrate · ${getAverageKda(topPlayer[1])} avg KDA`
            : "not enough data"}
        </span>
      </div>
    </section>
  );
}
