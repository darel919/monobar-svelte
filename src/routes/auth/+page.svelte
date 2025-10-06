<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { authStore } from '$lib/stores/authStore';
  import { goto, invalidateAll } from '$app/navigation';
  import Cookies from 'js-cookie';

  let status = 'Processing authentication...';
  let isSuccess = false;
  let hasRedirected = false;

  onMount(() => {
    if (!browser) return;

    async function handleAuthCallback() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const accessToken = urlParams.get('at');
        const refreshToken = urlParams.get('rt');
        
        // console.log('Auth callback params:', { 
        //   hasAccessToken: !!accessToken, 
        //   hasRefreshToken: !!refreshToken
        // });
        
        if (accessToken) {
          const tokenParts = accessToken.split('.');
          if (tokenParts.length !== 3) {
            throw new Error('Invalid JWT format');
          }
          
          const tokenPayload = JSON.parse(atob(tokenParts[1]));
          
          const currentTime = Math.floor(Date.now() / 1000);
          if (tokenPayload.exp && tokenPayload.exp <= currentTime) {
            throw new Error('Token has expired');
          }
          
          // Verify the token with the new DWS profile endpoint
          const verification = await authStore.verifyDWSProfile(accessToken);
          if (!verification.isValid) {
            throw new Error('Token verification failed');
          }
          
          const verifiedUserData = verification.user;
          const userSessionData = {
            access_token: accessToken,
            refresh_token: refreshToken || null,
            user: {
              id: verifiedUserData?.id || tokenPayload.sub,
              email: verifiedUserData?.email || tokenPayload.email,
              user_metadata: {
                ...tokenPayload.user_metadata,
                ...verifiedUserData,
                full_name: verifiedUserData?.name || tokenPayload.user_metadata?.full_name,
                avatar_url: verifiedUserData?.avatar || tokenPayload.user_metadata?.avatar_url
              },
              app_metadata: tokenPayload.app_metadata || {}
            }
          };
          
          localStorage.setItem('user-session', JSON.stringify(userSessionData));
          Cookies.set('user-session', JSON.stringify(userSessionData), { expires: 30 });
          
          localStorage.setItem('authSuccess', 'true');
          
          await authStore.checkAuthStatus();
          
          status = 'Authentication successful! Redirecting...';
          isSuccess = true;
          
          setTimeout(async () => {
            if (window.opener) {
              window.opener.postMessage({ type: 'AUTH_SUCCESS' }, window.location.origin);
              window.close();
            } else if (!hasRedirected) {
              hasRedirected = true;
              // Direct navigation (not popup) - only redirect if no popup handler is active
              const redirectPath = localStorage.getItem('redirectAfterAuth') || '/';
              console.log('🎯 Auth callback (direct) redirecting to:', redirectPath);
              localStorage.removeItem('redirectAfterAuth');
              
              // Ensure proper data refresh
              console.log('🔄 Direct auth complete, refreshing data...');
              await new Promise(resolve => setTimeout(resolve, 300));
              await invalidateAll();
              
              goto(redirectPath, { replaceState: true });
            }
          }, 1500);
        } else {
          status = 'Authentication failed. No valid token received.';
          isSuccess = false;
          
          setTimeout(() => {
            if (window.opener) {
              window.opener.postMessage({ type: 'AUTH_ERROR', error: 'No token received' }, window.location.origin);
              window.close();
            } else {
              goto('/', { replaceState: true });
            }
          }, 2000);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        status = 'Authentication failed.';
        isSuccess = false;
        
        setTimeout(() => {
          if (window.opener) {
            window.opener.postMessage({ type: 'AUTH_ERROR', error: 'Authentication failed' }, window.location.origin);
            window.close();
          } else {
            goto('/', { replaceState: true });
          }
        }, 2000);
      }
    }

    handleAuthCallback();
  });
</script>

<svelte:head>
  <title>Authentication - Monobar</title>
</svelte:head>

<div class="flex flex-col items-center justify-center min-h-screen p-8">
  <div class="card bg-base-200 shadow-xl max-w-md w-full">
    <div class="card-body text-center">
      {#if isSuccess}
        <div class="text-success mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      {:else}
        <div class="mb-4">
          <div class="loading loading-spinner loading-lg"></div>
        </div>
      {/if}
      
      <h2 class="card-title justify-center mb-4">
        {isSuccess ? 'Success!' : 'Processing...'}
      </h2>
      
      <p class="text-center">{status}</p>
    </div>
  </div>
</div>
