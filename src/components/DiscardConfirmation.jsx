export default function DiscardConfirmation({ title, message, onCancel, onDiscard }) {
  return (
    <div className="modal-backdrop confirm-backdrop nested-confirmation" onMouseDown={onCancel}>
      <section className="panel confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="discard-title" onMouseDown={(event) => event.stopPropagation()}>
        <p className="eyebrow">UNSAVED PROGRESS</p>
        <h2 id="discard-title">{title}</h2>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="ghost-btn" type="button" onClick={onCancel}>Keep editing</button>
          <button className="danger-btn" type="button" onClick={onDiscard}>Discard and close</button>
        </div>
      </section>
    </div>
  );
}
