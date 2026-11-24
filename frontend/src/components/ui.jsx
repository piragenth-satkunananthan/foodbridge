import React, { useEffect, useId, useRef } from 'react';
import { AlertTriangle, Inbox, X } from 'lucide-react';
import { statusInfo, PIPELINE } from '../lib/format';

export function Button({ variant = 'primary', size, icon: Icon, loading, children, className = '', ...props }) {
  return (
    <button type="button" className={`btn btn-${variant} ${size ? `btn-${size}` : ''} ${className}`} disabled={loading || props.disabled} aria-busy={loading || undefined} {...props}>
      {Icon && <Icon size={16} aria-hidden="true" />}
      {loading ? 'Working…' : children}
    </button>
  );
}

export function Card({ title, action, children, pad = true, className = '' }) {
  return (
    <section className={`card ${className}`}>
      {title && <header className="card-head"><h2>{title}</h2>{action}</header>}
      {pad ? <div className="card-pad">{children}</div> : children}
    </section>
  );
}

export function Badge({ tone = 'neutral', plain, children }) {
  return <span className={`badge badge-${tone} ${plain ? 'badge-plain' : ''}`}>{children}</span>;
}
export function StatusBadge({ status }) {
  const [label, tone] = statusInfo(status);
  return <Badge tone={tone}>{label}</Badge>;
}

export function Stat({ icon: Icon, label, value, note }) {
  return (
    <div className="stat">
      <div className="stat-label">{Icon && <Icon size={15} aria-hidden="true" />}{label}</div>
      <div className="stat-value">{value}</div>
      {note && <div className="stat-note">{note}</div>}
    </div>
  );
}

export function PageHead({ title, subtitle, children }) {
  return (
    <div className="page-head">
      <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Field({ label, hint, error, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && <span className="error-text" role="alert">{error}</span>}
    </label>
  );
}

export function Tabs({ tabs, value, onChange, label }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map(([key, text, count]) => (
        <button key={key} type="button" role="tab" className="tab" aria-selected={value === key} onClick={() => onChange(key)}>
          {text}{count != null && <span className="count num">{count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Empty({ icon: Icon = Inbox, title, children, action }) {
  return (
    <div className="empty">
      <Icon size={32} aria-hidden="true" />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="alert alert-danger" role="alert">
      <AlertTriangle size={18} aria-hidden="true" />
      <div className="flex-1">{message}</div>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>Retry</Button>}
    </div>
  );
}

export function Loading({ rows = 3 }) {
  return (
    <div className="card-pad grid gap-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => <span key={i} className="skeleton" style={{ width: `${90 - i * 15}%` }} />)}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, wide }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previous = document.activeElement;
    dialog.showModal();
    return () => { dialog.close(); previous?.focus?.(); };
  }, [open]);
  if (!open) return null;
  return (
    <dialog ref={ref} className={`modal ${wide ? 'modal-wide' : ''}`} aria-labelledby={titleId}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      <div className="modal-head"><h2 id={titleId}>{title}</h2><Button variant="ghost" size="sm" className="btn-icon" icon={X} onClick={onClose} aria-label="Close dialog" /></div>
      <div className="modal-body">{children}</div>
      {footer && <div className="modal-foot">{footer}</div>}
    </dialog>
  );
}

export function Pipeline({ status }) {
  const order = PIPELINE.map(([k]) => k);
  const at = order.indexOf(status === 'delivered' ? 'delivered_or_recycled' : status);
  return (
    <div className="steps" aria-label="Pickup progress">
      {PIPELINE.map(([key, label], i) => (
        <span key={key} className={`step ${at >= 0 && i < at ? 'done' : ''} ${i === at ? (status === 'completed' ? 'done' : 'current') : ''}`}>{label}</span>
      ))}
    </div>
  );
}

export function Timeline({ items = [] }) {
  if (!items.length) return <p className="muted text-sm">No recorded events yet.</p>;
  return (
    <ol className="timeline">
      {[...items].reverse().map((h, i) => (
        <li key={i}>
          <div className="font-semibold">{statusInfo(h.status)[0]}</div>
          <div className="meta"><span>{h.timestamp ? new Date(h.timestamp).toLocaleString() : '—'}</span>{h.note && <span>{h.note}</span>}</div>
        </li>
      ))}
    </ol>
  );
}
