<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { hydrateSettingsStore, useSettingsStore } from '$lib/stores/settings';
    import { themeUtils } from '$lib/utils/themeUtils';

    onMount(() => {
        if (!browser) return;

        const settingsStore = useSettingsStore();
        
        const stored = localStorage.getItem('monobar-settings');
        if (!stored) {
            console.log('No settings found in localStorage, applying defaults');
            settingsStore.loadFromStorage();
        } else {
            console.log('Settings found in localStorage, loading saved preferences');
            hydrateSettingsStore();
        }

        themeUtils.cleanupOldThemeStorage();
        
        const initializeTheme = () => {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            settingsStore.subscribe((settings) => {
                let themeToApply;
                
                if (settings.theme === 'light' || settings.theme === 'dark') {
                    themeToApply = settings.theme;
                } else {
                    themeToApply = systemPrefersDark ? 'dark' : 'light';
                }
                
                document.documentElement.setAttribute('data-theme', themeToApply);
                document.body.className = themeToApply === 'dark' ? 'dark' : 'light';
                
                console.log('App initialized with theme:', themeToApply, 'from setting:', settings.theme);
            });
        };
        
        initializeTheme();

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            settingsStore.subscribe((settings) => {
                if (!settings.theme || settings.theme === 'system') {
                    const newTheme = e.matches ? 'dark' : 'light';
                    document.documentElement.setAttribute('data-theme', newTheme);
                    document.body.className = newTheme === 'dark' ? 'dark' : 'light';
                    console.log('System theme changed to:', newTheme);
                }
            });
        };

        mediaQuery.addEventListener('change', handleSystemThemeChange);

        return () => {
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
        };
    });
</script>
