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

export function getSessionId() {
    if (!browser) return '';
    try {
        return localStorage.getItem('DeviceId') || '';
    } catch (error) {
        console.error('Failed to get session ID:', error);
        return '';
    }
}

export function getSessionHeaders(cookies: any = null) {
    const headers: { [key: string]: string } = {};
    
    const authHeader = getAuthorizationHeader(cookies);
    if (authHeader) {
        headers['Authorization'] = authHeader;
    }
    
    const sessionId = getSessionId();
    if (sessionId) {
        headers['X-Session-Id'] = sessionId;
    }
    
    return headers;
}

export function openLoginWindow(currentPath: string, onAuthCancelled?: (error: string) => void): boolean {
  if (!browser) return false;
  
  localStorage.setItem("redirectAfterAuth", currentPath);
  
  sessionStorage.removeItem("redirectionCompleted");
  sessionStorage.removeItem("authCancelled");
  localStorage.removeItem("authSuccess");
  
  const redirectUrl = encodeURIComponent(`${window.location.origin}/auth`);
  const authUrl = `https://darelisme.my.id/auth/login?redirectExternal=${redirectUrl}`;
  
  const loginWindow = window.open(authUrl, 'darelismeLogin', 'width=600,height=700');
  
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
      
      console.log('Auth check:', { isAuthenticated, authSuccessFlag, hasUserSession: !!userSessionExists });
      
      if (isAuthenticated) {
        console.log('Auth detected via store state');
        clearInterval(checkWindowClosed);
        authDetected = true;
        const redirectPath = localStorage.getItem("redirectAfterAuth") || "/";
        localStorage.removeItem("redirectAfterAuth");
        // Wait for store to be fully updated before navigation
        let tries = 0;
        while (tries < 10) {
          const state = get(authStore);
          if (state.isAuthenticated) break;
          await new Promise(res => setTimeout(res, 50));
          tries++;
        }
        await invalidateAll();
        goto(redirectPath, { replaceState: true });
        return;
      }
      
      if (authSuccessFlag) {
        console.log('Auth detected via localStorage flag');
        localStorage.removeItem('authSuccess');
        clearInterval(checkWindowClosed);
        authDetected = true;

        await authStore.checkAuthStatus();
        // Wait for store to be fully updated before navigation
        let tries = 0;
        while (tries < 10) {
          const state = get(authStore);
          if (state.isAuthenticated) break;
          await new Promise(res => setTimeout(res, 50));
          tries++;
        }
        const redirectPath = localStorage.getItem("redirectAfterAuth") || "/";
        localStorage.removeItem("redirectAfterAuth");
        await invalidateAll();
        goto(redirectPath, { replaceState: true });
        return;
      }
      
      if (loginWindow.closed) {
        console.log('Login window closed, performing final auth check');
        clearInterval(checkWindowClosed);

        setTimeout(async () => {
          const finalAuthState = get(authStore);
          const finalAuthCheck = finalAuthState.isAuthenticated;
          const finalStorageCheck = localStorage.getItem('authSuccess') === 'true';
          const finalUserSession = localStorage.getItem('user-session');
          
          console.log('Final auth check:', { finalAuthCheck, finalStorageCheck, hasFinalUserSession: !!finalUserSession });
          
          if (finalAuthCheck || finalStorageCheck || finalUserSession) {
            localStorage.removeItem('authSuccess');
            authDetected = true;

            await authStore.checkAuthStatus();
            // Wait for store to be fully updated before navigation
            let tries = 0;
            while (tries < 10) {
              const state = get(authStore);
              if (state.isAuthenticated) break;
              await new Promise(res => setTimeout(res, 50));
              tries++;
            }

            const redirectPath = localStorage.getItem("redirectAfterAuth") || "/";
            localStorage.removeItem("redirectAfterAuth");
            await invalidateAll();
            goto(redirectPath, { replaceState: true });          
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
  
  localStorage.setItem("redirectAfterAuth", currentPath);
  sessionStorage.removeItem("redirectionCompleted");
  const redirectUrl = encodeURIComponent(`${window.location.origin}/auth`);
  window.location.href = `https://darelisme.my.id/auth/login?redirectExternal=${redirectUrl}`;
}

export function useRequireAuth() {
  return {
    checkAuth: () => {
      const currentState = get(authStore);
      return currentState.isAuthenticated;
    }
  };
}
