import { useEffect, useMemo, useState } from "react";

export default function ChampionPicker({ champions, value, onChange, isLoading }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = champions.find((champion) => champion.name.toLowerCase() === value.toLowerCase());
  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return champions.filter((champion) => !normalizedQuery || champion.name.toLowerCase().includes(normalizedQuery));
  }, [champions, query]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape, true);
    return () => window.removeEventListener("keydown", closeOnEscape, true);
  }, [isOpen]);

  function openPicker() {
    setQuery("");
    setIsOpen(true);
  }

  function choose(champion) {
    onChange(champion.name);
    setIsOpen(false);
  }

  return (
    <div className="champion-picker">
      <button
        className="champion-picker-trigger"
        type="button"
        disabled={isLoading || !champions.length}
        onClick={openPicker}
      >
        {selected && <img src={selected.icon} alt="" />}
        <span>{selected?.name || (isLoading ? "Loading champions..." : champions.length ? "Select champion" : "Champions unavailable")}</span>
      </button>
      {isOpen && (
        <div
          className="champion-library-backdrop"
          onMouseDown={(event) => {
            event.stopPropagation();
            setIsOpen(false);
          }}
        >
          <section
            className="panel champion-library-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="champion-library-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="champion-library-head">
              <div>
                <p className="eyebrow">CHAMPION LIBRARY</p>
                <h2 id="champion-library-title">Select champion</h2>
              </div>
              <button className="modal-close" type="button" aria-label="Close champion picker" onClick={() => setIsOpen(false)}>x</button>
            </div>
            <input
              className="champion-library-search"
              type="search"
              autoComplete="off"
              autoFocus
              aria-label="Search champions"
              placeholder="Search champions..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="champion-library-grid">
              {results.map((champion) => (
                <button
                  className={selected?.id === champion.id ? "selected" : ""}
                  type="button"
                  key={champion.id}
                  onClick={() => choose(champion)}
                >
                  <img src={champion.icon} alt="" />
                  <span>{champion.name}</span>
                </button>
              ))}
              {!results.length && <div className="champion-library-empty">No champions found.</div>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
