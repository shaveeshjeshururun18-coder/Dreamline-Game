import type { GameSettings, PostcardRecord, SaveData } from './types';

const SETTINGS_KEY = 'dreamline_settings_v1';
const SAVE_KEY = 'dreamline_save_v1';
const POSTCARDS_KEY = 'dreamline_postcards_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  graphicsQuality: 'high',
  resolutionScale: 1.0,
  mouseSensitivity: 1.0,
  cameraSensitivity: 1.0,
  soundVolume: 0.72,
  musicVolume: 0.55,
  muted: false,
  brightness: 1.05,
  dayCycleMode: 'slow',
};

export function loadSettings(): GameSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadJourneySave(): SaveData | null {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SaveData;
    if (typeof parsed.playerX !== 'number' || typeof parsed.playerZ !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveJourney(data: SaveData): void {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearJourneySave(): void {
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // Ignore
  }
}

export function loadPostcards(): PostcardRecord[] {
  try {
    const raw = window.localStorage.getItem(POSTCARDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePostcards(cards: PostcardRecord[]): void {
  try {
    // Keep at most 12 latest postcards to stay comfortably inside localStorage limits
    const trimmed = cards.slice(0, 12);
    window.localStorage.setItem(POSTCARDS_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage quota errors
  }
}
