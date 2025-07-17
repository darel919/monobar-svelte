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
  let showFinalError = false;
  let showSuccess = false;
  let lastJellyAuthFailed = false;

  onMount(() => {
    if (!browser) return;

    const unsubscribe = authStore.subscribe(state => {
      lastJellyAuthFailed = jellyAuthFailed;
      jellyAuthFailed = state.jellyAuthFailed;
      isJellyLoading = state.isJellyLoading;
      jellyAuthError = state.jellyAuthError;
      userSession = state.userSession;
      retryCount = state.retryCount ?? 0;

      // Only auto-retry if not already at max attempts and not loading
      if (jellyAuthFailed && !isJellyLoading && userSession?.user?.id && !hasAutoRetried && retryCount < 10 && !showFinalError) {
        hasAutoRetried = true;
        // Exponential backoff: increase delay based on retry count
        const baseDelay = 2000; // Start with 2 seconds
        const delay = Math.min(baseDelay * Math.pow(1.5, retryCount), 30000); // Max 30 seconds
        console.log(`🔄 Auto-retrying Jellyfin auth in ${delay}ms (attempt ${retryCount + 1}/10)`);
        setTimeout(() => retryJellyfinAuth(), delay);
      }

      // Show success only if previously failed and now succeeded, and user is authenticated
      if (lastJellyAuthFailed && !jellyAuthFailed && userSession?.user?.id && retryCount === 0) {
        showSuccess = true;
        showFinalError = false;
        setTimeout(() => showSuccess = false, 3000);
      }

      // If failed after 10 attempts, show error
      if (jellyAuthFailed && retryCount >= 10) {
        showFinalError = true;
      }

      // Reset auto-retry flag if not failed
      if (!jellyAuthFailed) {
        hasAutoRetried = false;
      }
    });

    return unsubscribe;
  });

  function retryJellyfinAuth() {
    if (userSession?.user?.id && retryCount < 10) {
      authStore.loginToJellyfin(userSession.user.id);
      hasAutoRetried = false;
    }
  }

  function handleDismiss() {
    authStore.clearJellyfinAuthState();
    hasAutoRetried = false;
    retryCount = 0;
    showFinalError = false;
    showSuccess = false;
  }

  function handleRetry() {
    showFinalError = false;
    retryCount = 0;
    retryJellyfinAuth();
  }
</script>

{#if showSuccess}
  <div class="toast toast-top toast-center z-[100]">
    <div class="alert alert-success shadow-lg">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          <span class="font-semibold">Successfully logged in.</span>
        </div>
      </div>
    </div>
  </div>
{:else if showFinalError}
  <div class="toast toast-top toast-center z-[100]">
    <div class="alert alert-error shadow-lg">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2.25m0 4.5h.008v.008H12v-.008zm0-10.5a9 9 0 100 18 9 9 0 000-18z" />
          </svg>
          <span class="font-semibold">Unable to connect to backend authenticaion services after 10 attempts.</span>
        </div>
        <p class="text-sm">{jellyAuthError || 'Please try again later.'}</p>
        <div class="flex gap-2 mt-2">
          <button class="btn btn-sm btn-error" on:click={handleRetry}>Retry</button>
          <button class="btn btn-sm btn-ghost" on:click={handleDismiss}>Dismiss</button>
        </div>
      </div>
    </div>
  </div>
{/if}
