<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { authStore } from '$lib/stores/authStore';
  import LoginButton from './LoginButton.svelte';

  export let requireAuth: boolean = false;
  export let redirectPath: string = '';
  export let showLoginButton: boolean = true;
  export let customLoginComponent: any = null;

  let isAuthenticated = false;
  let isLoading = true;
  let needsReauth = false;
  let showAuthModal = false;

  onMount(() => {
    if (!browser) return;

    const unsubscribe = authStore.subscribe(state => {
      isAuthenticated = state.isAuthenticated;
      isLoading = state.isLoading;
      needsReauth = state.needsReauth;
      
      if (requireAuth && !isLoading && (!isAuthenticated || needsReauth)) {
        showAuthModal = true;
      } else if (isAuthenticated && !needsReauth) {
        showAuthModal = false;
      }
    });

    authStore.checkAuthStatus();

    return unsubscribe;
  });

  function handleAuthSuccess() {
    showAuthModal = false;
    authStore.clearReauthState();
  }



  function handleAuthCancel() {
    showAuthModal = false;
  }

  function openAuthModal() {
    showAuthModal = true;
  }
</script>

<!-- Auth Modal -->
{#if showAuthModal}
  <div class="modal modal-open">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">
        {needsReauth ? 'Re-authentication Required' : 'Authentication Required'}
      </h3>
      <p class="py-4">
        {needsReauth 
          ? 'Your session has expired. Please sign in again to continue.' 
          : 'Please log in to access this content.'}
      </p>
      
      <div class="modal-action flex flex-col gap-4">
        {#if customLoginComponent}
          <svelte:component 
            this={customLoginComponent} 
            {redirectPath}
            on:success={handleAuthSuccess}
            on:cancel={handleAuthCancel}
          />
        {:else if showLoginButton}
          <LoginButton 
            {redirectPath} 
            className="w-full" 
          />
        {/if}
        
        <button 
          class="btn btn-ghost" 
          on:click={() => showAuthModal = false}
        >
          Cancel
        </button>
      </div>
    </div>
    <div 
      class="modal-backdrop" 
      role="button"
      tabindex="0"
      on:click={() => showAuthModal = false}
      on:keydown={(e) => {
        if (e.key === 'Escape' || e.key === 'Enter') {
          showAuthModal = false;
        }
      }}
    ></div>
  </div>
{/if}

<!-- Loading State -->
{#if isLoading}
  <div class="flex justify-center items-center min-h-[200px]">
    <div class="loading loading-spinner loading-lg"></div>
  </div>
{/if}

<!-- Authenticated Content -->
{#if !isLoading && isAuthenticated}
  <slot name="authenticated" {isAuthenticated} />
{/if}

<!-- Unauthenticated Content -->
{#if !isLoading && !isAuthenticated && !requireAuth}
  <slot name="unauthenticated" {isAuthenticated} {openAuthModal} />
{/if}

<!-- Default Content -->
{#if !isLoading}
  <slot {isAuthenticated} {isLoading} {openAuthModal} />
{/if}