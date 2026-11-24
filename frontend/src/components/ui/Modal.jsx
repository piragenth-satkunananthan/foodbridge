import React, { useEffect, useId, useRef } from 'react';
import Button from './Button';

export default function Modal({ open, onClose, title, children }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);
  return (
    <dialog ref={dialogRef} className="fb-modal" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }}>
      <div className="fb-modal-heading"><h2 id={titleId}>{title}</h2><Button variant="ghost" onClick={onClose} aria-label={`Close ${title}`}>Close</Button></div>
      {children}
    </dialog>
  );
}
