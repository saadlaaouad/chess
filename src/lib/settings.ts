export type BoardThemeId = 'classic' | 'wood' | 'blue' | 'neon' | 'dark';

export interface BoardTheme {
  id: BoardThemeId;
  name: string;
  darkSquare: string;
  lightSquare: string;
}

export const BOARD_THEMES: Record<BoardThemeId, BoardTheme> = {
  classic: {
    id: 'classic',
    name: 'Classic Green',
    darkSquare: '#779556',
    lightSquare: '#ebecd0',
  },
  wood: {
    id: 'wood',
    name: 'Wood Grain',
    darkSquare: '#b58863',
    lightSquare: '#f0d9b5',
  },
  blue: {
    id: 'blue',
    name: 'Ocean Blue',
    darkSquare: '#4b7399',
    lightSquare: '#eae9d2',
  },
  neon: {
    id: 'neon',
    name: 'Neon Cyber',
    darkSquare: '#102a43',
    lightSquare: '#243b53',
  },
  dark: {
    id: 'dark',
    name: 'Dark Slate',
    darkSquare: '#334155',
    lightSquare: '#94a3b8',
  },
};

export interface AppSettings {
  boardTheme: BoardThemeId;
  soundEnabled: boolean;
  soundVolume: number; // 0 to 1
  moveSounds: boolean;
  captureSounds: boolean;
  checkSounds: boolean;
  lowTimeWarning: boolean;
  highlightLegalMoves: boolean;
  autoQueenPromotion: boolean;
  onlineStatus: 'online' | 'offline';
}

export const DEFAULT_SETTINGS: AppSettings = {
  boardTheme: 'classic',
  soundEnabled: true,
  soundVolume: 0.8,
  moveSounds: true,
  captureSounds: true,
  checkSounds: true,
  lowTimeWarning: true,
  highlightLegalMoves: true,
  autoQueenPromotion: true,
  onlineStatus: 'online',
};

const SETTINGS_KEY = 'grandmaster_chess_settings_v1';

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to load settings from localStorage:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings to localStorage:', e);
  }
}
