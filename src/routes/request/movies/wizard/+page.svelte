<!--
@component
MovieRequestWizard – Component for requesting movies

Props:
- intent: 'create' – Intent of the wizard (movies typically only have create)
- id: string – Movie ID
- movieData: object – Movie details from search
-->

<script lang="ts">
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
    import { BASE_API_PATH } from '$lib/config/api';
    import { getCookie } from '$lib/utils/cookieUtils';
    import { getDeviceProfileHeader } from '$lib/utils/deviceUtils';
    import { toastStore } from '$lib/stores/toastStore';
    import ImageComponent from '$lib/components/ImageComponent.svelte';
    import StopState from '$lib/components/StopState.svelte';

    export let data;
    
    $: ({ intent, id, movieData: initialMovieData } = data);

    let isLoading = false;

    // --- Awaitable movieData ---
    let movieDataPromise: Promise<any>;
    $: movieDataPromise = (async () => {
        if (!initialMovieData) {
            throw new Error('Movie data not found. The requested movie could not be found in the search results.');
        }
        return initialMovieData;
    })();

    // Reactive title based on promise state
    let pageTitle = 'Loading...';
    $: if (intent === 'create') {
        movieDataPromise.then(movieData => {
            const title = movieData?.title || movieData?.name || movieData?.Name || 'Unknown';
            const year = movieData?.year || movieData?.ProductionYear;
            pageTitle = `Request Movie: ${title}${year ? ` (${year})` : ''} - moNobar`;
        }).catch(() => {
            pageTitle = 'Request Movie - moNobar';
        });
    }

    // Movie Request API function
    async function requestMovie(requestData: {
        title: string;
        id: string;
    }) {
        try {
            const deviceHeader = await getDeviceProfileHeader();
            const jellyUserId = getCookie('jellyUserId');
            const jellyAccessToken = getCookie('jellyAccessToken');
            
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'User-Agent': 'dp-Monobar',
                'Device-Profile': deviceHeader,
            };
            
            if (jellyUserId && jellyAccessToken) {
                headers['Authorization'] = `monobar_user=${jellyUserId},monobar_token=${jellyAccessToken}`;
            }

            const response = await fetch(`${BASE_API_PATH}/request/movies`, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Failed to request movie:', error);
            throw error;
        }
    }

    function getImageSrc(item: any): string | null {
        if (item.posterPath) return item.posterPath;
        if (item.thumbPath) return item.thumbPath;
        if (Array.isArray(item.images) && item.images.length > 0) {
            const poster = item.images.find((img: any) => img.coverType === 'poster');
            if (poster) return poster.dwsUrl || poster.remoteUrl || poster.url || null;
        }
        return null;
    }

    async function handleSubmit() {
        isLoading = true;
        try {
            const movieData = await movieDataPromise;
            // For create intent, only send the title and ID - similar to shows wizard
            const requestData = {
                title: movieData.title || movieData.name || movieData.Name,
                id
            };
            
            await requestMovie(requestData);
            toastStore.add({
                type: 'success',
                title: 'Movie Requested',
                message: `Successfully requested ${requestData.title}.`
            });
            
            if (browser) {
                setTimeout(() => goto('/request/movies'), 1500);
            }
        } catch (error) {
            console.error('Request failed:', error);
            toastStore.add({
                type: 'error',
                title: 'Request Failed',
                message: error instanceof Error ? error.message : 'An unexpected error occurred.'
            });
        } finally {
            isLoading = false;
        }
    }

    function handleCancel() {
        if (browser) {
            window.history.back();
        }
    }
</script>

<svelte:head>
    <title>{pageTitle}</title>
</svelte:head>

<main class="min-h-screen max-w-4xl mx-auto p-8 pt-24">
    <!-- Header -->
    <div class="mb-8">
        {#await movieDataPromise}
            <div class="animate-pulse">
                <div class="h-10 bg-base-200 rounded w-96 mb-2"></div>
                <div class="h-6 bg-base-200 rounded w-64"></div>
            </div>
        {:then movieData}
            <h1 class="text-4xl font-light mb-2">
                Request Movie
            </h1>
            <p class="text-lg opacity-70">
                Request this movie to be added to your library
            </p>
        {:catch error}
            <StopState 
                message={error?.message || 'Failed to load movie data'} 
                actionText="Go Back"
                action="back"
                actionDesc="The requested movie could not be found. Please try searching for the movie again or check the movie ID."
            />
        {/await}
    </div>

    {#await movieDataPromise}
        <div class="flex flex-col items-center justify-center py-24">
            <span class="loading loading-spinner loading-lg mb-4"></span>
            <p class="text-lg opacity-70">Loading movie data...</p>
        </div>
    {:then movieData}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Movie Info -->
            <div class="lg:col-span-1">
                <div class="card bg-base-200 shadow-xl">
                    <figure class="p-4">
                        {#if getImageSrc(movieData)}
                            <ImageComponent 
                                src={getImageSrc(movieData)}
                                alt={movieData.title || movieData.name || movieData.Name || 'Movie Poster'}
                                aspectRatio="2/3"
                                fallbackName={movieData.title || movieData.name || movieData.Name || 'Unknown'}
                                containerClass="rounded-lg max-w-48"
                            />
                        {:else}
                            <div class="w-48 h-72 bg-gray-300 rounded-lg flex items-center justify-center text-gray-500">
                                No Image
                            </div>
                        {/if}
                    </figure>
                </div>
            </div>

            <!-- Movie Details & Request -->
            <div class="lg:col-span-2">
                <div class="card bg-base-200 shadow-xl">
                    <div class="card-body">
                        <div class="mb-6">
                            <h2 class="card-title text-3xl mb-2">
                                {movieData.title || movieData.name || movieData.Name}
                                {#if movieData.year || movieData.ProductionYear}
                                    <span class="text-lg opacity-60">({movieData.year || movieData.ProductionYear})</span>
                                {/if}
                            </h2>
                            
                            {#if movieData.overview || movieData.Overview}
                                <p class="text-base opacity-80 leading-relaxed mb-4">{movieData.overview || movieData.Overview}</p>
                            {/if}
                            
                            <div class="flex flex-wrap gap-2 mb-4">
                                {#if movieData.genres && movieData.genres.length > 0}
                                    {#each movieData.genres as genre}
                                        <span class="badge badge-outline">{genre}</span>
                                    {/each}
                                {/if}
                            </div>
                            
                            <div class="text-sm opacity-60 space-y-1">
                                {#if movieData.runtime}
                                    <div>Runtime: {movieData.runtime} minutes</div>
                                {/if}
                                {#if movieData.releaseDate}
                                    <div>Release Date: {new Date(movieData.releaseDate).toLocaleDateString()}</div>
                                {/if}
                                {#if movieData.tmdbId}
                                    <div>TMDB ID: {movieData.tmdbId}</div>
                                {/if}
                                {#if movieData.imdbId}
                                    <div>IMDB ID: {movieData.imdbId}</div>
                                {/if}
                            </div>
                        </div>
                        
                        <!-- Request Confirmation -->
                        <div class="text-center py-8 border-t border-base-300">
                            <div class="mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 mx-auto text-primary mb-4">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 class="text-2xl font-semibold mb-2">Ready to Request</h3>
                            <p class="text-lg opacity-70 mb-4">This movie will be added to your request queue.</p>
                            <p class="text-sm opacity-60">You'll be notified when it becomes available.</p>
                        </div>
                        
                        <!-- Action Buttons -->
                        <div class="card-actions justify-end mt-8 pt-4 border-t border-base-300">
                            <button 
                                class="btn btn-ghost"
                                on:click={handleCancel}
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button 
                                class="btn btn-primary"
                                on:click={handleSubmit}
                                disabled={isLoading}
                            >
                                {#if isLoading}
                                    <span class="loading loading-spinner loading-sm"></span>
                                    Requesting...
                                {:else}
                                    Request Movie
                                {/if}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {:catch error}
        <StopState 
            message="Movie Not Found" 
            actionText="Go Back"
            action="back"
            actionDesc="The requested movie could not be found in the search results. Please try searching for the movie again or verify the movie ID."
        />
    {/await}
</main>
