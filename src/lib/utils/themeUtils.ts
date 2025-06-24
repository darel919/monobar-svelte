import { useSettingsStore } from '$lib/stores/settings';

export const themeUtils = {
    setTheme: (theme: string) => {
        const settingsStore = useSettingsStore();
        settingsStore.setTheme(theme);
    },

    getTheme: (): string => {
        if (typeof window !== 'undefined') {
            const settingsStore = useSettingsStore();
            return settingsStore.get().theme;
        }
        return 'system';
    },

    getCurrentAppliedTheme: (): string => {
        if (typeof window !== 'undefined') {
            return document.documentElement.getAttribute('data-theme') || 'light';
        }
        return 'light';
    },

    toggleTheme: (): string => {
        const currentTheme = themeUtils.getCurrentAppliedTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        themeUtils.setTheme(newTheme);
        return newTheme;
    },    cleanupOldThemeStorage: () => {
        if (typeof window !== 'undefined') {
            const settingsStore = useSettingsStore();
            settingsStore.cleanupOldStorage();
        }
    }
};
