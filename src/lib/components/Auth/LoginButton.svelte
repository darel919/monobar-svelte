<script lang="ts">
  import { openLoginWindow, redirectToLogin } from '$lib/utils/authUtils';
  import { browser } from '$app/environment';

  export let redirectPath: string = '';
  export let className: string = '';

  let isLoading = false;
  let error: string | null = null;

  function handleLogin() {
    if (!browser) return;
    
    isLoading = true;
    error = null;
    
    const currentPath = redirectPath || window.location.pathname;
    
    const popupOpened = openLoginWindow(currentPath, (errorMessage: string) => {
      error = errorMessage;
      isLoading = false;
      
      setTimeout(() => {
        redirectToLogin(currentPath);
      }, 1000);
    });
    
    if (!popupOpened) {
      redirectToLogin(currentPath);
    } else {
      setTimeout(() => {
        isLoading = false;
      }, 2000);
    }
  }
</script>

<div class="flex flex-col items-center space-y-4">
  <button
    on:click={handleLogin}
    disabled={isLoading}
    class="btn btn-primary btn-lg flex items-center space-x-2 {isLoading ? 'loading' : ''} {className}"
  >
    {#if !isLoading}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
      </svg>

      Login with DWS
    {:else}
      <span class="loading loading-spinner loading-sm"></span>
      Authenticating...
    {/if}
  </button>
  
  {#if error}
    <div class="alert alert-error text-sm">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{error}</span>
    </div>
  {/if}
</div>
