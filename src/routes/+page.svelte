<script lang="ts">
  import HomeGreeting from '$lib/components/HomeGreeting.svelte';
  import LibraryLeftoversView from '$lib/components/LibraryLeftoversView.svelte';
    import LibraryViewDisplay from '$lib/components/LibraryViewDisplay.svelte';
    import StopState from '$lib/components/StopState.svelte';
    import HomeHeroCarousel from '$lib/components/HomeHeroCarousel.svelte';
    import { authStore } from '$lib/stores/authStore';
    import { get } from 'svelte/store';
    import { onMount } from 'svelte';
    import { invalidateAll } from '$app/navigation';
    import { browser } from '$app/environment';
    
    export let data;

    let leftoversPromise = data.leftoversData;
    let nextEpisodesPromise = data.nextEpisodesData;
    let recommendationsPromise = data.recommendationData;

    onMount(() => {
        if (!browser) return;

        // Check if user just completed authentication and force refresh if needed
        const checkPostAuthRefresh = () => {
            const authSuccess = localStorage.getItem('authSuccess');
            const userSession = localStorage.getItem('user-session');
            const currentState = get(authStore);
            
            if ((authSuccess === 'true' || userSession) && currentState.isAuthenticated) {
                // console.log('🏠 Home page detected recent auth completion, forcing data refresh...');
                localStorage.removeItem('authSuccess');
                
                setTimeout(() => {
                    invalidateAll();
                }, 100);
            }
        };
        
        // Check immediately and also subscribe to auth changes
        checkPostAuthRefresh();
        
        const unsubscribe = authStore.subscribe(state => {
            if (state.isAuthenticated) {
                checkPostAuthRefresh();
            }
        });
        
        return unsubscribe;
    });

    async function refreshLeftovers() {
        const response = await fetch('/api/leftovers');
        const newData = await response.json();
        leftoversPromise = Promise.resolve(newData);
    }

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

<!-- Hero Carousel -->
<HomeHeroCarousel 
    leftoversData={leftoversPromise} 
    recommendationsData={recommendationsPromise} 
    nextUpData={nextEpisodesPromise}
/>

<main class="flex flex-col min-h-screen p-8 pt-20">
    <section class="mb-4">
        <h1 class="mb-6 text-5xl font-light">home</h1>
        <section class="">
            <HomeGreeting></HomeGreeting>
        </section>
    </section>


    {#await leftoversPromise}
        <!-- Display nothing -->
    {:then leftovers}
        {#if leftovers.data && leftovers.data.length > 0}
            <section class="mb-8">
                <h2 class="text-2xl mb-4" title="you've left these before. resume watching?">leftovers</h2>
                <LibraryLeftoversView data={leftovers.data} onDataRefresh={refreshLeftovers}></LibraryLeftoversView>
            </section>
        {/if}
    {/await}

    {#await nextEpisodesPromise}
        <!-- Display nothing -->
    {:then playNext}
        {#if playNext.data && playNext.data.length > 0}
            <section class="mb-8">
                <h2 class="text-2xl mb-4" title="watch next episode?">next up</h2>
                <LibraryLeftoversView data={playNext.data} onDataRefresh={refreshLeftovers}></LibraryLeftoversView>
            </section>
        {/if}
    {/await}

    {#await recommendationsPromise}
        <!-- Display nothing -->
    {:then recommendations}
        {#if recommendations.data && recommendations.data.length > 0}
            <section class="mb-8">
                <h2 class="text-2xl mb-4" title="maybe these ones?">something to watch</h2>
                <LibraryViewDisplay data={recommendations.data} viewMode="default_thumb_home"></LibraryViewDisplay>
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