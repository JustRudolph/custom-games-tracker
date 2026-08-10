import { useState } from "react";
import { splitPlayerNames, today } from "../utils/matches.js";

const emptyForm = () => ({
  date: today(),
  blue: "",
  red: "",
  winner: "",
  notes: "",
});

export default function MatchForm({ onAddMatch }) {
  const [form, setForm] = useState(emptyForm);
  const change = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  function handleSubmit(event) {
    event.preventDefault();
    onAddMatch({
      id: crypto.randomUUID(),
      date: form.date,
      blue: splitPlayerNames(form.blue),
      red: splitPlayerNames(form.red),
      winner: form.winner,
      notes: form.notes.trim(),
    });
    setForm(emptyForm());
  }

  return (
    <div className="panel entry-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">NEW ENTRY</p>
          <h2>Log a custom</h2>
        </div>
        <span className="step">01 / 01</span>
      </div>
      <form onSubmit={handleSubmit}>
        <label>
          Date
          <input
            type="date"
            required
            value={form.date}
            onChange={change("date")}
          />
        </label>
        <div className="team-grid">
          {["blue", "red"].map((team) => (
            <div className={`team-block ${team}`} key={team}>
              <div className="team-title">
                <span className="team-dot" />
                {team.toUpperCase()} TEAM
              </div>
              <textarea
                required
                placeholder="One player per line"
                value={form[team]}
                onChange={change(team)}
              />
            </div>
          ))}
        </div>
        <div className="winner-row">
          <span className="label">WINNER</span>
          <div className="winner-options">
            {["blue", "red"].map((team) => (
              <label key={team}>
                <input
                  type="radio"
                  name="winner"
                  required
                  value={team}
                  checked={form.winner === team}
                  onChange={change("winner")}
                />
                <span>{team[0].toUpperCase() + team.slice(1)} team</span>
              </label>
            ))}
          </div>
        </div>
        <label>
          Notes
          <input
            placeholder="Optional context"
            value={form.notes}
            onChange={change("notes")}
          />
        </label>
        <button className="primary-btn" type="submit">
          Save match <span>-&gt;</span>
        </button>
      </form>
    </div>
  );
}
