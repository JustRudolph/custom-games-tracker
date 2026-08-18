import { useMemo, useState } from "react";
import ConfirmationModal from "./ConfirmationModal.jsx";

const blankAccount = () => ({ username: "", displayName: "", role: "admin", active: true, password: "" });

function AccountEditor({ account, onSave, onCancel }) {
  const isNew = !account?.id;
  const [form, setForm] = useState({ ...blankAccount(), ...account, password: "" });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const update = (field) => (event) => setForm({ ...form, [field]: event.target.type === "checkbox" ? event.target.checked : event.target.value });

  async function submit(event) {
    event.preventDefault();
    if (isSaving) return;
    setError("");
    setIsSaving(true);
    try {
      await onSave({ ...form, username: form.username.trim().toLowerCase(), displayName: form.displayName.trim() });
    } catch (saveError) {
      setError(saveError.message || "Could not save account.");
    } finally {
      setIsSaving(false);
    }
  }

  return <form className="account-editor" onSubmit={submit}>
    <label>Username<input required disabled={!isNew} minLength="3" maxLength="32" pattern="[a-z0-9_.-]+" placeholder="username" value={form.username} onChange={update("username")} /></label>
    <label>Display name<input required minLength="2" maxLength="120" placeholder="Display name" value={form.displayName} onChange={update("displayName")} /></label>
    <label>Access role<select value={form.role} onChange={update("role")}><option value="owner">Owner</option><option value="admin">Admin</option><option value="viewer">Viewer</option></select></label>
    <label>Password<input type="password" required={isNew} minLength="12" maxLength="256" autoComplete={isNew ? "new-password" : "off"} placeholder={isNew ? "At least 12 characters" : "Leave blank to keep current"} value={form.password} onChange={update("password")} /></label>
    <label className="active-toggle"><input type="checkbox" checked={form.active} onChange={update("active")} /> Active account</label>
    {error && <div className="login-error" role="alert">{error}</div>}
    <div className="editor-actions"><button className="primary-btn" type="submit" disabled={isSaving}>{isSaving ? "Saving..." : isNew ? "Create account" : "Save account"} <span>-&gt;</span></button><button className="ghost-btn" type="button" disabled={isSaving} onClick={onCancel}>Cancel</button></div>
  </form>;
}

export default function AccountsDashboard({ accounts, currentAdminId, dataError, onRetry, onSaveAccount, onDeleteAccount, onBack }) {
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => accounts.filter((account) => `${account.username} ${account.displayName}`.toLowerCase().includes(query.toLowerCase())), [accounts, query]);

  async function saveAccount(account) {
    const saved = account.id ? await onSaveAccount(account) : await onSaveAccount(account);
    setEditing(null);
    return saved;
  }

  async function deleteAccount() {
    if (!pendingDelete || isDeleting) return;
    setDeleteError("");
    setIsDeleting(true);
    try {
      await onDeleteAccount(pendingDelete.id);
      setPendingDelete(null);
      if (editing?.id === pendingDelete.id) setEditing(null);
    } catch (error) {
      setDeleteError(error.message || "Could not delete account.");
    } finally {
      setIsDeleting(false);
    }
  }

  return <main className="accounts-dashboard">
    <div className="full-leaderboard-head"><div><p className="eyebrow">OWNER CONTROL</p><h1>Accounts</h1></div><button className="theme-toggle" onClick={onBack}>Back to dashboard</button></div>
    {dataError && <div className="data-error">Database connection failed: {dataError} <button className="ghost-btn" onClick={onRetry}>Retry</button></div>}
    <section className="accounts-admin-layout"><div className="panel accounts-directory"><div className="directory-head"><input type="search" placeholder="Search accounts..." value={query} onChange={(event) => setQuery(event.target.value)} /><button className="primary-btn add-player-button" onClick={() => setEditing(blankAccount())}>Add account <span>+</span></button></div><div className="accounts-directory-head"><span>Account</span><span>Role</span><span>Status</span><span>Last login</span><span /></div>{filtered.length ? filtered.map((account) => <div className="accounts-directory-row" key={account.id}><div><strong>{account.displayName}</strong><small>@{account.username}</small></div><span className={`account-role account-role-${account.role}`}>{account.role}</span><span className={account.active ? "status-active" : "status-inactive"}>{account.active ? "Active" : "Inactive"}</span><span>{account.lastLoginAt ? new Date(account.lastLoginAt).toLocaleString() : "Never"}</span><span className="account-row-actions"><button className="ghost-btn" onClick={() => setEditing(account)}>Edit</button>{account.id !== currentAdminId && <button className="delete" aria-label={`Delete ${account.displayName}`} onClick={() => { setDeleteError(""); setPendingDelete(account); }}>x</button>}</span></div>) : <div className="empty">No accounts found.</div>}</div><aside className="panel account-editor-panel"><p className="eyebrow">{editing?.id ? "EDIT ACCOUNT" : "NEW ACCOUNT"}</p><h2>{editing?.id ? editing.displayName : "Create an account"}</h2>{editing ? <AccountEditor key={editing.id || "new"} account={editing} onSave={saveAccount} onCancel={() => setEditing(null)} /> : <p className="editor-placeholder">Create an account or select one to manage its access.</p>}</aside></section>
    {pendingDelete && <ConfirmationModal eyebrow="DELETE ACCOUNT" title={`Delete ${pendingDelete.displayName}?`} message="This permanently removes the account and signs out its active sessions." confirmLabel="Delete account" isWorking={isDeleting} error={deleteError} onCancel={() => setPendingDelete(null)} onConfirm={deleteAccount} />}
  </main>;
}
