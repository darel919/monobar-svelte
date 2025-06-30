<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { authStore } from '$lib/stores/authStore';
  import { goto } from '$app/navigation';
  import LoginButton from '$lib/components/Auth/LoginButton.svelte';

  let isAuthenticated = false;
  let isLoading = true;

  onMount(() => {
    if (!browser) return;

    const unsubscribe = authStore.subscribe(state => {
      isAuthenticated = state.isAuthenticated;
      isLoading = state.isLoading;
      
      if (isAuthenticated) {
        const redirectPath = localStorage.getItem('redirectAfterAuth') || '/';
        localStorage.removeItem('redirectAfterAuth');
        goto(redirectPath);
      }
    });

    authStore.checkAuthStatus();

    return unsubscribe;
  });
</script>

<svelte:head>
  <title>Login - Monobar</title>
</svelte:head>

{#if isLoading}
  <div class="flex justify-center items-center min-h-screen">
    <div class="loading loading-spinner loading-lg"></div>
  </div>
{:else if !isAuthenticated}
  <div class="flex flex-col items-center justify-center min-h-screen p-8">
    <div class="card bg-base-200 shadow-xl max-w-md w-full">
      <div class="card-body text-center">
        <h1 class="card-title justify-center text-3xl mb-6">Sign in to moNobar</h1>
        <!-- <p class="text-lg mb-8">Please log in to continue</p> -->
        
        <div class="card-actions justify-center">
          <LoginButton 
            redirectPath={browser ? (new URLSearchParams(window.location.search).get('redirect') || '/') : '/'} 
            className="btn-wide"
          />
        </div>
        
        <div class="divider"></div>
        
        <p class="text-sm opacity-70">
          By logging in, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  </div>
{:else}
  <div class="flex justify-center items-center min-h-screen">
    <div class="loading loading-spinner loading-lg"></div>
    <span class="ml-2">Redirecting...</span>
  </div>
{/if}
