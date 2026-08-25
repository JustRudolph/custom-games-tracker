export const STORAGE_KEY = "customs-ledger-v1";

export const today = () => {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};
export const ROLES = ["Top", "Jungle", "Middle", "Bottom", "Support"];
export const RANKS = [
  { value: 1, label: "Iron" },
  { value: 2, label: "Bronze" },
  { value: 3, label: "Silver" },
  { value: 4, label: "Gold" },
  { value: 5, label: "Platinum" },
  { value: 6, label: "Emerald" },
  { value: 7, label: "Diamond" },
  { value: 8, label: "Master" },
  { value: 9, label: "Grandmaster" },
  { value: 10, label: "Challenger" },
];

export function getRankLabel(value) {
  return RANKS.find((rank) => rank.value === Number(value))?.label || "Unranked";
}

export async function fetchChampionCatalog() {
  const versionsResponse = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
  if (!versionsResponse.ok) throw new Error("Could not load the Data Dragon version list.");

  const [version] = await versionsResponse.json();
  const championsResponse = await fetch("https://ddragon.leagueoflegends.com/cdn/" + version + "/data/en_US/champion.json");
  if (!championsResponse.ok) throw new Error("Could not load champion data.");

  const { data } = await championsResponse.json();
  return Object.values(data)
    .filter((champion) =>
      ![champion.id, champion.name, champion.image?.full]
        .some((value) => String(value || "").toLowerCase().includes("classic")),
    )
    .filter((champion, index, champions) =>
      champions.findIndex(
        (candidate) => candidate.name.toLowerCase() === champion.name.toLowerCase(),
      ) === index,
    )
    .map((champion) => ({
      id: champion.id,
      name: champion.name,
      icon: "https://ddragon.leagueoflegends.com/cdn/" + version + "/img/champion/" + champion.image.full,
    }))
    .sort((first, second) => first.name.localeCompare(second.name));
}

export function parsePlayers(value) {
  return value
    .split(/[,\n]/)
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim());
      const [name, role, rank, champion, kda] = parts.length >= 5 ? parts : [parts[0], "", parts[1] || "Unranked", parts[2] || "Unknown", parts[3] || "-"];

      return { name, role: ROLES.includes(role) ? role : "", rank, champion, kda };
    })
    .filter((player) => player.name);
}

export function getPlayerName(player) {
  return typeof player === "string" ? player : player.name;
}

export function getPlayerLabel(player) {
  return typeof player === "string"
    ? { name: player, rank: "Unranked", champion: "Unknown", kda: "-" }
    : player;
}

function getPlayerKdaNumbers(player) {
  const details = getPlayerLabel(player);
  const values = details.kda && details.kda !== "-"
    ? details.kda.split("/").map(Number)
    : [Number(details.kills || 0), Number(details.deaths || 0), Number(details.assists || 0)];

  return values.map((value) => Number.isFinite(value) ? value : 0);
}

export function getPlayerBestPerformance(matches, playerName) {
  const normalizedName = playerName.trim().toLowerCase();
  let bestPerformance = null;

  matches.filter((match) => match.status === "complete").forEach((match) => {
    for (const team of ["blue", "red"]) {
      const player = match[team].find((entry) => getPlayerName(entry).trim().toLowerCase() === normalizedName);
      if (!player) continue;

      const details = getPlayerLabel(player);
      const [kills, deaths, assists] = getPlayerKdaNumbers(details);
      const performance = {
        champion: details.champion || "Unknown",
        role: details.role || "-",
        kills,
        deaths,
        assists,
        kda: `${kills}/${deaths}/${assists}`,
        ratio: (kills + assists) / Math.max(1, deaths),
        participation: kills + assists,
      };

      if (!bestPerformance || performance.ratio > bestPerformance.ratio ||
        (performance.ratio === bestPerformance.ratio && performance.participation > bestPerformance.participation) ||
        (performance.ratio === bestPerformance.ratio && performance.participation === bestPerformance.participation && performance.kills > bestPerformance.kills)) {
        bestPerformance = performance;
      }
      break;
    }
  });

  return bestPerformance;
}

function getRoleScore(roleStats) {
  if (!roleStats?.games) return 0;

  // Shrink small samples toward a neutral 50 so one excellent game cannot
  // outweigh a role the player has performed in consistently.
  const winRate = (roleStats.wins / roleStats.games) * 100;
  const confidence = roleStats.games / (roleStats.games + 4);
  const reliableWinRate = 50 + (winRate - 50) * confidence;
  const averageKda = (roleStats.kills + roleStats.assists) / Math.max(1, roleStats.deaths);
  // A KDA of 2 is the neutral midpoint; cap the input so an outlier cannot
  // dominate the role decision.
  const kdaScore = (Math.min(averageKda, 8) / (Math.min(averageKda, 8) + 2)) * 100;
  const reliableKda = 50 + (kdaScore - 50) * confidence;
  const experience = (1 - Math.exp(-roleStats.games / 8)) * 100;

  return reliableWinRate * 0.45 + reliableKda * 0.3 + experience * 0.25;
}

function getChampionScore(championStats) {
  if (!championStats?.games) return 0;
  const winRate = (championStats.wins / championStats.games) * 100;
  const confidence = championStats.games / (championStats.games + 4);
  const reliableWinRate = 50 + (winRate - 50) * confidence;
  const averageKda = (championStats.kills + championStats.assists) / Math.max(1, championStats.deaths);
  const cappedKda = Math.min(averageKda, 8);
  const kdaScore = (cappedKda / (cappedKda + 2)) * 100;
  const reliableKda = 50 + (kdaScore - 50) * confidence;
  const experience = (1 - Math.exp(-championStats.games / 8)) * 100;

  return reliableWinRate * 0.5 + reliableKda * 0.3 + experience * 0.2;
}

export function splitPlayerNames(value) {
  return parsePlayers(value)
    .map((player) => player.name)
    .filter(Boolean);
}

export function getPlayerStats(matches) {
  const stats = matches.filter((match) => match.status === "complete").reduce((result, match) => {
    ["blue", "red"].forEach((team) => match[team].forEach((player) => {
      const name = String(getPlayerName(player) || "").trim();
      if (!name) return;
      const normalizedName = name.toLowerCase();
      const details = getPlayerLabel(player);
      const [kills, deaths, assists] = getPlayerKdaNumbers(details);
      const champion = details.champion && details.champion !== "Unknown" ? details.champion : null;
      const won = match.winner === team;

      result[normalizedName] ??= { displayName: name, wins: 0, games: 0, kills: 0, deaths: 0, assists: 0, champions: {}, roles: {} };
      const stat = result[normalizedName];
      stat.games += 1;
      stat.wins += won ? 1 : 0;
      stat.kills += Number.isFinite(kills) ? kills : 0;
      stat.deaths += Number.isFinite(deaths) ? deaths : 0;
      stat.assists += Number.isFinite(assists) ? assists : 0;

      if (champion) {
        stat.champions[champion] ??= { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
        const championStat = stat.champions[champion];
        championStat.games += 1;
        championStat.wins += won ? 1 : 0;
        championStat.kills += Number.isFinite(kills) ? kills : 0;
        championStat.deaths += Number.isFinite(deaths) ? deaths : 0;
        championStat.assists += Number.isFinite(assists) ? assists : 0;
      }

      if (details.role) {
        stat.roles[details.role] ??= { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
        const roleStat = stat.roles[details.role];
        roleStat.games += 1;
        roleStat.wins += won ? 1 : 0;
        roleStat.kills += Number.isFinite(kills) ? kills : 0;
        roleStat.deaths += Number.isFinite(deaths) ? deaths : 0;
        roleStat.assists += Number.isFinite(assists) ? assists : 0;
      }
    }));

    return result;
  }, {});

  Object.values(stats).forEach((stat) => {
    stat.averageKda = (stat.kills + stat.assists) / Math.max(1, stat.deaths);
    const championEntries = Object.entries(stat.champions);
    // Ignore one-game champions when the player has another champion with a
    // meaningful sample, preventing a single lucky result from winning.
    const establishedChampions = championEntries.filter(([, champion]) => champion.games >= 2);
    const eligibleChampions = establishedChampions.length ? establishedChampions : championEntries;
    stat.bestChampion = eligibleChampions.sort(([, first], [, second]) =>
      getChampionScore(second) - getChampionScore(first) ||
      second.games - first.games ||
      second.wins - first.wins,
    )[0]?.[0] || "-";
    stat.worstChampion = [...championEntries].sort(([, first], [, second]) =>
      getChampionScore(first) - getChampionScore(second) ||
      first.games - second.games ||
      first.wins - second.wins,
    )[0]?.[0] || "-";
    const roleEntries = Object.entries(stat.roles);
    // Prefer roles with at least two games when that evidence exists. A
    // one-game role remains eligible only when it is the player's sole sample.
    const establishedRoles = roleEntries.filter(([, role]) => role.games >= 2);
    const eligibleRoles = establishedRoles.length ? establishedRoles : roleEntries;
    stat.bestRole = eligibleRoles.sort(([, first], [, second]) =>
      getRoleScore(second) - getRoleScore(first) ||
      second.games - first.games ||
      second.wins - first.wins,
    )[0]?.[0] || "-";
  });

  return Object.fromEntries(
    Object.values(stats).map((stat) => [stat.displayName, stat]),
  );
}

export function rankPlayers(stats) {
  return Object.entries(stats)
    .map(([name, stat]) => [name, { ...stat, leaderboardScore: getLeaderboardScore(stat) }])
    .sort(([, first], [, second]) =>
      second.leaderboardScore - first.leaderboardScore ||
      second.games - first.games ||
      second.averageKda - first.averageKda ||
      second.wins - first.wins,
    );
}

export function getLeaderboardScore(stat) {
  if (!stat.games) return 0;

  const rawWinRate = (stat.wins / stat.games) * 100;
  const confidence = stat.games / (stat.games + 5);
  const reliableWinRate = 50 + (rawWinRate - 50) * confidence;
  const normalizedKda = Math.min(stat.averageKda, 8) / 8 * 100;
  const reliableKda = 50 + (normalizedKda - 50) * confidence;
  const gamesScore = (1 - Math.exp(-stat.games / 10)) * 100;

  return reliableWinRate * 0.5 + reliableKda * 0.3 + gamesScore * 0.2;
}

export function getWinRate(stat) {
  return Math.round((stat.wins / stat.games) * 100);
}

export function getAverageKda(stat) {
  return stat.averageKda.toFixed(2);
}
