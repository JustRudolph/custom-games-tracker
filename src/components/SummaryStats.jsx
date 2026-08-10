import { getWinRate } from "../utils/matches.js";

export default function SummaryStats({ matches, currentPlayer, topPlayer }) {
  const latestMatch = matches[0];

  return (
    <section className="stats">
      <div className="stat-card accent">
        <span className="label">TOTAL GAMES</span>
        <strong>{matches.length}</strong>
        <span className="sub">all recorded matches</span>
      </div>
      <div className="stat-card">
        <span className="label">YOUR WINRATE</span>
        <strong>{currentPlayer ? `${getWinRate(currentPlayer[1])}%` : "-"}</strong>
        <span className="sub">
          {currentPlayer
            ? `${currentPlayer[1].wins}W - ${currentPlayer[1].games - currentPlayer[1].wins}L`
            : 'name yourself "Me" to track'}
        </span>
      </div>
      <div className="stat-card">
        <span className="label">LATEST RESULT</span>
        <strong>
          {latestMatch ? `${latestMatch.winner[0].toUpperCase()} win` : "-"}
        </strong>
        <span className="sub">
          {latestMatch ? `${latestMatch.winner} team` : "no games yet"}
        </span>
      </div>
      <div className="stat-card">
        <span className="label">TOP PLAYER</span>
        <strong>{topPlayer?.[0] || "-"}</strong>
        <span className="sub">
          {topPlayer ? `${getWinRate(topPlayer[1])}% winrate` : "not enough data"}
        </span>
      </div>
    </section>
  );
}
