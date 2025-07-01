<script lang="ts">
    import { onMount, afterUpdate } from 'svelte';
    import { goto } from '$app/navigation';
    import { tick } from 'svelte';
    import { writable } from 'svelte/store';
    import { createEventDispatcher } from 'svelte';
    import ImageComponent from './ImageComponent.svelte';

    export let seriesData: any = null;
    export let currentEpisodeId: string | null = null;
    export let mode: string = 'info';

    const isWatchMode = mode === "watch";

    let selectedSeasonIdx: number | null = null;
    let selectedEpisodeIdx: number | null = null;
    let allowAutoScroll = true;
    let nextEpisodeIdx: number | null = null;
    let latestUnplayedEpisodeIdx: number | null = null;
    let currentEpisodeRef: HTMLLIElement | null = null;
    let nextEpisodeRef: HTMLLIElement | null = null;
    let latestEpisodeRef: HTMLLIElement | null = null;
    const dispatch = createEventDispatcher();

    $: availableSeasons = Array.isArray(seriesData?.availableSeasons) ? seriesData.availableSeasons : Array.isArray(seriesData) ? seriesData : [];
    $: hasSeasons = availableSeasons.length > 0;
    $: selectedSeason = selectedSeasonIdx !== null ? availableSeasons[selectedSeasonIdx] : availableSeasons[0];
    $: episodes = selectedSeason?.episodes || [];
    $: selectedEpisode = selectedEpisodeIdx !== null ? episodes[selectedEpisodeIdx] : null;

    function handleSeasonChange(idx: number) {
        selectedSeasonIdx = idx;
        selectedEpisodeIdx = null;
        nextEpisodeIdx = null;
        latestUnplayedEpisodeIdx = null;
    }

    function formatRuntime(ticks: number) {
        if (!ticks) return '';
        const totalSeconds = Math.floor(ticks / 10000000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    function formatRuntimeDetailed(ticks: number) {
        if (!ticks) return '';
        const totalSeconds = Math.floor(ticks / 10000000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return hours > 0
            ? `${hours}h ${minutes}m ${seconds}s`
            : `${minutes}m ${seconds}s`;
    }

    function formatDate(dateString: string) {
        if (!dateString) return '';
        const d = new Date(dateString);
        return d.toLocaleDateString();
    }

    function getWatchProgress(episode: any) {
        // Returns a value between 0 and 1
        if (episode.UserData?.Played) return 1;
        if (typeof episode.UserData?.PlaybackPositionTicks === 'number' && episode.RuntimeTicks) {
            return Math.min(1, episode.UserData.PlaybackPositionTicks / episode.RuntimeTicks);
        }
        return 0;
    }

    function hasWatchProgress(episode: any) {
        return getWatchProgress(episode) > 0 && getWatchProgress(episode) < 1;
    }

    // Find next episode (by currentEpisodeId)
    function findNextEpisode(currentId: string | null) {
        if (!currentId) return null;
        for (let i = 0; i < episodes.length - 1; i++) {
            if (episodes[i].Id === currentId) {
                return i + 1;
            }
        }
        return null;
    }

    // Find latest unplayed episode (stub, adapt as needed)
    function findLatestUnplayedEpisode() {
        // This logic should be replaced with real watched/progress data
        for (let i = 0; i < episodes.length; i++) {
            if (!isEpisodeWatched(episodes[i])) {
                return i;
            }
        }
        return null;
    }

    function isEpisodeWatched(episode: any) {
        // Replace with real logic if available
        return episode.UserData?.Played || false;
    }

    $: if (mode === 'watch' && currentEpisodeId) {
        nextEpisodeIdx = findNextEpisode(currentEpisodeId);
    }
    $: latestUnplayedEpisodeIdx = findLatestUnplayedEpisode();

    // Auto-scroll logic (stub, Svelte doesn't have refs like React)
    afterUpdate(async () => {
        if (!allowAutoScroll) return;
        await tick();
        if (mode === 'watch' && currentEpisodeRef) {
            currentEpisodeRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (latestUnplayedEpisodeIdx !== null && latestEpisodeRef) {
            latestEpisodeRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });

    function handleScrollToUnwatched() {
        allowAutoScroll = true;
    }

    // Svelte action to set refs for scrolling
    function setEpisodeRef(node: HTMLElement, { idx, isCurrent, isNext, isLatest }: { idx: number, isCurrent: boolean, isNext: boolean, isLatest: boolean }) {
        if (isCurrent) currentEpisodeRef = node as HTMLLIElement;
        if (isNext) nextEpisodeRef = node as HTMLLIElement;
        if (isLatest) latestEpisodeRef = node as HTMLLIElement;
        return {
            update(params: { idx: number, isCurrent: boolean, isNext: boolean, isLatest: boolean }) {
                if (params.isCurrent) currentEpisodeRef = node as HTMLLIElement;
                if (params.isNext) nextEpisodeRef = node as HTMLLIElement;
                if (params.isLatest) latestEpisodeRef = node as HTMLLIElement;
            },
            destroy() {
                if (currentEpisodeRef === node) currentEpisodeRef = null;
                if (nextEpisodeRef === node) nextEpisodeRef = null;
                if (latestEpisodeRef === node) latestEpisodeRef = null;
            }
        };
    }
</script>

{#if hasSeasons}
    <main class={`flex ${isWatchMode ? 'flex-col h-full' : 'flex-col'}`}>
        <div class="p-4">
            <!-- mobile: Horizontal scroll, Desktop: Flex wrap  -->
            <div class="md:hidden">
                <div class="flex gap-6 overflow-x-auto pb-2">
                    {#each availableSeasons as season, idx (season.Id)}
                        <button
                            type="button"
                            class="cursor-pointer whitespace-nowrap flex-shrink-0 px-2 py-3 transition-all duration-200 border-b-2 {selectedSeason?.Id === season.Id ? 'border-primary text-primary font-medium' : 'border-transparent text-base-content/70 hover:text-base-content hover:border-base-content/30'}"
                            on:click={() => handleSeasonChange(idx)}
                            aria-pressed={selectedSeason?.Id === season.Id}
                        >
                            Season {season.IndexNumber || season.Name}
                        </button>
                    {/each}
                </div>
            </div>
            
            <!-- Desktop: Traditional flex wrap -->
            <div class="hidden md:flex gap-6 flex-wrap">
                {#each availableSeasons as season, idx (season.Id)}
                    <button
                        type="button"
                        class="cursor-pointer px-2 py-3 transition-all duration-200 border-b-2 {selectedSeason?.Id === season.Id ? 'border-primary text-primary font-medium' : 'border-transparent text-base-content/70 hover:text-base-content hover:border-base-content/30'}"
                        on:click={() => handleSeasonChange(idx)}
                        aria-pressed={selectedSeason?.Id === season.Id}
                    >
                        Season {season.IndexNumber || season.Name}
                    </button>
                {/each}
            </div>
        </div>
        <div class="flex-1 {isWatchMode ? 'md:overflow-y-auto' : 'overflow-y-auto'}">
        {#if selectedSeason && selectedSeason.episodes.length > 0}
            <div class="px-3 py-4 md:p-4">
                <!-- Display total episodes inside the selected season -->
                <div class="flex items-center justify-between mb-4">
                    <h4 class={`font-semibold text-base md:text-lg`}>
                        Episodes ({selectedSeason.episodes.length})
                    </h4>
                </div>

                <!-- Display the episodes in the selected season -->
                <div class={`${mode === 'info' ? 'flex flex-col gap-3 h-96 overflow-y-auto md:flex-row md:gap-4 md:overflow-x-auto md:overflow-y-visible md:h-auto md:pb-4' : 'space-y-3 md:space-y-4'}`}>
                    {#each selectedSeason.episodes as episode, idx (episode.Id)}
                        <a
                            href={`/watch?id=${episode.Id}&type=Episode&seriesId=${selectedSeason.SeriesId}`}
                            class={`cursor-pointer transition-all duration-200 touch-manipulation active:scale-[0.98] ${mode === 'info' ? 'flex-shrink-0 w-full md:w-64' : ''} ${mode === 'info' ? '' : currentEpisodeId === episode.Id ? 'bg-primary/10 border-primary shadow-lg' : selectedEpisode?.Id === episode.Id ? 'shadow-md' : 'hover:shadow-md'} ${mode !== 'info' ? '' : currentEpisodeId === episode.Id ? 'md:ring-2 md:ring-primary' : 'hover:opacity-80'}`}
                            aria-label={`Episode ${episode.IndexNumber}`}
                        >
                            <!-- Mobile layout -->
                            <div class={`${mode === 'info' ? 'md:hidden' : 'md:hidden'}`}>
                                <div class="p-3">
                                    <div class="flex flex-col h-full">
                                        <!-- Episode thumbnail -->
                                        <div class="w-full h-32 bg-base-300 rounded-lg overflow-hidden relative mb-3">
                                            {#if episode.ImageTags?.Primary}
                                                <ImageComponent
                                                    src={episode.ImageTags.Primary}
                                                    alt={`Episode ${episode.IndexNumber}`}
                                                    class="w-full h-full object-cover"
                                                    showSkeleton={true}
                                                    aspectRatio="16/9"
                                                    borderRadius="rounded"
                                                />
                                                {#if isEpisodeWatched(episode)}
                                                    <div class="absolute top-2 right-2 bg-green-600 text-white rounded-full p-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width={3} stroke="currentColor" class="w-3 h-3">
                                                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                        </svg>
                                                    </div>
                                                {/if}
                                                {#if episode.RunTimeTicks}
                                                    <div class="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                                                        {formatRuntimeDetailed(episode.RunTimeTicks)}
                                                    </div>
                                                {/if}
                                                {#if hasWatchProgress(episode)}
                                                    <div class="absolute bottom-0 left-0 right-0 bg-black/20 h-1">
                                                        <div
                                                            class="h-full bg-accent transition-all duration-300"
                                                            style="width: {getWatchProgress(episode)}%;"
                                                        ></div>
                                                    </div>
                                                {/if} <!-- closes hasWatchProgress(episode) -->
                                            {/if} <!-- closes episode.ImageTags?.Primary -->
                                        </div>

                                        <!-- Episode title -->
                                        <h5 class="font-semibold text-sm mb-2 line-clamp-2 leading-tight">
                                            S{String(selectedSeason.IndexNumber || 1).padStart(2, '0')}E{String(episode.IndexNumber || index + 1).padStart(2, '0')}: {episode.Name}
                                        </h5>

                                        <!-- Episode subdata -->
                                        <div class="flex items-center gap-3 mb-2 text-xs">
                                            {#if episode.PremiereDate}
                                                <span>{formatDate(episode.PremiereDate)}</span>
                                            {/if}
                                            {#if episode.CommunityRating}
                                                <div class="flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-3 h-3 text-yellow-500">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                                    </svg>
                                                    {episode.CommunityRating.toFixed(1)}
                                                </div>
                                            {/if}
                                        </div>

                                        <!-- Episode description -->
                                        {#if episode.Overview}
                                            <p class="text-xs  line-clamp-3 leading-relaxed flex-1">
                                                {episode.Overview}
                                            </p>
                                        {/if}

                                        <!-- Currently Playing / Up Next indicators  -->
                                        {#if currentEpisodeId === episode.Id}
                                            <div class="mt-2 flex items-center gap-2">
                                                <div class="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                                <span class="text-primary font-medium text-xs">
                                                    Currently Playing
                                                </span>
                                            </div>
                                        {/if}
                                        
                                        {#if nextEpisodeIdx?.Id === episode.Id && isWatchMode}
                                            <div class="mt-2 flex items-center gap-2">
                                                <div class="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                                                <span class="text-secondary font-medium text-xs">Up Next</span>
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </div>

                            <!-- Desktop layout -->
                            {#if mode === 'info'}
                                <div class="hidden md:block p-3">
                                    <div class="flex flex-col h-full">
                                        <!-- Episode thumbnail  -->
                                        <div class="w-full h-32 bg-base-300 rounded-lg overflow-hidden relative mb-3">
                                            {#if episode.ImageTags?.Primary}
                                                <ImageComponent
                                                    src={episode.ImageTags.Primary}
                                                    alt={`Episode ${episode.IndexNumber}`}
                                                    class="w-full h-full object-cover"
                                                    showSkeleton={true}
                                                    aspectRatio="16/9"
                                                    borderRadius="rounded"
                                                />
                                                {#if isEpisodeWatched(episode)}
                                                    <div class="absolute top-2 right-2 bg-green-600 text-white rounded-full p-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width={3} stroke="currentColor" class="w-3 h-3">
                                                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                        </svg>
                                                    </div>
                                                {/if}
                                                {#if episode.RunTimeTicks}
                                                    <div class="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                                                        {formatRuntimeDetailed(episode.RunTimeTicks)}
                                                    </div>
                                                {/if}
                                                {#if hasWatchProgress(episode)}
                                                    <div class="absolute bottom-0 left-0 right-0 bg-black/20 h-1">
                                                        <div 
                                                            class="h-full bg-accent transition-all duration-300"
                                                            style={{ width: `${getWatchProgress(episode)}%` }}
                                                        ></div>
                                                    </div>
                                                {/if}
                                            {:else}
                                                <div class="w-full h-full flex items-center justify-center bg-base-300">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width={1.5} stroke="currentColor" class="w-6 h-6 opacity-50">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                                    </svg>
                                                </div>
                                            {/if}
                                        </div>

                                        <!-- Episode Name -->
                                        <h5 class="font-semibold text-sm mb-2 line-clamp-2 leading-tight">
                                            S{String(selectedSeason.IndexNumber || 1).padStart(2, '0')}E{String(episode.IndexNumber || index + 1).padStart(2, '0')}: {episode.Name}
                                        </h5>
                                        
                                        <!-- Episode sub-data -->
                                        <div class="flex items-center gap-3 mb-2 text-xs">
                                            {#if episode.PremiereDate}
                                                <span>{formatDate(episode.PremiereDate)}</span>
                                            {/if}
                                            {#if episode.CommunityRating}
                                                <div class="flex items-center gap-1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-3 h-3 text-yellow-500">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                                    </svg>
                                                    {episode.CommunityRating.toFixed(1)}
                                                </div>
                                            {/if}
                                        </div>
                                        
                                        <!-- Overview  -->
                                        {#if episode.Overview}
                                            <p class="text-xs  line-clamp-3 leading-relaxed flex-1">
                                                {episode.Overview}
                                            </p>
                                        {/if}
                                        
                                        <!-- Currently Playing / Up Next indicators -->
                                        {#if currentEpisodeId === episode.Id}
                                            <div class="mt-2 flex items-center gap-2">
                                                <div class="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                                <span class="text-primary font-medium text-xs">
                                                    Currently Playing
                                                </span>
                                            </div>
                                        {/if}
                                        
                                        {#if nextEpisodeIdx?.Id === episode.Id && isWatchMode}
                                            <div class="mt-2 flex items-center gap-2">
                                                <div class="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                                                <span class="text-secondary font-medium text-xs">Up Next</span>
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            {/if}

                            <!-- Desktop Layout - For non-info modes -->
                            {#if mode !== 'info'}
                                <div class="hidden md:block p-2">
                                    <div class="flex items-start gap-3">                                            
                                        <!-- Episode Thumbnail - Desktop -->
                                        <div class="flex-shrink-0 bg-base-300 rounded overflow-hidden w-32 h-18 relative">
                                            {#if episode.ImageTags?.Primary}
                                                <ImageComponent
                                                    src={episode.ImageTags.Primary}
                                                    alt={`Episode ${episode.IndexNumber}`}
                                                    class="w-full h-full object-cover"
                                                    showSkeleton={true}
                                                    aspectRatio="16/9"
                                                    borderRadius="rounded"
                                                />
                                                <!-- Watched indicator overlay - Desktop -->
                                                {#if isEpisodeWatched(episode) }
                                                    <div class="absolute top-1 right-1 bg-green-600 text-white rounded-full p-0.5">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width={3} stroke="currentColor" class="w-2.5 h-2.5">
                                                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                        </svg>
                                                    </div>
                                                {/if}
                                                
                                                <!-- YouTube-style duration badge - Desktop -->
                                                {#if episode.RunTimeTicks && isWatchMode}
                                                    <div class="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-xs px-1 py-0.5 rounded text-[10px] leading-none">
                                                        {formatRuntimeDetailed(episode.RunTimeTicks)}
                                                    </div>
                                                {/if}
                                                
                                                <!-- Progress bar - Desktop -->
                                                {#if hasWatchProgress(episode) }
                                                    <div class="absolute bottom-0 left-0 right-0 bg-black/20 h-0.5">
                                                        <div 
                                                            class="h-full bg-accent transition-all duration-300"
                                                            style={{ width: `${getWatchProgress(episode)}%` }}
                                                        ></div>
                                                    </div>
                                                {/if}
                                            {:else}
                                                <div class="w-full h-full flex items-center justify-center bg-base-300">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width={1.5} stroke="currentColor" class="w-6 h-6 opacity-50">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                                                    </svg>
                                                </div>
                                            {/if}
                                        </div>

                                        <!-- Episode Info - Desktop -->
                                        <div class="flex-1 min-w-0">                                                
                                            <div class="flex items-center gap-2">
                                                <span class="font-medium text-primary text-sm">
                                                    {episode.IndexNumber + '.' || index + 1}
                                                </span>
                                                <h5 class="font-semibold truncate">
                                                    {episode.Name}
                                                </h5>
                                            </div>
                                            
                                            <div class="flex items-center  mb-2 text-xs gap-3">
                                                {#if episode.PremiereDate }
                                                    <span>{formatDate(episode.PremiereDate)}</span>
                                                {/if}
                                                {#if episode.CommunityRating }
                                                    <span class="flex items-center gap-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-3 h-3">
                                                            <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                                        </svg>
                                                        {episode.CommunityRating.toFixed(1)}
                                                    </span>
                                                {/if}
                                            </div>

                                            {#if episode.Overview && !isWatchMode }
                                                <p class="text-sm  line-clamp-2">
                                                    {episode.Overview}
                                                </p>
                                            {/if}
                                            
                                                <!-- Desktop Status indicators -->
                                            {#if currentEpisodeId === episode.Id }
                                                <div class="mt-2 flex items-center gap-2">
                                                    <div class="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                                    <span class="text-primary font-medium text-xs">
                                                        Currently Playing
                                                    </span>
                                                </div>
                                            {/if}

                                            {#if nextEpisodeIdx?.Id === episode.Id && isWatchMode }
                                                <div class="mt-2 flex items-center gap-2">
                                                    <span class="text-secondary font-medium text-xs">Up Next</span>
                                                </div>
                                            {/if}                                            
                                        </div>
                                    </div>
                                </div>                                    
                            {/if}
                                    
                        </a>
                    {/each}
                </div>
            </div>
        {:else}
            <div class="p-4 text-center ">
                <p>No episodes available for this season</p>
            </div>
        {/if}
    </div>
    </main>
{/if}