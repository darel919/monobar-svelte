import { browser } from '$app/environment';
import { authStore } from '../stores/authStore';
import { get } from 'svelte/store';
import { goto, invalidateAll } from '$app/navigation';
import Cookies from 'js-cookie';

export function getAuthorizationHeader(cookies: any = null) {
    let jellyAccessToken = null;
    let jellyUserId = null;
    
    if (browser) {
        jellyAccessToken = Cookies.get('jellyAccessToken');
        jellyUserId = Cookies.get('jellyUserId');
    } else if (cookies && typeof cookies.get === 'function') {
        jellyAccessToken = cookies.get('jellyAccessToken');
        jellyUserId = cookies.get('jellyUserId');
    }
    
    if (jellyUserId && jellyAccessToken) {
        return `monobar_user=${jellyUserId},monobar_token=${jellyAccessToken}`;
    }
    
    return null;
}

export function getSessionId(cookies: any = null): string {
    if (browser) {
        const deviceId = Cookies.get('DeviceId');
        if (deviceId) return deviceId;
        
        // Generate a simple device ID if none exists
        const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        Cookies.set('DeviceId', sessionId, { path: '/' });
        return sessionId;
    } else if (cookies && typeof cookies.get === 'function') {
        // Server-side: get DeviceId from cookies
        return cookies.get('DeviceId') || '';
    }
    return '';
}

export function getSessionHeaders(cookies: any = null) {
    const headers: { [key: string]: string } = {};
    
    const authHeader = getAuthorizationHeader(cookies);
    if (authHeader) {
        headers['Authorization'] = authHeader;
    }
    
    const sessionId = getSessionId(cookies);
    if (sessionId) {
        headers['X-Session-Id'] = sessionId;
    }
    
    return headers;
}

let isHandlingAuthRedirect = false;
let isHandlingAuthSuccess = false;
let isOnLoginPage = false;

// Reset the flag after a timeout in case something goes wrong
function resetAuthRedirectFlag() {
  setTimeout(() => {
    console.log('🔧 Resetting auth redirect flags');
    isHandlingAuthRedirect = false;
    isHandlingAuthSuccess = false;
    isOnLoginPage = false;
  }, 3000);
}

// Check if we're currently on the login page
function checkIfOnLoginPage(): boolean {
  if (!browser) return false;
  return window.location.pathname === '/auth/login';
}

export function openLoginWindow(currentPath: string, onAuthCancelled?: (error: string) => void): boolean {
  if (!browser) return false;
  
  // Only set redirectAfterAuth if none exists, or if the new path is more specific
  const existingRedirect = localStorage.getItem("redirectAfterAuth");
  console.log('🔧 openLoginWindow - existing redirect:', existingRedirect, 'new path:', currentPath);
  
  const shouldUpdate = !existingRedirect || 
                      (existingRedirect === '/' && currentPath !== '/') ||
                      (!existingRedirect.includes('?') && currentPath.includes('?'));
  
  if (shouldUpdate) {
    console.log('🔧 Setting redirectAfterAuth to:', currentPath);
    console.trace('🔍 Call stack for redirectAfterAuth setting:');
    localStorage.setItem("redirectAfterAuth", currentPath);
  } else {
    console.log('🔧 Preserving existing redirectAfterAuth:', existingRedirect);
  }
  
  sessionStorage.removeItem("redirectionCompleted");
  sessionStorage.removeItem("authCancelled");
  localStorage.removeItem("authSuccess");
  
  const clientUrl = encodeURIComponent(window.location.origin);
  const authUrl = `https://account.darelisme.my.id/start?rUrl=${clientUrl}/auth`;
  
  const loginWindow = window.open(authUrl, 'dwsAccountLogin', 'width=600,height=700');
  
  if (!loginWindow) {
    alert("Please allow popups for this site to enable login");
    if (onAuthCancelled) onAuthCancelled("Popup was blocked");
    return false;
  }
  
  let authDetected = false;
  
  const checkWindowClosed = setInterval(async () => {
    if (authDetected) return;
    
    try {
      const currentAuthState = get(authStore);
      const isAuthenticated = currentAuthState.isAuthenticated;
      const authSuccessFlag = localStorage.getItem('authSuccess') === 'true';
      const userSessionExists = localStorage.getItem('user-session');
      const onLoginPage = checkIfOnLoginPage();
      
      // console.log('Auth check:', { isAuthenticated, authSuccessFlag, hasUserSession: !!userSessionExists });
      
      if (isAuthenticated) {
        // console.log('Auth detected via store state');
        clearInterval(checkWindowClosed);
        authDetected = true;
        
        // If we're on login page, let the login page handle the redirect
        if (onLoginPage) {
          console.log('🔧 On login page, letting login page handle redirect');
          return;
        }
        
        if (!isHandlingAuthRedirect && !isHandlingAuthSuccess) {
          isHandlingAuthRedirect = true;
          isHandlingAuthSuccess = true;
          resetAuthRedirectFlag();
          const redirectPath = localStorage.getItem("redirectAfterAuth") || "/";
          localStorage.removeItem("redirectAfterAuth");
          console.log('🔧 Popup handler detected auth, redirecting to:', redirectPath);
          
          // Wait for store to be fully updated before navigation
          let tries = 0;
          while (tries < 15) {
            const state = get(authStore);
            if (state.isAuthenticated) break;
            await new Promise(res => setTimeout(res, 100));
            tries++;
          }
          
          // Ensure data refresh before navigation
          console.log('🔄 Store auth detected, refreshing data...');
          await invalidateAll();
          await new Promise(resolve => setTimeout(resolve, 200));
          
          goto(redirectPath, { replaceState: true });
        }
        return;
      }
      
      if (authSuccessFlag) {
        // console.log('Auth detected via localStorage flag');
        localStorage.removeItem('authSuccess');
        clearInterval(checkWindowClosed);
        authDetected = true;

        // If we're on login page, let the login page handle the redirect
        const onLoginPage = checkIfOnLoginPage();
        if (onLoginPage) {
          console.log('🔧 On login page (flag), letting login page handle redirect');
          return;
        }

        if (!isHandlingAuthRedirect && !isHandlingAuthSuccess) {
          isHandlingAuthRedirect = true;
          isHandlingAuthSuccess = true;
          resetAuthRedirectFlag();
          
          await authStore.checkAuthStatus();
          // Wait for store to be fully updated before navigation
          let tries = 0;
          while (tries < 15) {
            const state = get(authStore);
            if (state.isAuthenticated) break;
            await new Promise(res => setTimeout(res, 100));
            tries++;
          }
          
          const redirectPath = localStorage.getItem("redirectAfterAuth") || "/";
          localStorage.removeItem("redirectAfterAuth");
          console.log('🔧 Popup handler (flag) detected auth, redirecting to:', redirectPath);
          
          // Ensure data refresh before navigation
          console.log('🔄 Flag auth detected, refreshing data...');
          await invalidateAll();
          await new Promise(resolve => setTimeout(resolve, 200));
          
          goto(redirectPath, { replaceState: true });
        }
        return;
      }
      
      if (loginWindow.closed) {
        console.warn('Login window closed, performing final auth check');
        clearInterval(checkWindowClosed);

        setTimeout(async () => {
          const finalAuthState = get(authStore);
          const finalAuthCheck = finalAuthState.isAuthenticated;
          const finalStorageCheck = localStorage.getItem('authSuccess') === 'true';
          const finalUserSession = localStorage.getItem('user-session');
          const onLoginPage = checkIfOnLoginPage();
          
          // console.log('Final auth check:', { finalAuthCheck, finalStorageCheck, hasFinalUserSession: !!finalUserSession });
          
          if (finalAuthCheck || finalStorageCheck || finalUserSession) {
            localStorage.removeItem('authSuccess');
            authDetected = true;

            // If we're on login page, let the login page handle the redirect
            if (onLoginPage) {
              console.log('🔧 On login page (final), letting login page handle redirect');
              return;
            }

            if (!isHandlingAuthRedirect && !isHandlingAuthSuccess) {
              isHandlingAuthRedirect = true;
              isHandlingAuthSuccess = true;
              resetAuthRedirectFlag();
              
              // Force auth store update
              await authStore.checkAuthStatus();
              
              // Wait for store to be fully updated and ensure state propagation
              let tries = 0;
              while (tries < 15) {
                const state = get(authStore);
                if (state.isAuthenticated) break;
                await new Promise(res => setTimeout(res, 100));
                tries++;
              }

              // Ensure data refresh happens before navigation
              console.log('🔄 Popup auth complete, refreshing data...');
              await invalidateAll();
              
              // Small delay to ensure all stores are updated
              await new Promise(resolve => setTimeout(resolve, 250));

              const redirectPath = localStorage.getItem("redirectAfterAuth") || "/";
              localStorage.removeItem("redirectAfterAuth");
              console.log('🔧 Popup handler (final check) detected auth, redirecting to:', redirectPath);
              
              goto(redirectPath, { replaceState: true });
            }          
          } else {
            sessionStorage.setItem("authCancelled", "true");
            if (onAuthCancelled) onAuthCancelled("Login window was closed");
          }
        }, 500);
      }
    } catch (e) {
      console.error("Error checking auth status:", e);
    }
  }, 500);
  
  return true;
}

export function redirectToLogin(currentPath: string): void {
  if (!browser) return;
  
  // Only set redirectAfterAuth if none exists, or if the new path is more specific
  const existingRedirect = localStorage.getItem("redirectAfterAuth");
  console.log('🔧 redirectToLogin - existing redirect:', existingRedirect, 'new path:', currentPath);
  
  const shouldUpdate = !existingRedirect || 
                      (existingRedirect === '/' && currentPath !== '/') ||
                      (!existingRedirect.includes('?') && currentPath.includes('?'));
  
  if (shouldUpdate) {
    console.log('🔧 Setting redirectAfterAuth to:', currentPath);
    console.trace('🔍 Call stack for redirectAfterAuth setting:');
    localStorage.setItem("redirectAfterAuth", currentPath);
  } else {
    console.log('🔧 Preserving existing redirectAfterAuth:', existingRedirect);
  }
  sessionStorage.removeItem("redirectionCompleted");
  const clientUrl = encodeURIComponent(window.location.origin);
  window.location.href = `https://account.darelisme.my.id/start?rUrl=${clientUrl}/auth`;
}

export function useRequireAuth() {
  return {
    checkAuth: () => {
      const currentState = get(authStore);
      return currentState.isAuthenticated;
    }
  };
}
