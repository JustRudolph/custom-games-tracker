import { useEffect, useState } from "react";

export default function ProfileSettingsModal({ admin, onClose, onSave }) {
  const [displayName, setDisplayName] = useState(admin.displayName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      await onSave({ displayName: displayName.trim(), currentPassword, newPassword });
      onClose();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="panel profile-settings-modal" role="dialog" aria-modal="true" aria-labelledby="profile-settings-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="panel-head">
          <div><p className="eyebrow">ACCOUNT SETTINGS</p><h2 id="profile-settings-title">Your profile</h2></div>
          <button className="modal-close" type="button" onClick={onClose}>x</button>
        </div>
        <form onSubmit={submit}>
          <label>Username<input value={admin.username} disabled /></label>
          <label>Display name<input required maxLength="120" value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></label>
          <div className="profile-password-fields">
            <p className="label">CHANGE PASSWORD</p>
            <label>Current password<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
            <label>New password<input type="password" minLength="12" autoComplete="new-password" placeholder="At least 12 characters" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
          </div>
          {error && <div className="login-error">{error}</div>}
          <button className="primary-btn" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save profile"}<span>-&gt;</span></button>
        </form>
      </section>
    </div>
  );
}
