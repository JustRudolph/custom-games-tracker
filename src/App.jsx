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
import ProfileSettingsModal from "./components/ProfileSettingsModal.jsx";
import SummaryStats from "./components/SummaryStats.jsx";
import SpinCustomModal from "./components/SpinCustomModal.jsx";
import { api } from "./api.js";
import { fetchChampionCatalog, getPlayerName, getPlayerStats, rankPlayers } from "./utils/matches.js";

function App() {
  const [matches, setMatches] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [playerSearch, setPlayerSearch] = useState("");
  const [selectedPlayerName, setSelectedPlayerName] = useState("");
  const [view, setView] = useState("dashboard");
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isSpinModalOpen, setIsSpinModalOpen] = useState(false);
  const [spunTeams, setSpunTeams] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [players, setPlayers] = useState([]);
  const [dataError, setDataError] = useState("");
  const [dataDragonChampions, setDataDragonChampions] = useState([]);
  const [isChampionLibraryLoading, setIsChampionLibraryLoading] = useState(true);
  const [championLibraryError, setChampionLibraryError] = useState("");
  const [theme, setTheme] = useState(
    () => {
      const savedTheme = localStorage.getItem("customs-ledger-theme");
      if (["light", "dark"].includes(savedTheme)) return savedTheme;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    },
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
      .then((champions) => { if (isCurrent) { setDataDragonChampions(champions); setChampionLibraryError(""); } })
      .catch((error) => isCurrent && setChampionLibraryError(error.message || "Could not load champions."))
      .finally(() => isCurrent && setIsChampionLibraryLoading(false));
    return () => { isCurrent = false; };
  }, []);

  const playerStats = useMemo(() => getPlayerStats(matches), [matches]);
  const rankedPlayers = useMemo(() => rankPlayers(playerStats), [playerStats]);
  const topPlayer = rankedPlayers[0];
  const activePlayerNames = useMemo(
    () => players.filter((player) => player.active !== false).map((player) => player.name),
    [players],
  );
  const playerNames = useMemo(() => [...new Set([...activePlayerNames, ...matches.flatMap((match) => [...match.blue, ...match.red].map(getPlayerName))])].sort(), [activePlayerNames, matches]);

  async function saveMatch(match) {
    if (!canWrite) {
      await api.submitMatch(match);
      setNotice("Your custom was submitted for admin review.");
      return;
    }
    if (match.status === "draft") {
      if (match.id) await api.updateMatchDraft(match);
      else await api.createMatchDraft(match);
    } else if (match.id) await api.updateMatch(match);
    else await api.createMatch(match);
    await loadDatabaseData();
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
    setMatches((current) => current.filter((match) => match.status === "complete"));
    setView("dashboard");
    await loadDatabaseData();
  }

  async function savePlayer(player) {
    const saved = player.id ? await api.updatePlayer(player) : await api.createPlayer(player);
    setPlayers((current) => player.id ? current.map((item) => item.id === saved.id ? saved : item) : [...current, saved]);
  }

  async function deleteMatch(match) {
    await api.deleteMatch(match.id);
    setMatches((current) => current.filter((item) => item.id !== match.id));
  }

  async function approveMatch(match) {
    await api.approveMatch(match.id);
    await loadDatabaseData();
  }

  async function deletePlayer(id) {
    await api.deletePlayer(id);
    setPlayers((current) => current.filter((player) => player.id !== id));
  }

  async function updateProfile(profile) {
    const updatedAdmin = await api.updateProfile(profile);
    setAdmin(updatedAdmin);
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

  const playerSearchResults = useMemo(() => {
    const query = playerSearch.trim().toLowerCase();
    return query ? rankedPlayers.filter(([name]) => name.toLowerCase().includes(query)).slice(0, 6) : [];
  }, [playerSearch, rankedPlayers]);

  function selectSearchedPlayer(name) {
    setPlayerSearch(name);
    setSelectedPlayerName(name);
    setView("playerLookup");
  }

  function openMatchForm(initialTeams = null) {
    setSpunTeams(initialTeams);
    setIsMatchModalOpen(true);
  }

  function closeMatchForm() {
    setIsMatchModalOpen(false);
    setSpunTeams(null);
  }

  function useSpunTeams(teams) {
    setIsSpinModalOpen(false);
    openMatchForm({ ...teams, matchType: "spin" });
  }

  if (isAuthLoading) return <div className="auth-loading">Loading...</div>;

  return (
    <div className="shell">
      <AppHeader
        onOpenDashboard={() => setView("dashboard")}
        onOpenPlayers={async () => { await loadDatabaseData(); setView("players"); }}
        onOpenLeaderboard={() => setView("leaderboard")}
        playerSearch={playerSearch}
        onPlayerSearch={setPlayerSearch}
        playerSearchResults={playerSearchResults}
        onSelectPlayer={selectSearchedPlayer}
        admin={admin}
        canWrite={canWrite}
        onLogin={() => setIsLoginOpen(true)}
        onLogout={logout}
        onOpenProfileSettings={() => setIsProfileSettingsOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      {view === "players" && canWrite ? (
        <PlayerDashboard players={players} dataError={dataError} canWrite={canWrite} onRetry={loadDatabaseData} onSavePlayer={savePlayer} onDeletePlayer={deletePlayer} onBack={() => setView("dashboard")} />
      ) : view === "playerLookup" ? (
        <PlayerLookup players={rankedPlayers} matches={matches} champions={dataDragonChampions} selectedName={selectedPlayerName} dataError={dataError} onRetry={loadDatabaseData} onBack={() => setView("dashboard")} />
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
            topPlayer={topPlayer}
          />
          <div className="dashboard-actions">
            <button
              className="primary-btn log-custom-button"
              onClick={() => openMatchForm()}
            >
              Log a custom <span>-&gt;</span>
            </button>
            <button className="secondary-btn spin-custom-button" onClick={() => setIsSpinModalOpen(true)}>
              Spin a custom
            </button>
          </div>
          {notice && <div className="submission-notice" role="status"><span>{notice}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice("")}>x</button></div>}
          <section className="dashboard-layout">
            <section className="workspace">
              <MatchHistory
                matches={matches}
                onDeleteMatch={deleteMatch}
                onEditMatch={(match) => openMatchForm(match)}
                onApproveMatch={approveMatch}
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
              onSaveMatch={saveMatch}
              onClose={closeMatchForm}
              playerNames={playerNames}
              champions={dataDragonChampions}
              isChampionLibraryLoading={isChampionLibraryLoading}
              championLibraryError={championLibraryError}
              initialTeams={spunTeams}
              canWrite={canWrite}
            />
          )}
        </main>
      )}
      {isLoginOpen && <LoginPage onLogin={login} onClose={() => setIsLoginOpen(false)} />}
      {isProfileSettingsOpen && admin && <ProfileSettingsModal admin={admin} onSave={updateProfile} onClose={() => setIsProfileSettingsOpen(false)} />}
      {isSpinModalOpen && <SpinCustomModal playerNames={activePlayerNames} canWrite={canWrite} onClose={() => setIsSpinModalOpen(false)} onUseTeams={useSpunTeams} />}
      <footer></footer>
    </div>
  );
}

export default App;
