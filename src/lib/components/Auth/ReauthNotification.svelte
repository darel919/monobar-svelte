<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { authStore } from '$lib/stores/authStore';

  let needsReauth = false;

  onMount(() => {
    if (!browser) return;

    const unsubscribe = authStore.subscribe(state => {
      needsReauth = state.needsReauth;
    });

    return unsubscribe;
  });

  function handleReauth() {
    authStore.clearReauthState();
    if (browser) {
      const currentPath = window.location.pathname + window.location.search;
      const existingRedirect = localStorage.getItem('redirectAfterAuth');
      
      // Only set redirectAfterAuth if none exists or current path is more specific
      if (!existingRedirect || (existingRedirect === '/' && currentPath !== '/')) {
        localStorage.setItem('redirectAfterAuth', currentPath);
      }
    }
    window.location.href = '/auth/login';
  }

  function handleDismiss() {
    authStore.clearReauthState();
  }
</script>

{#if needsReauth}
  <div class="toast toast-top toast-center z-[100]">
    <div class="alert alert-warning shadow-lg">
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <span class="font-semibold">Authentication Required</span>
        </div>
        <p class="text-sm">Your session has expired. Please sign in again to continue using the application.</p>
        <div class="flex gap-2 mt-2">
          <button 
            class="btn btn-sm btn-warning" 
            on:click={handleReauth}
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
