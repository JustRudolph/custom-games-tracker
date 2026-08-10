import { getAverageKda, getWinRate } from "../utils/matches.js";
import RoleIcon from "./RoleIcon.jsx";

export default function FullLeaderboard({ players, onBack }) {
  return (
    <main className="full-leaderboard">
      <div className="full-leaderboard-head">
        <div>
          <p className="eyebrow">ALL PLAYERS</p>
          <h1>Leaderboard</h1>
        </div>
        <button className="theme-toggle" onClick={onBack}>
          Back to dashboard
        </button>
      </div>
      <section className="panel leaderboard-table">
        <div className="leaderboard-table-head">
          <span>Rank</span>
          <span>Player</span>
          <span>Record</span>
          <span>Win rate</span>
          <span>Avg KDA</span>
          <span>Best champion</span>
          <span>Best role</span>
        </div>
        {players.length ? (
          players.map(([name, stat], index) => (
            <div className="leaderboard-table-row" key={name}>
              <span className="leaderboard-rank">
                {String(index + 1).padStart(2, "0")}
              </span>
              <strong>{name}</strong>
              <span>
                {stat.wins}W - {stat.games - stat.wins}L
              </span>
              <span className="table-rate">{getWinRate(stat)}%</span>
              <span>{getAverageKda(stat)}</span>
              <strong>{stat.bestChampion}</strong>
              <strong className="leaderboard-role"><RoleIcon role={stat.bestRole} /></strong>
            </div>
          ))
        ) : (
          <div className="empty">No player stats yet.</div>
        )}
      </section>
    </main>
  );
}
