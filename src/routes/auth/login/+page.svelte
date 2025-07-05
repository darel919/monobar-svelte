<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { authStore } from '$lib/stores/authStore';
  import { goto } from '$app/navigation';
  import LoginButton from '$lib/components/Auth/LoginButton.svelte';

  let isAuthenticated = false;
  let isLoading = true;
  let hasRedirected = false;

  onMount(() => {
    if (!browser) return;

    const unsubscribe = authStore.subscribe(state => {
      isAuthenticated = state.isAuthenticated;
      isLoading = state.isLoading;
      
      if (isAuthenticated && !hasRedirected) {
        hasRedirected = true;
        const redirectPath = localStorage.getItem('redirectAfterAuth');
        if (redirectPath && redirectPath !== '/') {
          console.log('🎯 Login page redirecting after auth to:', redirectPath);
          localStorage.removeItem('redirectAfterAuth');
          goto(redirectPath, { replaceState: true });
        } else {
          console.log('🎯 Login page redirecting authenticated user to home');
          goto('/', { replaceState: true });
        }
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
        <h1 class="card-title font-light justify-center text-3xl mb-4">sign in to moNobar</h1>
        <!-- <h3 class="mb-6 font-light">to enjoy moNobar's full library experience, you need to sign in. it's free!</h3> -->
        <!-- <p class="text-lg mb-8">Please log in to continue</p> -->
        
        <div class="card-actions justify-center">
          <LoginButton 
            redirectPath="/"
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
    <span class="ml-2">wait a moment...</span>
  </div>
{/if}
