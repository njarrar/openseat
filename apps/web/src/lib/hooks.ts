import { useEffect, useState, type MutableRef } from 'preact/hooks';

export function useMedia(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

/**
 * Drives a native <dialog> from state. showModal() gives us the top layer,
 * a focus trap, Escape to close and an inert page behind, for free.
 */
export function useModal(ref: MutableRef<HTMLDialogElement | null>, open: boolean, onClose: () => void) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const close = () => onClose();
    el.addEventListener('close', close);
    return () => el.removeEventListener('close', close);
  }, [onClose]);
}

/** Close a modal dialog when the click lands on its backdrop. */
export function backdropClose(e: MouseEvent) {
  const el = e.currentTarget as HTMLDialogElement;
  if (e.target !== el) return;
  const r = el.getBoundingClientRect();
  const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
  if (!inside) el.close();
}
