import { getPlayerLabel, getPlayerName } from "../utils/matches.js";
import RoleIcon from "./RoleIcon.jsx";

function findPlayerMatch(match, playerName) {
  const normalizedName = playerName.toLowerCase();

  for (const team of ["blue", "red"]) {
    const player = match[team].find(
      (item) => getPlayerName(item).toLowerCase() === normalizedName,
    );
    if (player) return { player: getPlayerLabel(player), team };
  }

  return null;
}

function getKda(player) {
  if (player.kda && player.kda !== "-") return player.kda;
  return [player.kills || 0, player.deaths || 0, player.assists || 0].join("/");
}

export default function PlayerMatchList({ name, matches, champions }) {
  const playerMatches = matches
    .filter((match) => match.status === "complete")
    .map((match) => ({ match, entry: findPlayerMatch(match, name) }))
    .filter(({ entry }) => entry);

  return (
    <section className="player-match-list">
      <div className="player-match-list-head">
        <p className="eyebrow">MATCHES</p>
        <span>{playerMatches.length} played</span>
      </div>
      <div className="player-match-rows">
        {playerMatches.map(({ match, entry }, index) => {
          const won = match.winner === entry.team;
          const champion = champions.find(
            (item) => item.name.toLowerCase() === String(entry.player.champion || "").toLowerCase(),
          );

          return (
            <div className="player-match-row" key={match.id || index}>
              <span className={won ? "player-match-win" : "player-match-loss"}>
                {won ? "Win" : "Loss"}
              </span>
              <span className="player-match-date">{match.date}</span>
              <span className="player-match-champion">
                {champion && <img src={champion.icon} alt="" />}
                <strong>{entry.player.champion || "Unknown"}</strong>
              </span>
              <RoleIcon role={entry.player.role} />
              <span className="player-match-kda">{getKda(entry.player)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
