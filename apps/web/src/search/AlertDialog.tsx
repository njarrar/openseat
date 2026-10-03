import { useEffect, useRef, useState } from 'preact/hooks';
import { useLang } from '../i18n';
import { backdropClose, useModal } from '../lib/hooks';
import { savedEmail } from '../lib/alerts';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface Props {
  open: boolean;
  summary: string;
  busy: boolean;
  onSubmit: (email: string) => void;
  onClose: () => void;
}

/** Asks for the address the first time someone turns on an alert. */
export function AlertDialog({ open, summary, busy, onSubmit, onClose }: Props) {
  const { t } = useLang();
  const ref = useRef<HTMLDialogElement>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState(false);
  useModal(ref, open, onClose);
  useEffect(() => {
    if (open) {
      setEmail(savedEmail());
      setError(false);
    }
  }, [open]);

  return (
    <dialog ref={ref} class="modal" aria-labelledby="alert-title" onClick={backdropClose}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const v = email.trim();
          if (!EMAIL.test(v)) return setError(true);
          onSubmit(v);
        }}
      >
        <h2 id="alert-title">{t.alert.title}</h2>
        <p>{summary}</p>
        <label class="field">
          {t.alert.email}
          <input
            class="input"
            type="email"
            name="email"
            autocomplete="email"
            inputMode="email"
            dir="ltr"
            required
            value={email}
            aria-invalid={error}
            aria-describedby="alert-help alert-err"
            onInput={(e) => {
              setEmail(e.currentTarget.value);
              setError(false);
            }}
          />
          <span id="alert-help" class="help">{t.alert.help}</span>
          {error && <span id="alert-err" class="err" role="alert">{t.alert.invalid}</span>}
        </label>
        <div class="modal-actions">
          <button type="button" class="btn ghost small" onClick={() => ref.current?.close()}>{t.alert.cancel}</button>
          <button type="submit" class="btn small" disabled={busy}>{t.alert.submit}</button>
        </div>
      </form>
    </dialog>
  );
}
