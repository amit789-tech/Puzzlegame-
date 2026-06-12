import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({ id: 'puzzlebook' });

/** Typed JSON get with a default for missing/corrupt values. */
export function getJSON<T>(key: string, fallback: T): T {
  const raw = storage.getString(key);
  if (raw === undefined) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setJSON(key: string, value: unknown): void {
  storage.set(key, JSON.stringify(value));
}

export function getNumber(key: string, fallback: number): number {
  return storage.getNumber(key) ?? fallback;
}

export function setNumber(key: string, value: number): void {
  storage.set(key, value);
}

export function getString(key: string, fallback: string): string {
  return storage.getString(key) ?? fallback;
}

export function setString(key: string, value: string): void {
  storage.set(key, value);
}

export function getBool(key: string, fallback: boolean): boolean {
  return storage.getBoolean(key) ?? fallback;
}

export function setBool(key: string, value: boolean): void {
  storage.set(key, value);
}
