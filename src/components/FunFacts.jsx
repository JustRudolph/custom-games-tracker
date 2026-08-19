import { useEffect, useMemo, useState } from "react";

export default function FunFacts({ facts, canWrite, onCreate, onUpdate, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const currentFacts = useMemo(() => facts || [], [facts]);

  useEffect(() => {
    if (!currentFacts.length) return undefined;
    setActiveIndex(Math.floor(Math.random() * currentFacts.length));
    const timer = window.setInterval(() => setActiveIndex((index) => {
      if (currentFacts.length < 2) return index;
      const choices = currentFacts.map((_, factIndex) => factIndex).filter((factIndex) => factIndex !== index);
      return choices[Math.floor(Math.random() * choices.length)];
    }), 24000);
    return () => window.clearInterval(timer);
  }, [currentFacts.length]);

  function openNew() { setEditingId(""); setDraft(""); setError(""); setIsOpen(true); }
  function openEdit(fact) { setEditingId(fact.id); setDraft(fact.text); setError(""); setIsOpen(true); }
  async function save(event) {
    event.preventDefault();
    setError("");
    try {
      if (editingId) await onUpdate({ id: editingId, text: draft });
      else await onCreate({ text: draft });
      setDraft(""); setEditingId("");
    } catch (saveError) { setError(saveError.message); }
  }
  async function remove(id) {
    if (!window.confirm("Delete this fun fact?")) return;
    try { await onDelete(id); } catch (deleteError) { setError(deleteError.message); }
  }

  return <>
    <section className="fun-facts-bar" aria-label="Customs fact">
      <span className="fun-facts-label">CUSTOMS FACT</span>
      <span className="fun-facts-text" key={currentFacts.length ? `${currentFacts[activeIndex % currentFacts.length].id}-${activeIndex}` : "empty"}>{currentFacts.length ? currentFacts[activeIndex % currentFacts.length].text : "Add the first customs fact."}</span>
      {canWrite && <button type="button" className="fun-facts-all" onClick={() => { setError(""); setIsOpen(true); }}>All facts</button>}
      {canWrite && <button type="button" className="fun-facts-add" aria-label="Add fun fact" onClick={openNew}>+</button>}
    </section>
    {isOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}>
      <section className="panel fun-facts-modal" role="dialog" aria-modal="true" aria-labelledby="fun-facts-title">
        <div className="modal-head"><div><p className="eyebrow">CUSTOMS FACTS</p><h2 id="fun-facts-title">Customs facts</h2></div><button type="button" className="modal-close" onClick={() => setIsOpen(false)} aria-label="Close">×</button></div>
        {canWrite && <form className="fun-fact-form" onSubmit={save}><textarea value={draft} maxLength={500} onChange={(event) => setDraft(event.target.value)} placeholder="e.g. Our longest custom lasted 47 minutes." required /><div className="editor-actions"><button className="primary-btn" type="submit">{editingId ? "Save fact" : "Add fact"} <span>-&gt;</span></button>{editingId && <button type="button" className="ghost-btn" onClick={() => { setEditingId(""); setDraft(""); }}>Cancel edit</button>}</div></form>}
        {error && <div className="login-error" role="alert">{error}</div>}
        <div className="fun-facts-list">{currentFacts.length ? currentFacts.map((fact) => <article className="fun-fact-item" key={fact.id}><p>{fact.text}</p>{canWrite && <div><button type="button" className="ghost-btn" onClick={() => openEdit(fact)}>Edit</button><button type="button" className="delete" onClick={() => remove(fact.id)} aria-label={`Delete ${fact.text}`}>×</button></div>}</article>) : <p className="empty">No fun facts have been added yet.</p>}</div>
      </section>
    </div>}
  </>;
}
