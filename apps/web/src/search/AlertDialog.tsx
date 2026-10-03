import { useEffect, useRef, useState } from 'preact/hooks';
import type { AlertChannel } from '@openseat/shared';
import { useLang } from '../i18n';
import { backdropClose, useModal } from '../lib/hooks';
import { savedAddress } from '../lib/alerts';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+[1-9]\d{7,14}$/;
const cleanPhone = (v: string) => v.replace(/[\s().-]/g, '').replace(/^00/, '+');

interface Props {
  open: boolean;
  summary: string;
  busy: boolean;
  channels: AlertChannel[];
  /** Set after a Telegram alert is saved: the person still has to open the bot. */
  telegramLink: string | null;
  onSubmit: (channel: AlertChannel, address: string) => void;
  onClose: () => void;
}

/** Asks how to send the alert, and where, the first time someone turns one on. */
export function AlertDialog({ open, summary, busy, channels, telegramLink, onSubmit, onClose }: Props) {
  const { t } = useLang();
  const ref = useRef<HTMLDialogElement>(null);
  const [channel, setChannel] = useState<AlertChannel>('email');
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  useModal(ref, open, onClose);
  useEffect(() => {
    if (open) {
      const c = channels.includes(channel) ? channel : 'email';
      setChannel(c);
      setValue(savedAddress(c));
      setError(false);
    }
  }, [open]);

  const pick = (c: AlertChannel) => {
    setChannel(c);
    setValue(savedAddress(c));
    setError(false);
  };

  if (telegramLink) {
    return (
      <dialog ref={ref} class="modal" aria-labelledby="alert-title" onClick={backdropClose}>
        <form method="dialog">
          <h2 id="alert-title">{t.alert.title}</h2>
          <p>{t.alert.telegramNext}</p>
          <div class="modal-actions">
            <button type="button" class="btn ghost small" onClick={() => ref.current?.close()}>{t.alert.cancel}</button>
            <a class="btn small" href={telegramLink} target="_blank" rel="noopener noreferrer" onClick={() => ref.current?.close()}>{t.alert.telegramOpen}</a>
          </div>
        </form>
      </dialog>
    );
  }

  const field = channel === 'email'
    ? { label: t.alert.email, help: t.alert.help, invalid: t.alert.invalid, type: 'email', auto: 'email', mode: 'email' as const }
    : { label: t.alert.phone, help: t.alert.phoneHelp, invalid: t.alert.phoneInvalid, type: 'tel', auto: 'tel', mode: 'tel' as const };

  return (
    <dialog ref={ref} class="modal" aria-labelledby="alert-title" onClick={backdropClose}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (channel === 'telegram') return onSubmit('telegram', '');
          const v = channel === 'whatsapp' ? cleanPhone(value) : value.trim();
          if (!(channel === 'whatsapp' ? PHONE : EMAIL).test(v)) return setError(true);
          onSubmit(channel, v);
        }}
      >
        <h2 id="alert-title">{t.alert.title}</h2>
        <p>{summary}</p>
        {channels.length > 1 && (
          <fieldset class="channels">
            <legend>{t.alert.channel}</legend>
            {channels.map((c) => (
              <label key={c} class="channel">
                <input type="radio" name="channel" value={c} checked={channel === c} onChange={() => pick(c)} />
                <span>{t.alert.channels[c]}</span>
              </label>
            ))}
          </fieldset>
        )}
        {channel === 'telegram' ? (
          <p class="help">{t.alert.telegramHelp}</p>
        ) : (
          <label class="field">
            {field.label}
            <input
              key={channel}
              class="input"
              type={field.type}
              name={channel}
              autocomplete={field.auto}
              inputMode={field.mode}
              dir="ltr"
              required
              value={value}
              aria-invalid={error}
              aria-describedby="alert-help alert-err"
              onInput={(e) => {
                setValue(e.currentTarget.value);
                setError(false);
              }}
            />
            <span id="alert-help" class="help">{field.help}</span>
            {error && <span id="alert-err" class="err" role="alert">{field.invalid}</span>}
          </label>
        )}
        <div class="modal-actions">
          <button type="button" class="btn ghost small" onClick={() => ref.current?.close()}>{t.alert.cancel}</button>
          <button type="submit" class="btn small" disabled={busy}>{t.alert.submit}</button>
        </div>
      </form>
    </dialog>
  );
}
