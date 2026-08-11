import { useEffect, useState } from "react";

export default function LoginPage({ onLogin, onClose }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await onLogin({ username, password });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return <div className="modal-backdrop" onMouseDown={onClose}><section className="panel login-panel login-modal" role="dialog" aria-modal="true" aria-labelledby="login-title" onMouseDown={(event) => event.stopPropagation()}><div className="panel-head"><div><p className="eyebrow">DIAMOND DYNASTY ADMIN</p><h1 id="login-title">Sign in</h1></div><button className="modal-close" type="button" onClick={onClose}>x</button></div><p className="login-copy">Sign in to manage players and custom matches.</p><form onSubmit={submit}><label>Username<input type="text" autoComplete="username" required autoFocus value={username} onChange={(event) => setUsername(event.target.value)} /></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <div className="login-error">{error}</div>}<button className="primary-btn" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing in..." : "Sign in"}<span>-&gt;</span></button></form></section></div>;
}
