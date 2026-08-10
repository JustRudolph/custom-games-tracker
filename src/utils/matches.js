export const STORAGE_KEY = "customs-ledger-v1";

export const today = () => new Date().toISOString().slice(0, 10);

export function splitPlayerNames(value) {
  return value
    .split(/[,\n]/)
    .map((name) => name.trim())
    .filter(Boolean);
}

export function getPlayerStats(matches) {
  return matches.reduce((stats, match) => {
    [...match.blue, ...match.red].forEach((name) => {
      stats[name] ??= { wins: 0, games: 0 };
      stats[name].games += 1;

      const wonOnBlue = match.winner === "blue" && match.blue.includes(name);
      const wonOnRed = match.winner === "red" && match.red.includes(name);

      if (wonOnBlue || wonOnRed) {
        stats[name].wins += 1;
      }
    });

    return stats;
  }, {});
}

export function rankPlayers(stats) {
  return Object.entries(stats).sort(
    ([, first], [, second]) =>
      second.games - first.games ||
      second.wins / second.games - first.wins / first.games,
  );
}

export function getWinRate(stat) {
  return Math.round((stat.wins / stat.games) * 100);
}
