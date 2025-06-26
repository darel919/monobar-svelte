import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import Cookies from 'js-cookie';
import { BASE_API_PATH } from '$lib/config/api';

export interface UserSession {
  access_token?: string;
  refresh_token?: string | null;
  user?: {
    id?: string;
    email?: string;
    user_metadata?: {
      role?: string;
      avatar_url?: string;
      full_name?: string;
      provider_id?: string;
      [key: string]: any;
    };
    app_metadata?: {
      provider?: string;
      providers?: string[];
      [key: string]: any;
    };
    user?: {
      user_metadata?: {
        role?: string;
      };
    };
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  userSession: UserSession | null;
  isLoading: boolean;
  lastLogoutTime: number | null;
  isLoggingOut: boolean;
  jellyUserId: string | null;
  jellyAccessToken: string | null;
  isJellyLoading: boolean;
  jellyAuthFailed: boolean;
  jellyAuthError: string | null;
  needsReauth: boolean;
  jellyAutoLoginAttempted: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  userSession: null,
  isLoading: true,
  lastLogoutTime: null,
  isLoggingOut: false,
  jellyUserId: null,
  jellyAccessToken: null,
  isJellyLoading: false,
  jellyAuthFailed: false,
  jellyAuthError: null,
  needsReauth: false,
  jellyAutoLoginAttempted: false,
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);

  const store = {
    subscribe,
    set,
    update,

    validateJellyfinCredentials: async (providerId: string, jellyAccessToken: string) => {
      if (!browser) return { isValid: false, error: 'Not in browser environment' };

      try {
        const response = await fetch(`${BASE_API_PATH}/jellyfin/v2/profile`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `monobar_user=${providerId},monobar_token=${jellyAccessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.name && data.id && data.last_login && data.last_activity) {
            return { isValid: true, data };
          }
        }

        return { isValid: false, error: 'Invalid response format or unauthorized' };
      } catch (error: any) {
        console.error('Jellyfin validation error:', error);
        return { isValid: false, error: error?.message || 'Validation failed' };
      }
    },
    
    checkAuthStatus: async () => {
      if (!browser) return;
      
      update(state => ({ ...state, isLoading: true }));
      
      try {
        const userSession = localStorage.getItem('user-session');
        const jellyUserId = Cookies.get('jellyUserId');
        const jellyAccessToken = Cookies.get('jellyAccessToken');
        
        let isAuthenticated = false;
        let parsedSession = null;
        let needsReauth = false;
        
        if (userSession) {
          try {
            parsedSession = JSON.parse(userSession);
            
            if (!Cookies.get('user-session')) {
              Cookies.set('user-session', userSession, { expires: 30 });
            }

            if (parsedSession.access_token) {
              const tokenPayload = JSON.parse(atob(parsedSession.access_token.split('.')[1]));
              const currentTime = Math.floor(Date.now() / 1000);

              if (tokenPayload.exp && tokenPayload.exp > currentTime) {
                isAuthenticated = true;
              } else {
                console.log('JWT token expired');
                localStorage.removeItem('user-session');
                Cookies.remove('user-session');
                // Clear Jellyfin cookies when DWS token expires
                Cookies.remove('jellyUserId');
                Cookies.remove('jellyAccessToken');
                parsedSession = null;
                needsReauth = true;
              }
            }
          } catch (jwtError) {
            console.error('Invalid session format:', jwtError);
            localStorage.removeItem('user-session');
            // Clear Jellyfin cookies when DWS session is invalid
            Cookies.remove('jellyUserId');
            Cookies.remove('jellyAccessToken');
            parsedSession = null;
          }
        }

        if (isAuthenticated && parsedSession && jellyUserId && jellyAccessToken) {
          const providerId = parsedSession.user?.user_metadata?.provider_id;
          if (providerId) {
            const validation = await store.validateJellyfinCredentials(providerId, jellyAccessToken);
            if (!validation.isValid) {
              console.log('Jellyfin credentials are invalid, clearing cookies');
              Cookies.remove('jellyUserId');
              Cookies.remove('jellyAccessToken');
              update(state => ({
                ...state,
                jellyUserId: null,
                jellyAccessToken: null,
                jellyAuthFailed: true,
                jellyAuthError: 'Invalid Jellyfin credentials',
                jellyAutoLoginAttempted: false,
              }));
            }
          }
        }
        
        // Clear Jellyfin cookies if DWS is not logged in
        if (!isAuthenticated && (jellyUserId || jellyAccessToken)) {
          console.log('DWS not authenticated, clearing Jellyfin cookies');
          Cookies.remove('jellyUserId');
          Cookies.remove('jellyAccessToken');
        }
        
        update(state => ({
          ...state,
          isAuthenticated,
          userSession: parsedSession,
          jellyUserId: !isAuthenticated ? null : (jellyUserId || null),
          jellyAccessToken: !isAuthenticated ? null : (jellyAccessToken || null),
          needsReauth,
          isLoading: false,
          jellyAutoLoginAttempted: state.jellyAutoLoginAttempted,
        }));

        if (isAuthenticated && parsedSession && (!jellyUserId || !jellyAccessToken)) {
          const userId = parsedSession.user?.id;
          if (userId) {

            let currentJellyLoading = false;
            let autoLoginAttempted = false;
            const unsubscribeCheck = subscribe(state => {
              currentJellyLoading = state.isJellyLoading;
              autoLoginAttempted = state.jellyAutoLoginAttempted;
            });
            unsubscribeCheck();
            
            if (!currentJellyLoading && !autoLoginAttempted) {

              update(state => ({ ...state, jellyAutoLoginAttempted: true }));
              
              setTimeout(async () => {

                let stillNotLoading = false;
                const unsubscribeRecheck = subscribe(state => {
                  stillNotLoading = !state.isJellyLoading;
                });
                unsubscribeRecheck();
                
                if (stillNotLoading) {
                  await store.loginToJellyfin(userId);
                }
              }, 100);
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear Jellyfin cookies when auth check fails
        Cookies.remove('jellyUserId');
        Cookies.remove('jellyAccessToken');
        update(state => ({
          ...state,
          isAuthenticated: false,
          userSession: null,
          jellyUserId: null,
          jellyAccessToken: null,
          isLoading: false,
        }));
      }
    },

    loginToJellyfin: async (userId: string) => {
      if (!browser) return;
      let currentState: AuthState | undefined;
      const unsubscribe = subscribe(state => {
        currentState = state;
      });
      unsubscribe();
      if (currentState?.isJellyLoading) {
        console.log('Jellyfin login already in progress, skipping duplicate request');
        return;
      }

      update(state => ({ ...state, isJellyLoading: true, jellyAuthFailed: false, jellyAuthError: null }));

      try {
        const providerId = currentState?.userSession?.user?.user_metadata?.provider_id || '';
        
        const response = await fetch(`${BASE_API_PATH}/jellyfin/v2/login`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': providerId,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to login to Jellyfin');
        }

        const data = await response.json();
        Cookies.set('jellyUserId', data.userId);
        Cookies.set('jellyAccessToken', data.access_token);

        update(state => ({
          ...state,
          jellyUserId: data.userId,
          jellyAccessToken: data.access_token,
          isJellyLoading: false,
          jellyAuthFailed: false,
          jellyAuthError: null,
          needsReauth: false,
        }));
        console.log('Jellyfin login successful:', data);
      } catch (error: any) {
        console.error('Jellyfin login error:', error);
        update(state => ({
          ...state,
          isJellyLoading: false,
          jellyAuthFailed: true,
          jellyAuthError: error?.message || 'Unknown error',
        }));
      }
    },

    clearJellyfinAuthState: () => {
      if (!browser) return;
      update(state => ({ 
        ...state, 
        jellyAuthFailed: false, 
        jellyAuthError: null,
        jellyAutoLoginAttempted: false,
      }));
    },

    clearReauthState: () => {
      if (!browser) return;
      update(state => ({ 
        ...state, 
        needsReauth: false, 
        jellyAuthFailed: false, 
        jellyAuthError: null,
        jellyAutoLoginAttempted: false,
      }));
    },

    logout: async () => {
      if (!browser) return;
      
      update(state => ({ ...state, isLoggingOut: true }));
      
      try {
        localStorage.removeItem('user-session');
        localStorage.removeItem('redirectAfterAuth');
        
        Cookies.remove('jellyUserId');
        Cookies.remove('jellyAccessToken');
        Cookies.remove('user-session');
        
        update(state => ({
          ...state,
          isAuthenticated: false,
          userSession: null,
          jellyUserId: null,
          jellyAccessToken: null,
          needsReauth: false,
          lastLogoutTime: Date.now(),
          isLoggingOut: false,
          jellyAutoLoginAttempted: false,
        }));
        
        window.location.href = '/';
      } catch (error) {
        console.error('Logout failed:', error);
        update(state => ({ ...state, isLoggingOut: false }));
      }
    },

    isSuperadmin: () => {
      let currentState: AuthState | undefined;
      const unsubscribe = subscribe(state => currentState = state);
      unsubscribe();
      
      if (!currentState) return false;

      if (currentState.userSession?.user?.user_metadata?.role === 'superadmin') {
        return true;
      }

      return currentState.userSession?.user?.user?.user_metadata?.role === 'superadmin';
    },

    initialize: () => {
      if (browser) {
        subscribe(state => {
          if (state.isAuthenticated) {
            console.log('User is authenticated');
          }
        });
      }
    }
  };

  return store;
}

export const authStore = createAuthStore();

if (browser) {
  authStore.checkAuthStatus();
  authStore.initialize();
}