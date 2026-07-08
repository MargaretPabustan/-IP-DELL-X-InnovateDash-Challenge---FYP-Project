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
  gradientColors?: string[];
};

export const THEMES: Theme[] = [
  // 1. Navy — original light theme
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
  // 3. Dark — midnight blue
  {
    name: 'Dark',
    navy: '#1e3a5f',
    accent: '#3b82f6',
    bg: '#0f172a',
    card: '#1e293b',
    text: '#f1f5f9',
    subText: '#94a3b8',
    navBg: '#1e3a5f',
    scanColor: '#3b82f6',
    scanIcon: '#3b82f6',
  },
  // 4. Aurora — purple tones
  {
    name: 'Aurora',
    navy: '#2d1b69',
    accent: '#a855f7',
    bg: '#0d0a1f',
    card: '#1a1040',
    text: '#ede9fe',
    subText: '#a78bfa',
    navBg: '#1a1040',
    scanColor: '#e879f9',
    scanIcon: '#e879f9',
  },
];

// ── Simple global listener so all screens update instantly ────────────────────
type Listener = (index: number) => void;
const listeners = new Set<Listener>();

function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function broadcast(index: number) {
  listeners.forEach((fn) => fn(index));
}

let cachedIndex = 0;

export function useAppTheme() {
  const [themeIndex, setThemeIndexState] = useState(cachedIndex);
  const [loaded, setLoaded] = useState(false);

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

  useEffect(() => {
    const unsub = subscribe((index) => { setThemeIndexState(index); });
    return unsub;
  }, []);

  const setThemeIndex = useCallback((index: number) => {
    cachedIndex = index;
    setThemeIndexState(index);
    broadcast(index);
    AsyncStorage.setItem(STORAGE_KEY, String(index));
  }, []);

  return { theme: THEMES[themeIndex], themeIndex, setThemeIndex, loaded, THEMES };
}