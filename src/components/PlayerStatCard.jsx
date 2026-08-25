import { getAverageKda, getWinRate } from "../utils/matches.js";
import RoleIcon from "./RoleIcon.jsx";

export default function PlayerStatCard({ name, stat, champion, bestPerformance, bestPerformanceChampion, children }) {
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
          <span>Worst champion</span>
          <strong className="player-stat-champion">
            {stat.worstChampion}
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
      {bestPerformance && (
        <section className="player-best-performance">
          <span>Best performance</span>
          <div className="player-best-performance-details">
            <strong className="player-stat-champion">
              {bestPerformanceChampion && <img src={bestPerformanceChampion.icon} alt="" />}
              {bestPerformance.champion}
            </strong>
            <strong className="player-stat-role">
              <RoleIcon role={bestPerformance.role} />
              {bestPerformance.role}
            </strong>
            <strong className="player-best-performance-kda">{bestPerformance.kda} KDA</strong>
          </div>
        </section>
      )}
      <div className="bar">
        <i style={{ width: winRate + "%" }} />
      </div>
      {children}
    </article>
  );
}
