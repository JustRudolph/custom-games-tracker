import { useEffect, useMemo, useState } from "react";
import AppHeader from "./components/AppHeader.jsx";
import Hero from "./components/Hero.jsx";
import FullLeaderboard from "./components/FullLeaderboard.jsx";
import MatchForm from "./components/MatchForm.jsx";
import MatchHistory from "./components/MatchHistory.jsx";
import LoginPage from "./components/LoginPage.jsx";
import PlayerInsights from "./components/PlayerInsights.jsx";
import PlayerDashboard from "./components/PlayerDashboard.jsx";
import PlayerLookup from "./components/PlayerLookup.jsx";
import SummaryStats from "./components/SummaryStats.jsx";
import { api } from "./api.js";
import { fetchChampionCatalog, getPlayerName, getPlayerStats, rankPlayers } from "./utils/matches.js";

function App() {
  const [matches, setMatches] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");
  const [view, setView] = useState("dashboard");
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [players, setPlayers] = useState([]);
  const [dataError, setDataError] = useState("");
  const [dataDragonChampions, setDataDragonChampions] = useState([]);
  const [isChampionLibraryLoading, setIsChampionLibraryLoading] = useState(true);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("customs-ledger-theme") || "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("customs-ledger-theme", theme);
  }, [theme]);

  async function loadDatabaseData() {
    try {
      const [loadedMatches, loadedPlayers] = await Promise.all([api.getMatches(), api.getPlayers()]);
      setMatches(loadedMatches);
      setPlayers(loadedPlayers);
      setDataError("");
    } catch (error) {
      setDataError(error.message);
    }
  }

  useEffect(() => {
    loadDatabaseData();
    api.getCurrentAdmin()
      .then(setAdmin)
      .catch(() => setAdmin(null))
      .finally(() => setIsAuthLoading(false));
  }, []);

  useEffect(() => {
    let isCurrent = true;
    fetchChampionCatalog()
      .then((champions) => isCurrent && setDataDragonChampions(champions))
      .catch(() => {})
      .finally(() => isCurrent && setIsChampionLibraryLoading(false));
    return () => { isCurrent = false; };
  }, []);

  const playerStats = useMemo(() => getPlayerStats(matches), [matches]);
  const rankedPlayers = useMemo(() => rankPlayers(playerStats), [playerStats]);
  const currentPlayer = rankedPlayers.find(
    ([name]) => name.toLowerCase() === "me",
  );
  const topPlayer = [...rankedPlayers].sort(
    ([, first], [, second]) =>
      second.wins / second.games - first.wins / first.games,
  )[0];
  const playerNames = useMemo(() => [...new Set([...players.filter((player) => player.active).map((player) => player.name), ...matches.flatMap((match) => [...match.blue, ...match.red].map(getPlayerName))])].sort(), [matches, players]);

  async function addMatch(match) {
    const saved = await api.createMatch(match);
    setMatches((current) => [{ ...match, id: saved.id }, ...current]);
  }

  async function login(credentials) {
    const authenticatedAdmin = await api.login(credentials);
    setAdmin(authenticatedAdmin);
    setIsLoginOpen(false);
    await loadDatabaseData();
  }

  async function logout() {
    await api.logout();
    setAdmin(null);
    setView("dashboard");
  }

  async function savePlayer(player) {
    const saved = player.id ? await api.updatePlayer(player) : await api.createPlayer(player);
    setPlayers((current) => player.id ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved]);
  }

  async function deleteMatch(match) {
    await api.deleteMatch(match.id);
    setMatches((current) => current.filter((item) => item.id !== match.id));
  }

  async function deletePlayer(id) {
    await api.deletePlayer(id);
    setPlayers((current) => current.filter((player) => player.id !== id));
  }

  async function clearMatches() {
    if (matches.length && confirm("Delete every logged match?")) {
      await api.deleteMatches(matches.map((match) => match.id));
      setMatches([]);
    }
  }

  function exportMatches() {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([JSON.stringify(matches, null, 2)], {
        type: "application/json",
      }),
    );
    link.download = "diamond-dynasty-matches.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const toggleTheme = () => setTheme((current) => (current === "light" ? "dark" : "light"));
  const canWrite = admin?.role === "owner" || admin?.role === "admin";

  function searchPlayers(value) {
    setPlayerSearch(value);
    if (value.trim()) setView("players");
    else if (!canWrite && view === "players") setView("dashboard");
  }

  if (isAuthLoading) return <div className="auth-loading">Loading...</div>;

  return (
    <div className="shell">
      <AppHeader
        hasMatches={matches.length > 0}
        onClearMatches={clearMatches}
        onOpenPlayers={async () => { await loadDatabaseData(); setView("players"); }}
        playerSearch={playerSearch}
        onPlayerSearch={searchPlayers}
        admin={admin}
        canWrite={canWrite}
        onLogin={() => setIsLoginOpen(true)}
        onLogout={logout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      {view === "players" ? (
        canWrite ? (
          <PlayerDashboard players={players} dataError={dataError} canWrite={canWrite} onRetry={loadDatabaseData} onSavePlayer={savePlayer} onDeletePlayer={deletePlayer} onBack={() => setView("dashboard")} />
        ) : (
          <PlayerLookup players={rankedPlayers} matches={matches} champions={dataDragonChampions} query={playerSearch} onQueryChange={searchPlayers} dataError={dataError} onRetry={loadDatabaseData} onBack={() => setView("dashboard")} />
        )
      ) : view === "leaderboard" ? (
        <FullLeaderboard
          players={rankedPlayers}
          onBack={() => setView("dashboard")}
        />
      ) : (
        <main>
          {dataError && <div className="data-error">Database connection failed: {dataError}</div>}
          <Hero />
          <SummaryStats
            matches={matches}
            currentPlayer={currentPlayer}
            topPlayer={topPlayer}
          />
          {canWrite && <div className="dashboard-actions">
            <button
              className="primary-btn log-custom-button"
              onClick={() => setIsMatchModalOpen(true)}
            >
              Log a custom <span>-&gt;</span>
            </button>
          </div>}
          <section className="dashboard-layout">
            <section className="workspace">
              <MatchHistory
                matches={matches}
                search={search}
                onSearchChange={setSearch}
                onDeleteMatch={deleteMatch}
                onExport={exportMatches}
                champions={dataDragonChampions}
                canWrite={canWrite}
              />
            </section>
            <PlayerInsights
              players={rankedPlayers}
              onViewAll={() => setView("leaderboard")}
            />
          </section>
          {isMatchModalOpen && (
            <MatchForm
              onAddMatch={addMatch}
              onClose={() => setIsMatchModalOpen(false)}
              playerNames={playerNames}
              champions={dataDragonChampions}
              isChampionLibraryLoading={isChampionLibraryLoading}
              savedPlayers={players}
            />
          )}
        </main>
      )}
      {isLoginOpen && <LoginPage onLogin={login} onClose={() => setIsLoginOpen(false)} />}
      <footer></footer>
    </div>
  );
}

export default App;
