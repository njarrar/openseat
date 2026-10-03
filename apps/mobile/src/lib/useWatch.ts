import { useRouter } from 'expo-router';
import { useToast } from '../components/Toast';
import { useLang } from '../i18n';
import { alertKey } from './alerts';
import { useTrip } from './search';
import { useAlerts } from './useAlerts';

/** The bell for the route and cabin on screen. Turning it on asks where to send alerts first. */
export function useWatch() {
  const { q, O, D } = useTrip();
  const { alerts, off, restore } = useAlerts();
  const { t, lang } = useLang();
  const toast = useToast();
  const router = useRouter();
  const key = alertKey({ carrier: q.carrier, origin: O, destination: D, cabin: q.cabin });
  const saved = alerts[key];

  const toggle = async () => {
    if (!saved) {
      router.push('/alert');
      return;
    }
    const { id: _id, token: _token, ...req } = saved;
    if (!(await off(key))) return toast(t.alert.failed);
    // A new Telegram alert would need another tap on Start in the bot, so it gets no Undo.
    if (req.channel === 'telegram') return toast(t.alert.off);
    toast(t.alert.off, () => {
      restore(req, lang).then((ok) => !ok && toast(t.alert.failed));
    });
  };

  return { watching: !!saved, toggle };
}
