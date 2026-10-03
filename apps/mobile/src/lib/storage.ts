// Small JSON wrapper around AsyncStorage. Storage can fail (full disk, private
// browsing on web); the app then simply forgets, it never crashes.

import AsyncStorage from '@react-native-async-storage/async-storage';

export async function load<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw == null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

export async function save(key: string, value: unknown): Promise<void> {
  try {
    if (value === null || value === undefined) await AsyncStorage.removeItem(key);
    else await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}
