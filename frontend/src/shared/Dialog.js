import { useEffect, useRef } from 'react';

export function Dialog({ title, onClose, children, busy = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const dialog = ref.current;
    const focusables = () => [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]')];
    (focusables()[0] || dialog).focus();
    const onKey = event => {
      if (event.key === 'Escape' && !busy) onClose();
      if (event.key === 'Tab') {
        const items = focusables();
        const first = items[0];
        const last = items[items.length - 1];
        if (!first) { event.preventDefault(); dialog.focus(); }
        else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    dialog.addEventListener('keydown', onKey);
    return () => { dialog.removeEventListener('keydown', onKey); previouslyFocused?.focus(); };
  }, [onClose, busy]);

  return <div className="dialog-backdrop"><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabIndex={-1} ref={ref}>
    <header className="dialog-header"><h2 id="dialog-title">{title}</h2><button type="button" onClick={onClose} disabled={busy} aria-label="Close dialog">Close</button></header>
    {children}
  </section></div>;
}
