export default function AppHeader({ hasMatches, onClearMatches }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-mark">*</span>
        Customs Ledger
      </div>
      <div className="top-actions">
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
