<script>
import { authStore } from '$lib/stores/authStore';
import { goto } from '$app/navigation';

function handleSignOut() {
    authStore.logout();
    goto('/');
}
</script>
<svelte:head>
    <title>your account - moNobar</title>
</svelte:head>

<section class="mx-auto px-8 min-h-screen mt-20">
    <h1 class="text-4xl font-extralight mb-6">your account</h1>
    <!-- {console.log('Auth Store:', $authStore)} -->

    {#if $authStore.isAuthenticated && $authStore.userSession?.user}
        <div class="flex items-center gap-6 mb-8">
            {#if $authStore.userSession.user.user_metadata.avatar_url}
                <img src={$authStore.userSession.user.user_metadata.avatar_url} alt="Avatar" class="h-20 w-20 rounded-full object-cover border border-base-300 shadow" referrerpolicy="no-referrer" />
            {/if}
            <div>
                <div class="text-xl font-semibold">{$authStore.userSession.user.user_metadata.full_name || $authStore.userSession.user.email}</div>
                <div class="text-base text-base-content/70">{$authStore.userSession.user.email}</div>
            </div>
        </div>
        <button class="btn btn-error btn-outline" on:click={handleSignOut}>Sign Out</button>
    {:else}
        <div class="text-lg">You are not logged in.</div>
    {/if}
</section>
