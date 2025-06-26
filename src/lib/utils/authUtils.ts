import { browser } from '$app/environment';
import { authStore } from '../stores/authStore';
import { get } from 'svelte/store';
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
  
  const checkWindowClosed = setInterval(() => {
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
        window.location.href = redirectPath;
        return;
      }
      
      if (authSuccessFlag) {
        console.log('Auth detected via localStorage flag');
        localStorage.removeItem('authSuccess');
        clearInterval(checkWindowClosed);
        authDetected = true;

        authStore.checkAuthStatus();
        setTimeout(() => {
          const redirectPath = localStorage.getItem("redirectAfterAuth") || "/";
          localStorage.removeItem("redirectAfterAuth");
          window.location.href = redirectPath;
        }, 100);
        return;
      }
      
      if (loginWindow.closed) {
        console.log('Login window closed, performing final auth check');
        clearInterval(checkWindowClosed);

        setTimeout(() => {
          const finalAuthState = get(authStore);
          const finalAuthCheck = finalAuthState.isAuthenticated;
          const finalStorageCheck = localStorage.getItem('authSuccess') === 'true';
          const finalUserSession = localStorage.getItem('user-session');
          
          console.log('Final auth check:', { finalAuthCheck, finalStorageCheck, hasFinalUserSession: !!finalUserSession });
          
          if (finalAuthCheck || finalStorageCheck || finalUserSession) {
            localStorage.removeItem('authSuccess');
            authDetected = true;

            authStore.checkAuthStatus();

            const redirectPath = localStorage.getItem("redirectAfterAuth") || "/";
            localStorage.removeItem("redirectAfterAuth");
            window.location.href = redirectPath;          
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
