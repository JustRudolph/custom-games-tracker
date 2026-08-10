import { getAverageKda, getWinRate } from "../utils/matches.js";
import RoleIcon from "./RoleIcon.jsx";

export default function PlayerStatCard({ name, stat, champion, children }) {
  const winRate = getWinRate(stat);

  return (
    <article className="player-stat-card">
      <div className="player-stat-card-head">
        <div>
          <p className="eyebrow">PLAYER PROFILE</p>
          <h2>{name}</h2>
          <span className="player-stat-record">
            {stat.wins} wins / {stat.games - stat.wins} losses
          </span>
        </div>
        <strong className="player-stat-winrate">{winRate}%</strong>
      </div>
      <div className="player-stat-grid">
        <div>
          <span>Win rate</span>
          <strong>{winRate}%</strong>
        </div>
        <div>
          <span>Average KDA</span>
          <strong>{getAverageKda(stat)}</strong>
        </div>
        <div>
          <span>Best champion</span>
          <strong className="player-stat-champion">
            {champion && <img src={champion.icon} alt="" />}
            {stat.bestChampion}
          </strong>
        </div>
        <div>
          <span>Best role</span>
          <strong className="player-stat-role">
            <RoleIcon role={stat.bestRole} />
            {stat.bestRole}
          </strong>
        </div>
      </div>
      <div className="bar">
        <i style={{ width: winRate + "%" }} />
      </div>
      {children}
    </article>
  );
}
