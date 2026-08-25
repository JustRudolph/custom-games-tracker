import { getAverageKda, getWinRate } from "../utils/matches.js";
import RoleIcon from "./RoleIcon.jsx";

function PlayerCard({ name, stat }) {
  const rate = getWinRate(stat);
  return (
    <div className="player">
      <div className="player-name">{name}</div>
      <div className="player-rate">{rate}%</div>
      <div className="player-meta">
        {stat.wins} W / {stat.games - stat.wins} L | {stat.games} games
      </div>
      <div className="player-performance"><span>Avg KDA <strong>{getAverageKda(stat)}</strong></span><span>Best champion <strong>{stat.bestChampion}</strong></span><span>Worst champion <strong>{stat.worstChampion}</strong></span><span>Best role <strong className="leaderboard-role"><RoleIcon role={stat.bestRole} /></strong></span></div>
      <div className="bar">
        <i style={{ width: rate + "%" }} />
      </div>
    </div>
  );
}

export default function PlayerInsights({ players, onViewAll }) {
  return (
    <section className="panel insights-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">LEADERBOARD</p>
          <h2>Player win rates</h2>
        </div>
        <button className="ghost-btn leaderboard-link" onClick={onViewAll}>
          View all
        </button>
      </div>
      <div className="player-grid">
        {players.length ? (
          players.slice(0, 5).map(([name, stat], index) => (
            <div className="leaderboard-row" key={name}>
              <span className="leaderboard-rank">
                {String(index + 1).padStart(2, "0")}
              </span>
              <PlayerCard name={name} stat={stat} />
            </div>
          ))
        ) : (
          <div className="empty">No player stats yet.</div>
        )}
      </div>
    </section>
  );
}
