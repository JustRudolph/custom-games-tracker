import { useEffect, useMemo, useState } from "react";
import AppHeader from "./components/AppHeader.jsx";
import Hero from "./components/Hero.jsx";
import MatchForm from "./components/MatchForm.jsx";
import MatchHistory from "./components/MatchHistory.jsx";
import PlayerInsights from "./components/PlayerInsights.jsx";
import SummaryStats from "./components/SummaryStats.jsx";
import { getPlayerStats, rankPlayers, STORAGE_KEY } from "./utils/matches.js";

function App() {
  const [matches, setMatches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [search, setSearch] = useState("");
  const [theme, setTheme] = useState(
    () => localStorage.getItem("customs-ledger-theme") || "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("customs-ledger-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
  }, [matches]);

  const playerStats = useMemo(() => getPlayerStats(matches), [matches]);
  const rankedPlayers = useMemo(() => rankPlayers(playerStats), [playerStats]);
  const currentPlayer = rankedPlayers.find(
    ([name]) => name.toLowerCase() === "me",
  );
  const topPlayer = [...rankedPlayers].sort(
    ([, first], [, second]) =>
      second.wins / second.games - first.wins / first.games,
  )[0];

  function addMatch(match) {
    setMatches((current) => [match, ...current]);
  }

  function deleteMatch(match) {
    setMatches((current) => current.filter((item) => item !== match));
  }

  function clearMatches() {
    if (matches.length && confirm("Delete every logged match?")) {
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
    link.download = "customs-ledger.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  return (
    <div className="shell">
      <AppHeader
        hasMatches={matches.length > 0}
        onClearMatches={clearMatches}
        theme={theme}
        onToggleTheme={() =>
          setTheme((current) => (current === "light" ? "dark" : "light"))
        }
      />
      <main>
        <Hero />
        <SummaryStats
          matches={matches}
          currentPlayer={currentPlayer}
          topPlayer={topPlayer}
        />
        <section className="workspace">
          <MatchForm onAddMatch={addMatch} />
          <MatchHistory
            matches={matches}
            search={search}
            onSearchChange={setSearch}
            onDeleteMatch={deleteMatch}
            onExport={exportMatches}
          />
        </section>
        <PlayerInsights players={rankedPlayers} />
      </main>
      <footer>Built for the five-stack. Data never leaves this browser.</footer>
    </div>
  );
}

export default App;
