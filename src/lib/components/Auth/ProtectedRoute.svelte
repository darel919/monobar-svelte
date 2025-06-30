<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { authStore } from '$lib/stores/authStore';
  import { goto } from '$app/navigation';
  import LoginButton from './LoginButton.svelte';

  export let requireAuth: boolean = true;
  export let redirectOnUnauth: boolean = false;
  export let redirectPath: string = '/auth/login';
  export let allowedRoles: string[] = [];
  export let showFallback: boolean = true;

  let isAuthenticated = false;
  let isLoading = true;
  let userSession: any = null;
  let hasRequiredRole = true;

  onMount(() => {
    if (!browser) return;

    const unsubscribe = authStore.subscribe(state => {
      isAuthenticated = state.isAuthenticated;
      isLoading = state.isLoading;
      userSession = state.userSession;
      
      if (allowedRoles.length > 0 && userSession) {
        const userRole = userSession?.user?.user?.user_metadata?.role;
        hasRequiredRole = allowedRoles.includes(userRole || '');
      }

      if (!isLoading && requireAuth && !isAuthenticated && redirectOnUnauth) {
        goto(redirectPath);
      }
    });

    authStore.checkAuthStatus();

    return unsubscribe;
  });

  $: canAccess = isAuthenticated && hasRequiredRole;
</script>

{#if isLoading}
  <div class="flex justify-center items-center min-h-screen">
    <div class="loading loading-spinner loading-lg"></div>
  </div>
{:else if requireAuth && !isAuthenticated && showFallback}
  <div class="flex flex-col items-center justify-center min-h-screen p-8">
    <div class="card bg-base-200 shadow-xl max-w-md w-full">
      <div class="card-body text-center">
        <h2 class="card-title justify-center mb-4">Authentication Required</h2>
        <p class="mb-6">Please log in to access this page.</p>
        
        <div class="card-actions justify-center">
          <LoginButton 
            redirectPath={browser ? window.location.pathname : ''} 
            className="btn-wide"
          />
        </div>
      </div>
    </div>
  </div>
{:else if requireAuth && isAuthenticated && !hasRequiredRole && showFallback}
  <div class="flex flex-col items-center justify-center min-h-screen p-8">
    <div class="card bg-base-200 shadow-xl max-w-md w-full">
      <div class="card-body text-center">
        <h2 class="card-title justify-center mb-4 text-error">Access Denied</h2>
        <p class="mb-6">You don't have permission to access this page.</p>
        
        <div class="card-actions justify-center">
          <button class="btn btn-primary" on:click={() => goto('/')}>
            Go Home
          </button>
        </div>
      </div>
    </div>
  </div>
{:else if canAccess || !requireAuth}
  <slot {isAuthenticated} {isLoading} {userSession} />
{/if}
