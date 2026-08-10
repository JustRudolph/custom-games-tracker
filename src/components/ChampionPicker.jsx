import { useMemo, useState } from "react";

export default function ChampionPicker({ champions, value, onChange, isLoading }) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = champions.find((champion) => champion.name.toLowerCase() === value.toLowerCase());
  const results = useMemo(() => {
    const query = value.trim().toLowerCase();
    return champions.filter((champion) => !query || champion.name.toLowerCase().includes(query)).slice(0, 8);
  }, [champions, value]);

  function choose(champion) {
    onChange(champion.name);
    setIsOpen(false);
  }

  return <div className="champion-picker">
    {selected && <img className="champion-picker-icon" src={selected.icon} alt="" />}
    <input value={value} placeholder={isLoading ? "Loading champions..." : "Search champion"} onFocus={() => setIsOpen(true)} onBlur={() => window.setTimeout(() => setIsOpen(false), 100)} onChange={(event) => { onChange(event.target.value); setIsOpen(true); }} />
    {isOpen && results.length > 0 && <div className="champion-results">{results.map((champion) => <button type="button" key={champion.id} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(champion)}><img src={champion.icon} alt="" /><span>{champion.name}</span></button>)}</div>}
  </div>;
}
