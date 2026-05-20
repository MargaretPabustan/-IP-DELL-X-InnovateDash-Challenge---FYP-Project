// src/constants/useAppTheme.ts
// Drop-in replacement — no context needed, just call useAppTheme() in any screen

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
};

export const THEMES: Theme[] = [
  { name: 'Navy',     navy: '#0f2557', accent: '#2563eb', bg: '#f0f4f8', card: '#ffffff', text: '#0d1b2a', subText: '#64748b', navBg: '#ffffff', scanColor: '#0f2557' },
  { name: 'Midnight', navy: '#0d0d1a', accent: '#e94560', bg: '#111122', card: '#1a1a2e', text: '#e2e8f0', subText: '#8892b0', navBg: '#0d0d1a', scanColor: '#e2e8f0' },
  { name: 'Forest',   navy: '#1b4332', accent: '#40916c', bg: '#f0faf4', card: '#ffffff', text: '#1b4332', subText: '#40916c', navBg: '#ffffff', scanColor: '#1b4332' },
  { name: 'Sunset',   navy: '#7f1d1d', accent: '#ef4444', bg: '#fff7f7', card: '#ffffff', text: '#450a0a', subText: '#991b1b', navBg: '#ffffff', scanColor: '#7f1d1d' },
  { name: 'Purple',   navy: '#2e1065', accent: '#7c3aed', bg: '#faf5ff', card: '#ffffff', text: '#1e0a3c', subText: '#7c3aed', navBg: '#ffffff', scanColor: '#2e1065' },
  { name: 'Slate',    navy: '#1e293b', accent: '#0ea5e9', bg: '#f8fafc', card: '#ffffff', text: '#0f172a', subText: '#64748b', navBg: '#ffffff', scanColor: '#1e293b' },
];

export function useAppTheme() {
  const [themeIndex, setThemeIndexState] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val !== null) {
        const i = parseInt(val, 10);
        if (!isNaN(i) && i >= 0 && i < THEMES.length) setThemeIndexState(i);
      }
      setLoaded(true);
    });
  }, []);

  const setThemeIndex = useCallback((index: number) => {
    setThemeIndexState(index);
    AsyncStorage.setItem(STORAGE_KEY, String(index));
  }, []);

  return {
    theme: THEMES[themeIndex],
    themeIndex,
    setThemeIndex,
    loaded,
    THEMES,
  };
}