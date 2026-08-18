import { useEffect } from "react";

export default function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="image-lightbox" role="dialog" aria-modal="true" aria-label="Enlarged image" onMouseDown={(event) => { event.stopPropagation(); if (event.target === event.currentTarget) onClose(); }}>
      <button className="image-lightbox-close" type="button" aria-label="Close enlarged image" onClick={onClose}>x</button>
      <img src={src} alt={alt} onMouseDown={(event) => event.stopPropagation()} />
    </div>
  );
}
