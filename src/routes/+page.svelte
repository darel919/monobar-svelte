<script>
    import LibraryViewDisplay from '$lib/components/LibraryViewDisplay.svelte';
    import StopState from '$lib/components/StopState.svelte';
    import { authStore } from '$lib/stores/authStore';
    import { onMount } from 'svelte';
    
    export let data;
    
    $: serverData = data.serverData;
    $: libraryCategories = serverData?.data || [];
    $: libraryComingSoon = serverData?.data?.comingSoon || [];
    $: serverError = serverData?.error;

    // Automatically handle expired/invalid JWT: try reauth, then sign out if fails
    onMount(() => {
        if (serverError && typeof serverError === 'string') {
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
        }
    });
</script>

<main class="flex flex-col min-h-screen p-8 pt-20">
    <section class="mb-8">
        <h1 class="text-4xl font-extralight">home</h1>
    </section>

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
                        <span class="mr-2 text-xl">Latest</span>
                        <a href={`/library?id=${category.Id}`} class="hover:underline">
                            <h2 class="text-2xl">{category.Name}</h2>
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
</main>


