import { getWinRate } from "../utils/matches.js";

function PlayerCard({ name, stat }) {
  const rate = getWinRate(stat);
  return (
    <div className="player">
      <div className="player-name">{name}</div>
      <div className="player-rate">{rate}%</div>
      <div className="player-meta">{stat.wins} W / {stat.games - stat.wins} L | {stat.games} games</div>
      <div className="bar"><i style={{ width: rate + "%" }} /></div>
    </div>
  );
}

export default function PlayerInsights({ players }) {
  return (
    <section className="panel insights-panel">
      <div className="panel-head"><div><p className="eyebrow">WHO IS IN FORM?</p><h2>Player win rates</h2></div><span className="muted">Sorted by games played</span></div>
      <div className="player-grid">{players.length ? players.map(([name, stat]) => <PlayerCard key={name} name={name} stat={stat} />) : <div className="empty">No player stats yet.</div>}</div>
    </section>
  );
}
