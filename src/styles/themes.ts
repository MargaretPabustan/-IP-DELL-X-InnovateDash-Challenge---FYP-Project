// src/constants/themes.ts
// Add or edit themes here freely

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
  {
    name: 'Navy',
    navy: '#143c8c',
    accent: '#143c8c',
    bg: '#efefef',
    card: '#ffffff',
    text: '#111111',
    subText: '#555555',
    navBg: '#ffffff',
    scanColor: '#333333',
  },
  {
    name: 'Dark',
    navy: '#1a1a2e',
    accent: '#e94560',
    bg: '#16213e',
    card: '#0f3460',
    text: '#ffffff',
    subText: '#aaaacc',
    navBg: '#1a1a2e',
    scanColor: '#ffffff',
  },
  {
    name: 'Forest',
    navy: '#1b4332',
    accent: '#40916c',
    bg: '#d8f3dc',
    card: '#ffffff',
    text: '#1b4332',
    subText: '#40916c',
    navBg: '#ffffff',
    scanColor: '#1b4332',
  },
  {
    name: 'Sunset',
    navy: '#c9184a',
    accent: '#ff4d6d',
    bg: '#fff0f3',
    card: '#ffffff',
    text: '#590d22',
    subText: '#a4133c',
    navBg: '#ffffff',
    scanColor: '#590d22',
  },
  {
    name: 'Purple',
    navy: '#3a0ca3',
    accent: '#7209b7',
    bg: '#f0ebff',
    card: '#ffffff',
    text: '#240046',
    subText: '#7209b7',
    navBg: '#ffffff',
    scanColor: '#3a0ca3',
  },
  {
    name: 'Slate',
    navy: '#334155',
    accent: '#0ea5e9',
    bg: '#f1f5f9',
    card: '#ffffff',
    text: '#0f172a',
    subText: '#64748b',
    navBg: '#ffffff',
    scanColor: '#334155',
  },
];