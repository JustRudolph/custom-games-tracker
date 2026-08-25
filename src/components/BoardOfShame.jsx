import { useState } from "react";
import ImageLightbox from "./ImageLightbox.jsx";

export default function BoardOfShame({ entries, players, canWrite, onCreate, onDelete, fullPage = false, onBack }) {
  const [isOpen, setIsOpen] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [reason, setReason] = useState("");
  const [image, setImage] = useState("");
  const [imageOpen, setImageOpen] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  function readImage(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose an image file.");
    if (file.size > 2 * 1024 * 1024) return setError("The image must be 2 MB or smaller.");
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result || ""));
    reader.onerror = () => setError("Could not read the image.");
    reader.readAsDataURL(file);
  }
  async function save(event) {
    event.preventDefault(); setError(""); setIsSaving(true);
    try { const player = players.find((item) => item.id === playerId); await onCreate({ playerId, playerName: player?.name || "", reason, image }); setPlayerId(""); setReason(""); setImage(""); setIsOpen(false); }
    catch (saveError) { setError(saveError.message); }
    finally { setIsSaving(false); }
  }
  return <main className={fullPage ? "board-shame-page" : "board-shame-section"}>
    <div className="board-shame-head"><div><p className="eyebrow">THE HALL OF FAME'S OPPOSITE</p><h1>Board of shame</h1></div><div className="board-shame-head-actions">{canWrite && <button className="primary-btn" type="button" onClick={() => { setError(""); setIsOpen(true); }}>Add entry <span>+</span></button>}{fullPage && <button className="theme-toggle" type="button" onClick={onBack}>Back to dashboard</button>}</div></div>
    {entries.length ? <div className="board-shame-grid">{entries.map((entry) => <article className="board-shame-card" key={entry.id}>{entry.image && <button className="board-shame-image" type="button" onClick={() => setImageOpen(entry.image)}><img src={entry.image} alt="" /></button>}<div className="board-shame-card-body"><strong>{entry.playerName}</strong><p>{entry.reason}</p><small>{new Date(entry.createdAt).toLocaleDateString()}</small>{canWrite && <button className="delete board-shame-delete" type="button" onClick={() => onDelete(entry.id)} aria-label={`Delete shame entry for ${entry.playerName}`}>×</button>}</div></article>)}</div> : <div className="empty board-shame-empty">No entries yet.</div>}
    {isOpen && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setIsOpen(false)}><section className="panel board-shame-modal" role="dialog" aria-modal="true"><div className="modal-head"><div><p className="eyebrow">ADMIN ENTRY</p><h2>Add to the board</h2></div><button className="modal-close" type="button" onClick={() => setIsOpen(false)} aria-label="Close">×</button></div><form onSubmit={save}><label>Player<select required value={playerId} onChange={(event) => setPlayerId(event.target.value)}><option value="">Select player</option>{players.map((player) => <option key={player.id} value={player.id}>{player.name}</option>)}</select></label><label>Reason<textarea required maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="What happened?" /></label><label>Image (optional)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => readImage(event.target.files?.[0])} /></label>{image && <img className="board-shame-upload-preview" src={image} alt="Preview" />}{error && <div className="login-error" role="alert">{error}</div>}<button className="primary-btn" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Add to board"} <span>-&gt;</span></button></form></section></div>}
    {imageOpen && <ImageLightbox src={imageOpen} alt="Board of shame image" onClose={() => setImageOpen("")} />}
  </main>;
}
