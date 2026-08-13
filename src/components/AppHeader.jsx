import { useEffect, useRef, useState } from "react";

export default function AppHeader({
  onOpenDashboard,
  onOpenPlayers,
  onOpenLeaderboard,
  playerSearch,
  onPlayerSearch,
  playerSearchResults,
  onSelectPlayer,
  admin,
  canWrite,
  onLogin,
  onLogout,
  onOpenProfileSettings,
  theme,
  onToggleTheme,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    function closeMenu(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsProfileOpen(false);
      }
      if (event.type === "pointerdown" && !headerRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
        setIsProfileOpen(false);
      }
    }

    window.addEventListener("keydown", closeMenu);
    window.addEventListener("pointerdown", closeMenu);
    return () => {
      window.removeEventListener("keydown", closeMenu);
      window.removeEventListener("pointerdown", closeMenu);
    };
  }, []);

  function runAction(action) {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
    action();
  }

  function submitSearch(event) {
    if (event.key !== "Enter" || !playerSearchResults.length) return;
    event.preventDefault();
    setIsSearchFocused(false);
    setIsMenuOpen(false);
    onSelectPlayer(playerSearchResults[0][0]);
  }

  return (
    <header className={"topbar " + (isMenuOpen ? "menu-open" : "")} ref={headerRef}>
      <button className="brand" type="button" onClick={() => runAction(onOpenDashboard)} aria-label="Back to dashboard">
        <img className="brand-mark" src="/diamond-dynasty-dragon-icon.png" alt="" aria-hidden="true" />
        Diamond Dynasty
      </button>
      <button
        className="mobile-menu-toggle"
        type="button"
        aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={isMenuOpen}
        aria-controls="primary-navigation"
        onClick={() => setIsMenuOpen((current) => !current)}
      >
        <span /><span /><span />
      </button>
      <nav className="top-actions" id="primary-navigation" aria-label="Primary navigation">
        <div className="header-player-search-wrap">
          <input
            className="header-player-search"
            type="search"
            autoComplete="off"
            aria-label="Search player"
            placeholder="Search player..."
            value={playerSearch}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 100)}
            onChange={(event) => onPlayerSearch(event.target.value)}
            onKeyDown={submitSearch}
          />
          {isSearchFocused && playerSearch.trim() && <div className="header-player-results">{playerSearchResults.length ? playerSearchResults.map(([name]) => <button type="button" key={name} onMouseDown={(event) => event.preventDefault()} onClick={() => { setIsSearchFocused(false); onSelectPlayer(name); }}>{name}</button>) : <span>No player found.</span>}</div>}
        </div>
        {canWrite && <button className="ghost-btn" onClick={() => runAction(onOpenPlayers)}>Players</button>}
        <button className="ghost-btn" onClick={() => runAction(onOpenLeaderboard)}>Leaderboard</button>
        <button
          className="theme-toggle"
          onClick={() => runAction(onToggleTheme)}
          aria-label={
            theme === "light" ? "Switch to dark mode" : "Switch to light mode"
          }
          title={
            theme === "light" ? "Switch to dark mode" : "Switch to light mode"
          }
        >
          <span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span>
          {theme === "light" ? "Dark mode" : "Light mode"}
        </button>
        {admin ? (
          <div className={"account-menu " + (isProfileOpen ? "open" : "")}>
            <button className="account-trigger" type="button" aria-label="Open account menu" aria-expanded={isProfileOpen} onClick={() => setIsProfileOpen((current) => !current)}>
              <span className="account-avatar" aria-hidden="true">{admin.displayName.charAt(0).toUpperCase()}</span>
              <span className="account-summary"><strong>{admin.displayName}</strong><small>{admin.role}</small></span>
            </button>
            {isProfileOpen && <div className="account-popover"><div className="account-popover-head"><span className="account-avatar large">{admin.displayName.charAt(0).toUpperCase()}</span><div><strong>{admin.displayName}</strong><small>@{admin.username}</small></div></div><button type="button" onClick={() => runAction(onOpenProfileSettings)}>Profile settings</button><button className="account-logout" type="button" onClick={() => runAction(onLogout)}>Log out</button></div>}
          </div>
        ) : <button className="ghost-btn login-button" onClick={() => runAction(onLogin)}>Log in</button>}
      </nav>
    </header>
  );
}
