export function findFirstPlayerMatch(playerNames, query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return null;

  return playerNames.find((name) => name.toLowerCase().includes(normalizedQuery)) || null;
}
