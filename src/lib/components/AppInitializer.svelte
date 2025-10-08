<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { hydrateSettingsStore, useSettingsStore } from '$lib/stores/settings';
    import { themeUtils } from '$lib/utils/themeUtils';
    import { authStore } from '$lib/stores/authStore';
    import Cookies from 'js-cookie';

    onMount(() => {
        if (!browser) return;

        const settingsStore = useSettingsStore();

        // Run async initialization logic
        (async () => {
            // Initialize authentication first
            await initializeAuthentication();

            // console.log('Initializing app settings...');
            hydrateSettingsStore();

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

                    // console.log('App initialized with theme:', themeToApply, 'from setting:', settings.theme);
                });
            };

            initializeTheme();
        })();

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            settingsStore.subscribe((settings) => {
                if (!settings.theme || settings.theme === 'system') {
                    const newTheme = e.matches ? 'dark' : 'light';
                    document.documentElement.setAttribute('data-theme', newTheme);
                    document.body.className = newTheme === 'dark' ? 'dark' : 'light';
                    // console.log('System theme changed to:', newTheme);
                }
            });
        };

        mediaQuery.addEventListener('change', handleSystemThemeChange);

        // --- auth subscription and message handling (moved here from layout) ---
        let previousAuthState: boolean | null = null;
        let lastInvalidation = 0;
        let isHandlingAuthSuccess = false;

        const unsubscribeAuth = authStore.subscribe(state => {
            const currentTime = Date.now();
            const hasAuthStateChanged = previousAuthState !== null && previousAuthState !== state.isAuthenticated;
            const timeSinceLastInvalidation = currentTime - lastInvalidation;

            if (hasAuthStateChanged && timeSinceLastInvalidation > 500 && !isHandlingAuthSuccess) {
                console.log('🔄 Auth state changed (AppInitializer), refreshing data...', {
                    from: previousAuthState,
                    to: state.isAuthenticated
                });

                lastInvalidation = currentTime;

                setTimeout(() => {
                    import('$app/navigation').then(({ invalidateAll }) => invalidateAll());
                }, 150);
            }

            previousAuthState = state.isAuthenticated;
        });

        const handleAuthMessage = async (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;

            if (event.data?.type === 'AUTH_SUCCESS') {
                console.log('🎯 AppInitializer received AUTH_SUCCESS message, refreshing auth status...');
                isHandlingAuthSuccess = true;

                await authStore.checkAuthStatus();

                setTimeout(() => {
                    import('$app/navigation').then(({ invalidateAll }) => invalidateAll());

                    setTimeout(() => {
                        isHandlingAuthSuccess = false;
                    }, 1000);
                }, 300);
            }
        };

        window.addEventListener('message', handleAuthMessage);

        return () => {
            mediaQuery.removeEventListener('change', handleSystemThemeChange);
            unsubscribeAuth();
            window.removeEventListener('message', handleAuthMessage);
        };
    });

    

    async function initializeAuthentication() {
        try {
            // Check if we have any stored authentication data
            const userSession = localStorage.getItem('user-session');
            const jellyUserId = Cookies.get('jellyUserId');
            const jellyAccessToken = Cookies.get('jellyAccessToken');

            console.log('🔐 Initializing authentication check...', {
                hasUserSession: !!userSession,
                hasJellyUserId: !!jellyUserId,
                hasJellyAccessToken: !!jellyAccessToken
            });

            // If no authentication data exists, skip auth check
            if (!userSession && !jellyUserId && !jellyAccessToken) {
                console.log('ℹ️ No authentication data found, skipping auth check');
                return;
            }

            let dwsTokenValid = false;
            let parsedSession = null;

            // Check DWS token validity
            if (userSession) {
                try {
                    parsedSession = JSON.parse(userSession);
                    if (parsedSession.access_token) {
                        const tokenPayload = JSON.parse(atob(parsedSession.access_token.split('.')[1]));
                        const currentTime = Math.floor(Date.now() / 1000);
                        const tokenNotExpired = tokenPayload.exp && tokenPayload.exp > currentTime;
                        
                        console.log('🎫 DWS token check:', {
                            tokenNotExpired,
                            expiresAt: new Date(tokenPayload.exp * 1000),
                            currentTime: new Date(currentTime * 1000)
                        });

                        // Verify token with the new DWS profile endpoint
                        if (tokenNotExpired) {
                            const verification = await authStore.verifyDWSProfile(parsedSession.access_token);
                            dwsTokenValid = verification.isValid;
                            if (!verification.isValid) {
                                console.warn('🎫 DWS profile verification failed:', verification.error);
                            }
                        } else {
                            dwsTokenValid = false;
                        }
                    }
                } catch (error) {
                    console.warn('⚠️ Failed to parse DWS token:', error);
                    dwsTokenValid = false;
                }
            }

            // Handle authentication scenarios based on token validity
            if (!dwsTokenValid) {
                console.log('❌ DWS token is invalid or expired - performing full sign out');
                // DWS token is not valid - perform full sign out
                await performFullSignOut();
                return;
            }

            // DWS token is valid, check Jellyfin token
            if (jellyUserId && jellyAccessToken && parsedSession) {
                const userEmail = parsedSession.user?.email;
                if (userEmail) {
                    console.log('🎬 Validating Jellyfin credentials...');
                    const validation = await authStore.validateJellyfinCredentials(userEmail, jellyAccessToken);
                    
                    if (!validation.isValid) {
                        console.log('🔄 Jellyfin token is invalid - attempting renewal');
                        // Jellyfin token is invalid, try to renew it
                        await renewJellyfinToken(parsedSession.user.id);
                    } else {
                        console.log('✅ Jellyfin token is valid');
                    }
                }
            } else if (parsedSession?.user?.id) {
                console.log('🔄 Missing Jellyfin credentials - attempting to obtain them');
                // We have DWS auth but missing Jellyfin credentials, try to get them
                await renewJellyfinToken(parsedSession.user.id);
            }

            // Trigger the standard auth check to update the store
            console.log('🔄 Finalizing authentication state...');
            await authStore.checkAuthStatus();
            console.log('✅ Authentication initialization completed');
            
        } catch (error) {
            console.error('💥 Authentication initialization failed:', error);
            // On critical error, perform full sign out
            await performFullSignOut();
        }
    }

    async function renewJellyfinToken(userId: string) {
        try {
            console.log('🔄 Attempting to renew Jellyfin token for user:', userId);
            await authStore.loginToJellyfin(userId);
            
            // Wait a bit for the operation to complete
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check if renewal was successful
            const currentState = authStore;
            let renewalSuccessful = false;
            
            const unsubscribe = currentState.subscribe(state => {
                renewalSuccessful = !state.jellyAuthFailed && !!state.jellyAccessToken;
            });
            unsubscribe();
            
            if (renewalSuccessful) {
                console.log('✅ Jellyfin token renewal successful');
            } else {
                console.warn('⚠️ Jellyfin token renewal failed');
            }
            
        } catch (error) {
            console.error('💥 Failed to renew Jellyfin token:', error);
        }
    }

    async function performFullSignOut() {
        try {
            console.log('🚪 Performing full sign out due to invalid DWS token');
            
            // Store current path before clearing auth data if not already on auth pages
            const currentPath = window.location.pathname;
            const existingRedirect = localStorage.getItem('redirectAfterAuth');
            
            // Clear all authentication data
            localStorage.removeItem('user-session');
            // Don't clear redirectAfterAuth if it's already set and we're not on auth pages
            if (!existingRedirect && !currentPath.startsWith('/auth')) {
                localStorage.setItem('redirectAfterAuth', currentPath + window.location.search);
            }
            
            // Clear all cookies
            Cookies.remove('jellyUserId');
            Cookies.remove('jellyAccessToken');
            Cookies.remove('user-session');
            Cookies.remove('DeviceId', { path: '/' });
            
            // Update auth store to reflect signed out state
            authStore.update(state => ({
                ...state,
                isAuthenticated: false,
                userSession: null,
                jellyUserId: null,
                jellyAccessToken: null,
                needsReauth: true,
                lastLogoutTime: Date.now(),
                isLoading: false,
                jellyAuthFailed: false,
                jellyAuthError: null,
                jellyAutoLoginAttempted: false,
                retryCount: 0,
            }));
            
            console.log('✅ Full sign out completed - redirecting to login');
            
            // Redirect to login page
            if (browser) {
                // Use replace to prevent back navigation to authenticated state
                window.location.replace('/auth/login');
            }
            
        } catch (error) {
            console.error('💥 Error during full sign out:', error);
        }
    }
</script>
