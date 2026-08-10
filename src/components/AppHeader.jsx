export default function AppHeader({
  hasMatches,
  onClearMatches,
  theme,
  onToggleTheme,
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">*</span>
        Customs Ledger
      </div>
      <div className="top-actions">
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
        <span className="local-pill">
          <i /> LOCAL DATA
        </span>
        <button
          className="ghost-btn"
          onClick={onClearMatches}
          disabled={!hasMatches}
        >
          Clear all
        </button>
      </div>
    </header>
  );
}
