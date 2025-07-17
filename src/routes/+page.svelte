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
    import { BASE_API_PATH } from '$lib/config/api';
    import { getAuthorizationHeader, getSessionHeaders } from '$lib/utils/authUtils';
    import { getBaseEnvironment } from '$lib/utils/environment';
    import Cookies from 'js-cookie';
    
    export let data;

    let leftoversPromise = data.leftoversData;
    let nextEpisodesPromise = data.nextEpisodesData;
    let recommendationsPromise = data.recommendationData;
    let isReauthLoading = false;
    let reauthInProgress = false;
    let lastAuthState = false;
    let lastCompleteAuthState = false;
    let refreshInProgress = false;

    // Reactive statement to refresh data when authentication becomes complete
    $: {
        const currentState = $authStore;
        const isCompletelyAuthenticated = currentState.isAuthenticated && 
                                        !currentState.isLoading && 
                                        !currentState.isJellyLoading &&
                                        !currentState.needsReauth;
        
        if (isCompletelyAuthenticated !== lastCompleteAuthState) {
            if (isCompletelyAuthenticated) {
                console.log('🔄 Complete authentication achieved, refreshing home data...');
                // Small delay to ensure auth cookies are properly set
                setTimeout(() => refreshHomeData(), 200);
            }
            lastCompleteAuthState = isCompletelyAuthenticated;
        }
    }

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
            // Track basic authentication state changes for legacy compatibility
            const authStateChanged = lastAuthState !== state.isAuthenticated;
            lastAuthState = state.isAuthenticated;
            
            if (state.isAuthenticated) {
                checkPostAuthRefresh();
            }
        });
        
        return unsubscribe;
    });

    async function refreshLeftovers() {
        try {
            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'dp-Monobar',
                'X-Environment': getBaseEnvironment(window.location),
                ...getSessionHeaders()
            };

            const response = await fetch(`${BASE_API_PATH}/resumeWatching`, {
                method: 'GET',
                headers
            });
            
            if (response.ok) {
                const data = await response.json();
                const newData = { data };
                leftoversPromise = Promise.resolve(newData);
                console.log('✅ Leftovers data refreshed');
            } else {
                console.error('❌ Failed to refresh leftovers:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('❌ Failed to refresh leftovers:', error);
        }
    }

    async function refreshNextEpisodes() {
        try {
            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'dp-Monobar',
                'X-Environment': getBaseEnvironment(window.location),
                ...getSessionHeaders()
            };

            const response = await fetch(`${BASE_API_PATH}/continueWatching`, {
                method: 'GET',
                headers
            });
            
            if (response.ok) {
                const data = await response.json();
                const newData = { data };
                nextEpisodesPromise = Promise.resolve(newData);
                console.log('✅ Next episodes data refreshed');
            } else {
                console.error('❌ Failed to refresh next episodes:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('❌ Failed to refresh next episodes:', error);
        }
    }

    async function refreshHomeData() {
        if (refreshInProgress) {
            console.log('🔄 Home data refresh already in progress, skipping...');
            return;
        }
        
        refreshInProgress = true;
        
        try {
            console.log('🔄 Refreshing home data after authentication...');
            
            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'dp-Monobar',
                'X-Environment': getBaseEnvironment(window.location),
                'X-Origin-Id': 'home',
                ...getSessionHeaders()
            };
            
            // Fetch fresh data with authenticated session - call backend directly
            const [leftoversResponse, nextEpisodesResponse, recommendationsResponse] = await Promise.all([
                fetch(`${BASE_API_PATH}/resumeWatching`, { method: 'GET', headers }),
                fetch(`${BASE_API_PATH}/continueWatching`, { method: 'GET', headers }),
                fetch(`${BASE_API_PATH}/recommendation`, { method: 'GET', headers })
            ]);

            const [leftoversData, nextEpisodesData, recommendationsData] = await Promise.all([
                leftoversResponse.ok ? 
                    leftoversResponse.json().then(data => ({ data })) : 
                    Promise.resolve({ data: null, error: `Failed to fetch leftovers: ${leftoversResponse.status}` }),
                nextEpisodesResponse.ok ? 
                    nextEpisodesResponse.json().then(data => ({ data })) : 
                    Promise.resolve({ data: null, error: `Failed to fetch next episodes: ${nextEpisodesResponse.status}` }),
                recommendationsResponse.ok ? 
                    recommendationsResponse.json().then(data => ({ data })) : 
                    Promise.resolve({ data: null, error: `Failed to fetch recommendations: ${recommendationsResponse.status}` })
            ]);

            // Update the promises with fresh data
            leftoversPromise = Promise.resolve(leftoversData);
            nextEpisodesPromise = Promise.resolve(nextEpisodesData);
            recommendationsPromise = Promise.resolve(recommendationsData);
            
        } catch (error) {
            console.error('❌ Failed to refresh home data:', error);
        } finally {
            refreshInProgress = false;
        }
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
        
        if (isAuthError && !reauthInProgress) {
            console.log('🔄 Starting reauthentication process due to auth error');
            isReauthLoading = true;
            reauthInProgress = true;
            let attempts = 0;
            const maxAttempts = 3;
            const baseDelay = 1000; // Start with 1 second
            
            const tryReauth = async () => {
                if (attempts >= maxAttempts) {
                    console.warn('🔄 Max reauth attempts reached, logging out');
                    isReauthLoading = false;
                    reauthInProgress = false;
                    await authStore.logout();
                    return;
                }
                
                attempts++;
                console.log(`🔄 Reauthentication attempt ${attempts}/${maxAttempts}`);
                
                try {
                    await authStore.checkAuthStatus();
                    const state = get(authStore);
                    
                    if (state.isAuthenticated && !state.needsReauth) {
                        console.log('✅ Reauthentication successful');
                        isReauthLoading = false;
                        reauthInProgress = false;
                        
                        // Refresh home data immediately after successful reauthentication
                        setTimeout(async () => {
                            await refreshHomeData();
                            invalidateAll();
                        }, 100);
                        return;
                    }
                    
                    // If still not authenticated or needs reauth, wait with exponential backoff
                    const delay = baseDelay * Math.pow(2, attempts - 1); // Exponential backoff: 1s, 2s, 4s
                    console.log(`⏳ Reauthentication failed, retrying in ${delay}ms`);
                    setTimeout(tryReauth, delay);
                } catch (error) {
                    console.error('❌ Reauthentication attempt failed:', error);
                    // If checkAuthStatus throws an error, also apply exponential backoff
                    const delay = baseDelay * Math.pow(2, attempts - 1);
                    setTimeout(tryReauth, delay);
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

    {#if isReauthLoading}
        <div class="flex items-center justify-center min-h-[60vh]">
            <div class="flex flex-col items-center gap-4">
                <div class="loading loading-spinner loading-lg"></div>
                <p class="text-lg opacity-70">Loading home screen...</p>
            </div>
        </div>
    {:else}
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
                    <LibraryLeftoversView data={playNext.data} onDataRefresh={refreshNextEpisodes}></LibraryLeftoversView>
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
                    {:else}
                        <section class="mb-8">
                            <div class="flex items-center mb-4">
                                <a href={`/library?id=${category.Id}`} class="hover:underline">
                                    <h2 class="text-2xl">latest <b>{category.Name.toLowerCase()}</b></h2>
                                </a>
                            </div>
                            <div class="text-center text-gray-400 py-8">Nothing here yet</div>
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
    {/if}
</main>