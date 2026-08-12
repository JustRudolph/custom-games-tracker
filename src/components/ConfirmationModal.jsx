export default function ConfirmationModal({ eyebrow, title, message, confirmLabel, isWorking = false, error = "", onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop confirm-backdrop" onMouseDown={isWorking ? undefined : onCancel}>
      <section className="panel confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirmation-title" onMouseDown={(event) => event.stopPropagation()}>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id="confirmation-title">{title}</h2>
        <p>{message}</p>
        {error && <div className="login-error" role="alert">{error}</div>}
        <div className="confirm-actions">
          <button className="ghost-btn" type="button" disabled={isWorking} onClick={onCancel}>Cancel</button>
          <button className="danger-btn" type="button" disabled={isWorking} onClick={onConfirm}>{isWorking ? "Working..." : confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
