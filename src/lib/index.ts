// place files you want to import through the `$lib` alias in this folder.
export { default as LibraryViewDisplay } from './components/LibraryViewDisplay.svelte';
export { default as LibrarySortControl } from './components/LibrarySortControl.svelte';
export { default as ImageComponent } from './components/ImageComponent.svelte';
export { default as SearchBar } from './components/Navbar/SearchBar.svelte';
export { default as ScrollToTop } from './components/ScrollToTop.svelte';
export { default as Settings } from './components/Settings.svelte';
export { default as AppInitializer } from './components/AppInitializer.svelte';

// Export Auth components
export { default as AuthSession } from './components/Auth/AuthSession.svelte';
export { default as LoginButton } from './components/Auth/LoginButton.svelte';
export { default as ProtectedRoute } from './components/Auth/ProtectedRoute.svelte';
export { default as ReauthNotification } from './components/Auth/ReauthNotification.svelte';
export { default as JellyfinReauthNotification } from './components/Auth/JellyfinReauthNotification.svelte';

// Export stores
export { useSettingsStore, hydrateSettingsStore } from './stores/settings';
export { authStore } from './stores/authStore';

// Export auth utilities
// Export auth utilities
export * from './utils/authUtils';
// Export search utilities
export * from './utils/searchUtils.js';
// Export theme utilities
export * from './utils/themeUtils';
// Export cookie utilities
export * from './utils/cookieUtils.js';
