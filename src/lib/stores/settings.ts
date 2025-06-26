import { writable } from 'svelte/store';
import { browser } from '$app/environment';

interface SettingsState {
  playTrailersAutomatically: boolean;
  playNextEnabled: boolean;
  theme: string;
  subtitleSize: string;
  homeViewMode: string;
  librarySortBy: string;
  librarySortOrder: string;
}

const defaultSettings: SettingsState = {
  playTrailersAutomatically: true,
  playNextEnabled: true,
  theme: 'system',
  subtitleSize: 'medium',
  homeViewMode: 'posterView',
  librarySortBy: "ProductionYear",
  librarySortOrder: "desc"
};

const STORAGE_KEY = 'monobar-settings';

function loadFromStorage(): SettingsState {
  if (!browser) return defaultSettings;

  const oldTheme = localStorage.getItem('theme');
  if (oldTheme) {
    localStorage.removeItem('theme');
  }
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {

    if (oldTheme) {
      const migratedSettings = { ...defaultSettings, theme: oldTheme };
      saveToStorage(migratedSettings);
      return migratedSettings;
    }

    saveToStorage(defaultSettings);
    return defaultSettings;
  }
  
  try {
    const parsed = JSON.parse(stored);
    return { ...defaultSettings, ...parsed };
  } catch (error) {
    console.error('Failed to parse stored settings:', error);
    saveToStorage(defaultSettings);
    return defaultSettings;
  }
}

function saveToStorage(state: SettingsState): void {
  if (browser) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

function applyTheme(theme: string): void {
  if (!browser) return;
  
  const html = document.documentElement;
  
  if (theme === 'system') {
    html.removeAttribute('data-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    html.setAttribute('data-theme', theme);
  }
}

function createSettingsStore() {
  const { subscribe, set, update } = writable<SettingsState>(defaultSettings);

  return {
    subscribe,
    
    get: () => {
      let current: SettingsState;
      const unsubscribe = subscribe(value => current = value);
      unsubscribe();
      return current!;
    },
    
    setPlayTrailersAutomatically: (value: boolean) => {
      update(state => {
        const newState = { ...state, playTrailersAutomatically: value };
        saveToStorage(newState);
        return newState;
      });
    },
    
    setPlayNextEnabled: (value: boolean) => {
      update(state => {
        const newState = { ...state, playNextEnabled: value };
        saveToStorage(newState);
        return newState;
      });
    },
    
    setTheme: (theme: string) => {
      update(state => {
        const newState = { ...state, theme };
        saveToStorage(newState);
        applyTheme(theme);
        return newState;
      });
    },
    
    setSubtitleSize: (size: string) => {
      update(state => {
        const newState = { ...state, subtitleSize: size };
        saveToStorage(newState);
        
        if (browser) {
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'subtitleSize',
            newValue: size
          }));
        }
        
        return newState;
      });
    },
    
    setHomeViewMode: (mode: string) => {
      update(state => {
        const newState = { ...state, homeViewMode: mode };
        saveToStorage(newState);
        return newState;
      });
    },
    
    setLibrarySortBy: (sortBy: string) => {
      update(state => {
        const newState = { ...state, librarySortBy: sortBy };
        saveToStorage(newState);
        return newState;
      });
    },
    
    setLibrarySortOrder: (sortOrder: string) => {
      update(state => {
        const newState = { ...state, librarySortOrder: sortOrder };
        saveToStorage(newState);
        return newState;
      });
    },
    
    resetSettings: () => {
      set(defaultSettings);
      saveToStorage(defaultSettings);
      
      if (browser) {
        document.documentElement.removeAttribute('data-theme');
        window.location.reload();
      }
    },
      loadFromStorage: () => {
      const stored = loadFromStorage();
      set(stored);
    },
    
    cleanupOldStorage: () => {
      if (browser) {
        const keysToRemove = ['theme', 'playTrailersAutomatically', 'playNextEnabled', 'subtitleSize', 'homeViewMode', 'librarySortBy', 'librarySortOrder'];
        keysToRemove.forEach(key => {
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
          }
        });

        document.cookie = 'librarySortBy=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'librarySortOrder=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
    }
  };
}

export const settingsStore = createSettingsStore();

export const hydrateSettingsStore = () => {
  if (browser) {
    settingsStore.cleanupOldStorage();
    settingsStore.loadFromStorage();
  }
};

export function useSettingsStore() {
  return settingsStore;
}
