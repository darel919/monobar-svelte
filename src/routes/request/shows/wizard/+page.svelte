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
    
    $: ({ intent: initialIntent, id, seriesData: initialSeriesData, existingSeriesData } = data);
    
    // Determine the actual intent based on whether we have existing data
    $: intent = existingSeriesData ? 'update' : initialIntent;

    let selectedSeasons: number[] = [];
    let isLoading = false;
    let availableSeasons: any[] = [];

    // --- Awaitable seriesData ---
    let seriesDataPromise: Promise<any>;
    $: seriesDataPromise = (async () => initialSeriesData)();
    // Reactive title based on promise state
    let pageTitle = 'Loading...';
    $: if (intent === 'create') {
        pageTitle = 'Request TV Series - moNobar';
    } else {
        seriesDataPromise.then(seriesData => {
            pageTitle = `Update: ${seriesData.title || seriesData.name}${seriesData.year ? ` (${seriesData.year})` : ''} - moNobar`;
        }).catch(() => {
            pageTitle = 'Update TV Series - moNobar';
        });
    }

    // TV Series Request API functions moved from lib/config/api.ts
    async function requestTVSeries(requestData: {
        title: string;
        imdbId?: string;
        tmdbId?: number;
        selectedSeasons?: number[];
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

            const response = await fetch(`${BASE_API_PATH}/request/shows`, {
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
            console.error('Failed to request TV series:', error);
            throw error;
        }
    }

    async function requestTVSeasons(requestData: {
        seriesId: number;
        seasonNumbers: number[];
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

            const response = await fetch(`${BASE_API_PATH}/request/shows/seasons`, {
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
            console.error('Failed to request TV seasons:', error);
            throw error;
        }
    }

    function setupSeasons(seriesData: any) {
        // Filter out season 0 as it's not supported for requests
        availableSeasons = (seriesData.seasons || []).filter((season: any) => season.seasonNumber > 0);
        if (intent === 'create') {
            // For create intent, we don't use season selection as backend handles first season automatically
            selectedSeasons = [];
        } else if (intent === 'update' && existingSeriesData) {
            // For update mode, pre-select unmonitored seasons that exist in the series
            const monitoredSeasons = existingSeriesData.seasons?.filter((s: any) => s.monitored).map((s: any) => s.seasonNumber) || [];
            selectedSeasons = []; // Start with no selections for update mode
        }
    }

    function toggleSeason(seasonNumber: number) {
        // In update mode, don't allow toggling of monitored seasons
        if (intent === 'update' && existingSeriesData) {
            const existingSeason = existingSeriesData.seasons?.find((s: any) => s.seasonNumber === seasonNumber);
            if (existingSeason && existingSeason.monitored) {
                return; // Don't allow toggling monitored seasons
            }
        }
        
        if (selectedSeasons.includes(seasonNumber)) {
            selectedSeasons = selectedSeasons.filter(s => s !== seasonNumber);
        } else {
            selectedSeasons = [...selectedSeasons, seasonNumber];
        }
    }

    function isSeasonDisabled(seasonNumber: number): boolean {
        // In create mode, disable all seasons since backend handles first season automatically
        if (intent === 'create') {
            return true;
        }
        // In update mode, disable seasons that are already monitored
        if (intent === 'update' && existingSeriesData) {
            const existingSeason = existingSeriesData.seasons?.find((s: any) => s.seasonNumber === seasonNumber);
            return existingSeason && existingSeason.monitored;
        }
        return false;
    }

    function isSeasonMonitored(seasonNumber: number): boolean {
        // Check if a season is already being monitored
        if (intent === 'update' && existingSeriesData) {
            const existingSeason = existingSeriesData.seasons?.find((s: any) => s.seasonNumber === seasonNumber);
            return existingSeason && existingSeason.monitored;
        }
        return false;
    }

    function requestAllSeasons() {
        // Select all seasons that are not already monitored/disabled
        const availableSeasonNumbers = availableSeasons
            .filter(season => !isSeasonDisabled(season.seasonNumber))
            .map(season => season.seasonNumber);
        selectedSeasons = [...availableSeasonNumbers];
    }

    function getImageSrc(item: any): string | null {
        if (item.posterPath) return item.posterPath;
        if (item.thumbPath) return item.thumbPath;
        if (Array.isArray(item.images) && item.images.length > 0) {
            const poster = item.images.find((img: any) => img.coverType === 'poster');
            if (poster) return poster.dwsUrl || poster.remoteUrl || null;
        }
        return null;
    }

    async function handleSubmit() {
        // For create intent, skip season selection validation since we only send ID
        if (intent === 'update' && !selectedSeasons.length) {
            toastStore.add({
                type: 'warning',
                title: 'No seasons selected',
                message: 'Please select at least one season to request.'
            });
            return;
        }
        isLoading = true;
        try {
            const seriesData = await seriesDataPromise;
            if (intent === 'create') {
                // For create intent, only send the ID - backend automatically requests first season
                const requestData = {
                    title: seriesData.title || seriesData.name,
                    id
                };
                await requestTVSeries(requestData);
                toastStore.add({
                    type: 'success',
                    title: 'Series Requested',
                    message: `Successfully requested ${requestData.title}. The first season will be automatically monitored.`
                });
            } else if (intent === 'update') {
                const requestData = {
                    seriesId: parseInt(id || '0'),
                    seasonNumbers: selectedSeasons
                };
                await requestTVSeasons(requestData);
                toastStore.add({
                    type: 'success',
                    title: 'Seasons Updated',
                    message: `Successfully updated seasons for ${seriesData.title || seriesData.name}.`
                });
            }
            if (browser) {
                setTimeout(() => goto('/request/shows'), 1500);
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
    <div class="mb-8">
        {#await seriesDataPromise}
            <div class="animate-pulse">
                <div class="h-10 bg-base-200 rounded w-96 mb-2"></div>
                <div class="h-6 bg-base-200 rounded w-64"></div>
            </div>
        {:then seriesData}
            <h1 class="text-4xl font-light mb-2">
                {#if intent === 'create'}
                    Request TV Series
                {:else}
                    {seriesData.title || seriesData.name}{#if seriesData.year}<span class="ml-2"> ({seriesData.year})</span>{/if}
                {/if}
            </h1>
            <p class="text-lg opacity-70">
                {intent === 'create' ? 'Request series - the first season will be automatically monitored' : 'Update which seasons to monitor'}
            </p>
            {#if intent === 'update' && existingSeriesData}
                <div class="alert alert-info mt-4 lg:hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>This series is already in your library. Select additional seasons to monitor. Seasons already being monitored are shown but disabled.</span>
                </div>
            {/if}
        {:catch error}
            <StopState 
                message={error?.message || 'Failed to load series data'} 
                actionText="Go Back"
                action="back"
            />
        {/await}
    </div>

    {#await seriesDataPromise}
        <div class="flex flex-col items-center justify-center py-24">
            <span class="loading loading-spinner loading-lg mb-4"></span>
            <p class="text-lg opacity-70">Loading series data...</p>
        </div>
    {:then seriesData}
        {setupSeasons(seriesData)}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Series Info -->
            <div class="lg:col-span-1">
                <div class="card bg-base-200 shadow-xl">
                    <figure class="p-4">
                        {#if getImageSrc(seriesData)}
                            <ImageComponent 
                                src={getImageSrc(seriesData)}
                                alt={seriesData.title || seriesData.name || 'Series Poster'}
                                aspectRatio="2/3"
                                fallbackName={seriesData.title || seriesData.name || 'Unknown'}
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

            <!-- Season Selection -->
            <div class="lg:col-span-2">
                <div class="card bg-base-200 shadow-xl">
                    <div class="card-body">
                        {#if intent === 'create'}
                            <!-- For create intent, show informational message instead of season picker -->
                            <div class="text-center py-12">
                                <div class="mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-16 h-16 mx-auto text-primary mb-4">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 class="text-2xl font-semibold mb-2">Ready to Request</h3>
                                <p class="text-lg opacity-70 mb-4">The first season will be automatically requested and monitored.</p>
                                <p class="text-sm opacity-60">You can add additional seasons later from your library.</p>
                            </div>
                        {:else}
                            <!-- For update intent, show season picker -->
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="card-title text-2xl">Available Seasons</h3>
                                {#if availableSeasons.some(season => !isSeasonDisabled(season.seasonNumber))}
                                    <button 
                                        class="btn btn-primary btn-sm"
                                        on:click={requestAllSeasons}
                                        disabled={isLoading}
                                    >
                                        Request All
                                    </button>
                                {/if}
                            </div>
                            {#if availableSeasons.length === 0}
                                <div class="text-center py-8">
                                    <p class="text-lg opacity-70">No season information available</p>
                                </div>
                            {:else}
                                <div class="space-y-3">
                                    {#each availableSeasons as season (season.seasonNumber)}
                                        {@const existingSeason = existingSeriesData?.seasons?.find((s: any) => s.seasonNumber === season.seasonNumber)}
                                        {@const isMonitored = isSeasonMonitored(season.seasonNumber)}
                                        {@const hasEpisodes = existingSeason?.statistics?.episodeFileCount > 0}
                                        {@const isDisabled = isSeasonDisabled(season.seasonNumber)}
                                        <label class={`cursor-pointer ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                            <div class={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${isDisabled ? 'border-base-200 bg-base-50' : 'border-base-300 hover:bg-base-100'}`}>
                                                <input 
                                                    type="checkbox" 
                                                    class="checkbox checkbox-primary" 
                                                    checked={isMonitored ? true : selectedSeasons.includes(season.seasonNumber)}
                                                    disabled={isDisabled}
                                                    on:change={() => toggleSeason(season.seasonNumber)}
                                                />
                                                <div class="flex-1">
                                                    <div class="flex items-center justify-between">
                                                        <div class="flex items-center gap-2">
                                                            <h4 class="font-semibold">
                                                                Season {season.seasonNumber}
                                                                {#if season.name && season.name !== `Season ${season.seasonNumber}`}
                                                                    - {season.name}
                                                                {/if}
                                                            </h4>
                                                            {#if isMonitored}
                                                                <span 
                                                                    class="badge badge-success badge-sm tooltip" 
                                                                    data-tip="This season is already in your library and being monitored. Cannot be toggled."
                                                                >
                                                                    Already Monitoring
                                                                </span>
                                                            {:else if existingSeason && !isMonitored}
                                                                <span class="badge badge-warning badge-sm">Not Monitored</span>
                                                            {:else if hasEpisodes}
                                                                <span class="badge badge-info badge-sm">Available</span>
                                                            {/if}
                                                        </div>
                                                        <div class="flex items-center gap-2">
                                                            {#if season.episodeCount}
                                                                <span class="badge badge-outline">
                                                                    {season.episodeCount} episode{season.episodeCount > 1 ? 's' : ''}
                                                                </span>
                                                            {/if}
                                                            {#if existingSeason?.statistics}
                                                                <span class="badge badge-outline text-xs">
                                                                    {existingSeason.statistics.episodeFileCount}/{existingSeason.statistics.episodeCount} downloaded
                                                                </span>
                                                            {/if}
                                                        </div>
                                                    </div>
                                                    {#if season.overview}
                                                        <p class="text-sm opacity-70 mt-1 line-clamp-2">{season.overview}</p>
                                                    {/if}
                                                    {#if season.airDate}
                                                        <p class="text-xs opacity-50 mt-1">Air Date: {season.airDate}</p>
                                                    {/if}
                                                </div>
                                            </div>
                                        </label>
                                    {/each}
                                </div>
                            {/if}
                        {/if}
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
                                disabled={isLoading || (intent === 'update' && selectedSeasons.length === 0)}
                            >
                                {#if isLoading}
                                    <span class="loading loading-spinner loading-sm"></span>
                                    {intent === 'create' ? 'Requesting...' : 'Updating...'}
                                {:else}
                                    {intent === 'create' ? 'Request Series' : `Request ${selectedSeasons.length} Season${selectedSeasons.length !== 1 ? 's' : ''}`}
                                {/if}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    {:catch error}
        <StopState 
            message={error?.message || 'Series data not found'} 
            actionText="Go Back"
            action="back"
        />
    {/await}
</main>

<style>
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    
    .line-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>
