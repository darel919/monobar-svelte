<script lang="ts">
  import LibraryLeftoversView from '$lib/components/LibraryLeftoversView.svelte';
    import LibraryViewDisplay from '$lib/components/LibraryViewDisplay.svelte';
    import StopState from '$lib/components/StopState.svelte';
    import { authStore } from '$lib/stores/authStore';
    import { get } from 'svelte/store';
    
    export let data;

    // Automatically handle expired/invalid JWT: try reauth, then sign out if fails
    const handleAuthError = async (serverError: string) => {
        const isAuthError =
            serverError.includes('401') ||
            serverError.toLowerCase().includes('jwt') ||
            serverError.toLowerCase().includes('token') ||
            serverError.toLowerCase().includes('expired') ||
            serverError.toLowerCase().includes('unauthorized') ||
            serverError.toLowerCase().includes('forbidden');
        
        if (isAuthError) {
            // Try reauth up to 3 times, then sign out
            let attempts = 0;
            const tryReauth = async () => {
                attempts++;
                await authStore.checkAuthStatus();
                const state = get(authStore);
                if (state.isAuthenticated) return;
                if (attempts < 3) {
                    setTimeout(tryReauth, 500);
                } else {
                    await authStore.logout();
                }
            };
            tryReauth();
        }
    };

</script>

<svelte:head>
    <title>Home - moNobar</title>
</svelte:head>

<main class="flex flex-col min-h-screen p-8 pt-20">
    <section class="mb-8">
        <h1 class="text-4xl font-extralight">home</h1>
    </section>

    {#await data.leftoversData}
        <div class="flex items-center justify-center min-h-[20vh]">
            <div class="loading loading-spinner loading-md"></div>
            <p class="text-base opacity-70">Looking for leftovers...</p>
        </div>
    {:then leftovers}
        {#if leftovers}
            <!-- {console.log('Leftovers data:', leftovers.data)} -->
            <section class="mb-8">
                <h2 class="text-2xl mb-4" title="you've left these before. continue watching?">leftovers</h2>
                <LibraryLeftoversView data={leftovers.data}></LibraryLeftoversView>
            </section>
        {/if}
    {/await}

    {#await data.serverData}
        <div class="flex items-center justify-center min-h-[60vh]">
            <div class="flex flex-col items-center gap-4">
                <div class="loading loading-spinner loading-lg"></div>
                <p class="text-lg opacity-70">Loading home content...</p>
            </div>
        </div>
    {:then serverData}
        {@const libraryCategories = serverData?.data || []}
        {@const libraryComingSoon = serverData?.data?.comingSoon || []}
        {@const serverError = serverData?.error}

        {#if serverError && typeof serverError === 'string'}
            {handleAuthError(serverError)}
        {/if}

        {#if libraryCategories.length === 0}
            <StopState
                action="reload"
                message="moNobar is not available."
                actionDesc="Backend returns no data. Please try again in a little while."
                actionText="Reload">
            </StopState>
        {:else}
            {#each libraryCategories as category}
                {#if category.latest && category.latest.length > 0}
                    <section class="mb-8">
                        <div class="flex items-center mb-4">
                            <a href={`/library?id=${category.Id}`} class="hover:underline">
                                <h2 class="text-2xl">latest <b>{category.Name.toLowerCase()}</b></h2>
                            </a>
                        </div>
                        <LibraryViewDisplay data={category.latest} viewMode="default_thumb_home" />
                    </section>
                {/if}
            {/each}

            {#if libraryComingSoon && libraryComingSoon.length > 0}
                <section class="mb-8">
                    <h2 class="text-2xl mb-4">Coming Soon</h2>
                    <LibraryViewDisplay data={libraryComingSoon} viewMode="default_thumb_home" />
                </section>
            {/if}
        {/if}
    {:catch error}
        <StopState
            action="reload"
            message="Failed to load home content"
            actionDesc="There was an error loading the home page. Please try again."
            actionText="Reload">
        </StopState>
    {/await}
</main>