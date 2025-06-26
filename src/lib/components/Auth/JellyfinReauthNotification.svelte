<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { authStore, type UserSession } from '$lib/stores/authStore';

  let jellyAuthFailed = false;
  let isJellyLoading = false;
  let jellyAuthError: string | null = null;
  let userSession: UserSession | null = null;
  let retryCount = 0;
  let hasAutoRetried = false;

  onMount(() => {
    if (!browser) return;

    const unsubscribe = authStore.subscribe(state => {
      jellyAuthFailed = state.jellyAuthFailed;
      isJellyLoading = state.isJellyLoading;
      jellyAuthError = state.jellyAuthError;
      userSession = state.userSession;
      
      if (jellyAuthFailed && !isJellyLoading && userSession?.user?.id && !hasAutoRetried) {
        hasAutoRetried = true;
        setTimeout(() => retryJellyfinAuth(), 1000);
      }
      
      if (!jellyAuthFailed) {
        hasAutoRetried = false;
        retryCount = 0;
      }
    });

    return unsubscribe;
  });

  function retryJellyfinAuth() {
    if (userSession?.user?.id && retryCount < 3) {
      retryCount++;
      authStore.loginToJellyfin(userSession.user.id);
    }
  }

  function handleDismiss() {
    authStore.clearJellyfinAuthState();
    hasAutoRetried = false;
    retryCount = 0;
  }
</script>

{#if jellyAuthFailed}
  <div class="toast toast-top toast-center z-[100]">
    <div class="alert alert-info shadow-lg">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          {#if isJellyLoading}
            <span class="loading loading-spinner loading-sm"></span>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          {/if}
          <span class="font-semibold">
            {isJellyLoading ? 'Reconnecting to Jellyfin...' : 'Jellyfin Connection Failed'}
          </span>
        </div>
        <p class="text-sm">
          {#if isJellyLoading}
            Attempting to reconnect to your Jellyfin profile...
          {:else if retryCount > 0}
            {jellyAuthError || `Connection failed (Attempt ${retryCount}/3). Click retry to try again.`}
          {:else}
            {jellyAuthError || 'Unable to connect to Jellyfin. Retrying automatically.'}
          {/if}
        </p>
        {#if !isJellyLoading}
          <div class="flex gap-2 mt-2">
            <button 
              class="btn btn-sm btn-info" 
              on:click={retryJellyfinAuth}
            >
              Retry Connection
            </button>
            <button 
              class="btn btn-sm btn-ghost" 
              on:click={handleDismiss}
            >
              Dismiss
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
