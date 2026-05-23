// src/constants/useAppTheme.ts
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'boothflow_theme_index';

export type Theme = {
  name: string;
  navy: string;
  accent: string;
  bg: string;
  card: string;
  text: string;
  subText: string;
  navBg: string;
  scanColor: string;
  scanIcon: string;
};

export const THEMES: Theme[] = [
  // 1. Navy — original
  {
    name: 'Navy',
    navy: '#0f2557',
    accent: '#2563eb',
    bg: '#f0f4f8',
    card: '#ffffff',
    text: '#0d1b2a',
    subText: '#64748b',
    navBg: '#ffffff',
    scanColor: '#0f2557',
    scanIcon: '#ffffff',
  },
  // 2. Matcha — earthy green + lime
  {
    name: 'Matcha',
    navy: '#365314',
    accent: '#84cc16',
    bg: '#f7fee7',
    card: '#ffffff',
    text: '#1a2e05',
    subText: '#4d7c0f',
    navBg: '#ffffff',
    scanColor: '#365314',
    scanIcon: '#ffffff',
  },
  // 3. Midnight — deep dark + sky blue
  {
    name: 'Midnight',
    navy: '#0f172a',
    accent: '#38bdf8',
    bg: '#020617',
    card: '#0f172a',
    text: '#f1f5f9',
    subText: '#94a3b8',
    navBg: '#0f172a',
    scanColor: '#38bdf8',
    scanIcon: '#38bdf8',
  },
  // 4. Aurora — dark purple + fuchsia
  {
    name: 'Aurora',
    navy: '#1e1b4b',
    accent: '#e879f9',
    bg: '#0d0d1f',
    card: '#1e1b4b',
    text: '#ede9fe',
    subText: '#a5b4fc',
    navBg: '#1e1b4b',
    scanColor: '#e879f9',
    scanIcon: '#e879f9',
  },
];

// ── Simple global listener so all screens update instantly ────────────────────
type Listener = (index: number) => void;
const listeners = new Set<Listener>();

function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function broadcast(index: number) {
  listeners.forEach((fn) => fn(index));
}
// ─────────────────────────────────────────────────────────────────────────────

let cachedIndex = 0; // in-memory cache so new screens get correct value immediately

export function useAppTheme() {
  const [themeIndex, setThemeIndexState] = useState(cachedIndex);
  const [loaded, setLoaded] = useState(false);

  // Load from AsyncStorage on first mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val !== null) {
        const i = parseInt(val, 10);
        if (!isNaN(i) && i >= 0 && i < THEMES.length) {
          cachedIndex = i;
          setThemeIndexState(i);
        }
      }
      setLoaded(true);
    });
  }, []);

  // Subscribe to global broadcasts so theme updates instantly on all screens
  useEffect(() => {
    const unsub = subscribe((index) => {
      setThemeIndexState(index);
    });
    return unsub;
  }, []);

  const setThemeIndex = useCallback((index: number) => {
    cachedIndex = index;
    setThemeIndexState(index);
    broadcast(index);                              // ← instant update everywhere
    AsyncStorage.setItem(STORAGE_KEY, String(index)); // ← persist for next session
  }, []);

  return {
    theme: THEMES[themeIndex],
    themeIndex,
    setThemeIndex,
    loaded,
    THEMES,
  };
}