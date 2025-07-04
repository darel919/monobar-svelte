<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { authStore } from '$lib/stores/authStore';
  import { openLoginWindow } from '$lib/utils/authUtils';

  let showSignOutNotification = false;
  let needsReauth = false;
  let isAuthenticated = false;
  let lastLogoutTime = 0;

  onMount(() => {
    if (!browser) return;

    const unsubscribe = authStore.subscribe(state => {
      const wasAuthenticated = isAuthenticated;
      const previousNeedsReauth = needsReauth;
      
      isAuthenticated = state.isAuthenticated;
      needsReauth = state.needsReauth;
      
      // Show notification when DWS token becomes invalid (needsReauth becomes true)
      // and user is not authenticated anymore
      if (!isAuthenticated && needsReauth && !previousNeedsReauth) {
        showSignOutNotification = true;
      }
      
      // Also show if user was authenticated but now signed out due to token expiry
      if (wasAuthenticated && !isAuthenticated && needsReauth && state.lastLogoutTime && state.lastLogoutTime > lastLogoutTime) {
        showSignOutNotification = true;
        lastLogoutTime = state.lastLogoutTime || 0;
      }
      
      // Hide notification when user becomes authenticated again
      if (isAuthenticated && !needsReauth) {
        showSignOutNotification = false;
      }
    });

    return unsubscribe;
  });

  function handleSignIn() {
    showSignOutNotification = false;
    const currentPath = browser ? window.location.pathname : '/';
    openLoginWindow(currentPath);
  }

  function handleDismiss() {
    showSignOutNotification = false;
    authStore.clearReauthState();
  }
</script>

{#if showSignOutNotification}
  <div class="toast toast-top toast-center z-[100]">
    <div class="alert alert-warning shadow-lg max-w-md">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <span class="font-semibold">You have been signed out</span>
        </div>
        <p class="text-sm">Your session has expired and you have been automatically signed out. Please sign in again to continue using the application.</p>
        <div class="flex gap-2 mt-2">
          <button 
            class="btn btn-sm btn-warning" 
            on:click={handleSignIn}
          >
            Sign In Again
          </button>
          <button 
            class="btn btn-sm btn-ghost" 
            on:click={handleDismiss}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
