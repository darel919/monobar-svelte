import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import Cookies from 'js-cookie';
import { BASE_API_PATH, BASE_API_AUTH_PATH } from '$lib/config/api';
import { getDeviceProfileHeader, getDeviceIdentification } from '$lib/utils/deviceUtils';

export interface UserSession {
  access_token?: string;
  refresh_token?: string | null;
  user?: {
    id?: string;
    email?: string;
    user_metadata?: {
      role?: string;
      avatar_url?: string;
      avatar?: string;
      full_name?: string;
      name?: string;
      collectionId?: string;
      collectionName?: string;
      created?: string;
      updated?: string;
      emailVisibility?: boolean;
      verified?: boolean;
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
  retryCount: number;
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
  retryCount: 0,
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);
  
  // Rate limiting for checkAuthStatus to prevent infinite loops
  let lastAuthCheck = 0;
  let authCheckInProgress = false;
  const AUTH_CHECK_COOLDOWN = 1000; // 1 second minimum between auth checks
  
  // Rate limiting for Jellyfin login to prevent infinite attempts
  let lastJellyfinLogin = 0;
  const JELLYFIN_LOGIN_COOLDOWN = 2000; // 2 seconds minimum between Jellyfin login attempts
  
  // Circuit breaker pattern to prevent infinite authentication failures
  let consecutiveAuthFailures = 0;
  let authCircuitBreakerOpen = false;
  let authCircuitBreakerOpenTime = 0;
  const MAX_CONSECUTIVE_FAILURES = 5;
  const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute timeout when circuit is open

  const store = {
    subscribe,
    set,
    update,    
    async calculateDeviceProfile() {
      if (!browser) return '';
      
      try {
        return getDeviceProfileHeader();
      } catch (error) {
        console.error('Failed to calculate device profile:', error);
        return '';
      }
    },
    
    async getDeviceId() {
      if (!browser) return '';
      try {
        const deviceId = Cookies.get('DeviceId');
        if (deviceId) return deviceId;
        
        // Generate new device ID if none exists
        const { sessionId } = await getDeviceIdentification();
        Cookies.set('DeviceId', sessionId, { path: '/' });
        return sessionId;
      } catch (error) {
        console.error('Failed to get device ID:', error);
        return '';
      }
    },
    validateJellyfinCredentials: async (userEmail: string, jellyAccessToken: string) => {
      if (!browser) return { isValid: false, error: 'Not in browser environment' };

      try {
        // Ensure we have a device ID set
        await store.getDeviceId();
        
        const headers: { [key: string]: string } = {
          'Content-Type': 'application/json',
          'Authorization': `monobar_user=${userEmail},monobar_token=${jellyAccessToken}`,
          'X-Device-Profile': await store.calculateDeviceProfile()
        };
  
        
        const response = await fetch(`${BASE_API_PATH}/jellyfin/profile`, {
          method: 'GET',
          headers,
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
    
    verifyDWSProfile: async (accessToken: string) => {
      if (!browser) return { isValid: false, error: 'Not in browser environment' };

      try {
        const url = new URL(`${BASE_API_AUTH_PATH}/verify`);
        url.searchParams.append('at', accessToken);
        
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const responseData = await response.json();
          
          if (responseData.status === 'valid' && responseData.user?.user_metadata) {
            return { 
              isValid: true, 
              data: responseData,
              user: responseData.user.user_metadata 
            };
          } else {
            return { isValid: false, error: 'Invalid response format or token not valid' };
          }
        } else {
          return { isValid: false, error: `Verification failed with status: ${response.status}` };
        }
      } catch (error: any) {
        console.error('DWS profile verification error:', error);
        return { isValid: false, error: error?.message || 'Profile verification failed' };
      }
    },
    
    checkAuthStatus: async () => {
      if (!browser) return;
      
      // Check circuit breaker
      const now = Date.now();
      if (authCircuitBreakerOpen) {
        if (now - authCircuitBreakerOpenTime < CIRCUIT_BREAKER_TIMEOUT) {
          console.log('🚫 Auth circuit breaker is open, skipping auth check');
          return;
        } else {
          // Reset circuit breaker after timeout
          console.log('🔄 Resetting auth circuit breaker');
          authCircuitBreakerOpen = false;
          consecutiveAuthFailures = 0;
        }
      }
      
      // Rate limiting: prevent too frequent auth checks
      if (authCheckInProgress) {
        console.log('🔒 Auth check already in progress, skipping duplicate request');
        return;
      }
      
      if (now - lastAuthCheck < AUTH_CHECK_COOLDOWN) {
        console.log(`🔒 Auth check rate limited, last check was ${now - lastAuthCheck}ms ago`);
        return;
      }
      
      lastAuthCheck = now;
      authCheckInProgress = true;
      
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
                // Verify the token with the new DWS profile endpoint
                const verification = await store.verifyDWSProfile(parsedSession.access_token);
                if (verification.isValid) {
                  isAuthenticated = true;
                  
                  // Update the session with fresh profile data if available
                  if (verification.user) {
                    const updatedSession = {
                      ...parsedSession,
                      user: {
                        ...parsedSession.user,
                        id: verification.user.id || parsedSession.user?.id,
                        email: verification.user.email || parsedSession.user?.email,
                        user_metadata: {
                          ...parsedSession.user?.user_metadata,
                          ...verification.user,
                          full_name: verification.user.name || parsedSession.user?.user_metadata?.full_name,
                          avatar_url: verification.user.avatar || parsedSession.user?.user_metadata?.avatar_url
                        }
                      }
                    };
                    parsedSession = updatedSession;
                    
                    // Update localStorage with fresh data
                    localStorage.setItem('user-session', JSON.stringify(updatedSession));
                    Cookies.set('user-session', JSON.stringify(updatedSession), { expires: 30 });
                  }
                } else {
                  console.warn('DWS token verification failed:', verification.error);
                  localStorage.removeItem('user-session');
                  Cookies.remove('DeviceId', { path: '/' });
                  Cookies.remove('user-session');
                  Cookies.remove('jellyUserId');
                  Cookies.remove('jellyAccessToken');
                  parsedSession = null;
                  needsReauth = true;
                }
              } else {
                console.warn('JWT token expired');
                localStorage.removeItem('user-session');
                Cookies.remove('DeviceId', { path: '/' });
                Cookies.remove('user-session');
                Cookies.remove('jellyUserId');
                Cookies.remove('jellyAccessToken');
                parsedSession = null;
                needsReauth = true;
              }
            }
          } catch (jwtError) {
            console.error('Invalid session format:', jwtError);
            localStorage.removeItem('user-session');
            Cookies.remove('DeviceId', { path: '/' });
            // Clear Jellyfin cookies when DWS session is invalid
            Cookies.remove('jellyUserId');
            Cookies.remove('jellyAccessToken');
            parsedSession = null;
          }
        }

        if (isAuthenticated && parsedSession && jellyUserId && jellyAccessToken) {
          const userEmail = parsedSession.user?.email;
          if (userEmail) {
            const validation = await store.validateJellyfinCredentials(userEmail, jellyAccessToken);
            if (!validation.isValid) {
              console.warn('Jellyfin credentials are invalid, clearing cookies');
              Cookies.remove('DeviceId', { path: '/' });
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
          console.warn('DWS not authenticated, clearing Jellyfin cookies');
          Cookies.remove('DeviceId', { path: '/' });
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
        
        // Reset circuit breaker on successful auth check
        consecutiveAuthFailures = 0;
        authCircuitBreakerOpen = false;

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
              
              // Attempt Jellyfin login immediately without delay
              await store.loginToJellyfin(userId);
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        
        // Track consecutive failures for circuit breaker
        consecutiveAuthFailures++;
        if (consecutiveAuthFailures >= MAX_CONSECUTIVE_FAILURES) {
          console.warn(`🚫 Opening auth circuit breaker after ${consecutiveAuthFailures} consecutive failures`);
          authCircuitBreakerOpen = true;
          authCircuitBreakerOpenTime = Date.now();
        }
        
        // Clear Jellyfin cookies when auth check fails
        Cookies.remove('DeviceId', { path: '/' });
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
      } finally {
        authCheckInProgress = false;
      }
    },

    loginToJellyfin: async (userId: string) => {
      if (!browser) return;
      
      // Rate limiting: prevent too frequent Jellyfin login attempts
      const now = Date.now();
      if (now - lastJellyfinLogin < JELLYFIN_LOGIN_COOLDOWN) {
        console.log(`🔒 Jellyfin login rate limited, last attempt was ${now - lastJellyfinLogin}ms ago`);
        return;
      }
      
      let currentState: AuthState | undefined;
      const unsubscribe = subscribe(state => {
        currentState = state;
      });
      unsubscribe();
      
      if (currentState?.isJellyLoading) {
        console.log('🔒 Jellyfin login already in progress, skipping duplicate request');
        return;
      }
      
      if (currentState?.retryCount !== undefined && currentState.retryCount >= 10) {
        update(state => ({ ...state, jellyAuthFailed: true, isJellyLoading: false, jellyAuthError: 'Maximum retry attempts reached.' }));
        return;
      }
      
      lastJellyfinLogin = now;
      update(state => ({ ...state, isJellyLoading: true, jellyAuthFailed: false, jellyAuthError: null, retryCount: (state.retryCount ?? 0) + 1 }));

      try {
        const userEmail = currentState?.userSession?.user?.email || '';
        
        const headers: { [key: string]: string } = {
          'Content-Type': 'application/json',
          'Authorization': userEmail,
        };
        
        const response = await fetch(`${BASE_API_PATH}/jellyfin/login`, {
          method: 'GET',
          headers,
        });

        if (!response.ok) {
          throw new Error('Failed to authenticate with backend services. Please check your credentials or try again later.');
        }

        const data = await response.json();
        Cookies.set('jellyUserId', data.userId);
        Cookies.set('jellyAccessToken', data.access_token);

        const validation = await store.validateJellyfinCredentials(userEmail, data.access_token);
        if (!validation.isValid) {
          throw new Error('Failed to validate Jellyfin credentials after login');
        }

        update(state => ({
          ...state,
          jellyUserId: data.userId,
          jellyAccessToken: data.access_token,
          isJellyLoading: false,
          jellyAuthFailed: false,
          jellyAuthError: null,
          needsReauth: false,
          retryCount: 0,
        }));
        // console.log('Jellyfin login successful:', data);
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
        retryCount: 0,
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
        retryCount: 0,
      }));
    },

    resetAuthCircuitBreaker: () => {
      console.log('🔧 Manually resetting auth circuit breaker');
      authCircuitBreakerOpen = false;
      consecutiveAuthFailures = 0;
      authCircuitBreakerOpenTime = 0;
    },

    logout: async () => {
      if (!browser) return;
      
      console.log('🚪 authStore.logout() called');
      console.trace('🔍 Call stack for logout:');
      
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
            // console.log('User is authenticated');
          }
        });
      }
    }
  };

  return store;
}

export const authStore = createAuthStore();

if (browser) {
  // Only initialize the store, don't auto-check auth status
  // Auth status check is now handled by AppInitializer for better control
  authStore.initialize();
}