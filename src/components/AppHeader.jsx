export default function AppHeader({
  hasMatches,
  onClearMatches,
  onOpenPlayers,
  playerSearch,
  onPlayerSearch,
  admin,
  canWrite,
  onLogin,
  onLogout,
  theme,
  onToggleTheme,
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true" />
        Diamond Dynasty
      </div>
      <div className="top-actions">
        {canWrite ? (
          <button className="ghost-btn" onClick={onOpenPlayers}>Players</button>
        ) : (
          <input
            className="header-player-search"
            type="search"
            autoComplete="off"
            aria-label="Search player"
            placeholder="Search player..."
            value={playerSearch}
            onChange={(event) => onPlayerSearch(event.target.value)}
          />
        )}
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
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
        {admin ? <><span className="admin-identity"><strong>{admin.displayName}</strong><small>{admin.role}</small></span><button className="ghost-btn" onClick={onLogout}>Log out</button></> : <><span className="admin-identity"><strong>Guest</strong><small>viewer</small></span><button className="ghost-btn" onClick={onLogin}>Log in</button></>}
        {canWrite && <button
          className="ghost-btn clear-all-button"
          onClick={onClearMatches}
          disabled={!hasMatches}
        >
          Clear all
        </button>}
      </div>
    </header>
  );
}
