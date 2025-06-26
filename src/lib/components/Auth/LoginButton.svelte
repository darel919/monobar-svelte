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
      <svg class="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 10.25c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5.67 1.5 1.5 1.5 1.5-.67 1.5-1.5z"
        />
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
