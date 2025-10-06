<!--
@component
Library Leftovers View Display Component for rendering collections of media items in various view modes

Props:
- data: Array of LibraryItem objects to display (defaults to [])
-->

<script lang="ts">    
    import ImageComponent from './ImageComponent.svelte';
    import { page } from '$app/stores';
    import { get } from 'svelte/store';
    import { browser } from '$app/environment';
    import { BASE_API_PATH } from '$lib/config/api';
    import { getSessionHeaders } from '$lib/utils/authUtils';
    import { getBaseEnvironment } from '$lib/utils/environment';

    interface LibraryItem {
        [x: string]: any;
        Id?: string;
        id?: string;
        Name: string;
        OriginalTitle?: string;
        ProductionYear?: number;
        year?: number;
        Type?: string;
        Overview?: string;
        overview?: string;
        title?: string;
        thumbPath?: string;
        posterPath?: string;
        SeriesName?: string;
        IndexNumber?: number;
        ParentIndexNumber?: number;
        RunTimeTicks?: number;
        UserData?: {
            PlaybackPositionTicks?: number;
            Played?: boolean;
            PlayedPercentage?: number;
        };
        ImageTags?: {
            Thumb: string | null | undefined;
            Primary?: string;
            Logo?: string;
        };
    }

    export let data: LibraryItem[] = [];
    export let onDataRefresh: (() => void) | undefined = undefined;

    const itemHoverClass = "transition-transform duration-200 ease-in-out hover:-translate-y-1 p-1";

    function getWatchProgress(item: LibraryItem) {
        // if (item.UserData?.Played) return 1;
        if (typeof item.UserData?.PlayedPercentage === 'number') {
            return Math.min(1, item.UserData.PlayedPercentage / 100);
        }
        return 0;
    }

    function hasWatchProgress(item: LibraryItem) {
        return getWatchProgress(item) > 0 && getWatchProgress(item) < 1;
    }

    function formatEpisodeTitle(item: LibraryItem) {
        if (item.SeriesName && item.ParentIndexNumber && item.IndexNumber) {
            return `${item.SeriesName} S${String(item.ParentIndexNumber).padStart(2, '0')}E${String(item.IndexNumber).padStart(2, '0')}`;
        }
        return item.Name;
    }

    let marking: Record<string, boolean> = {};
    let markError: Record<string, string | undefined> = {};

    async function handleMarkPlayed(item: LibraryItem) {
        const id = item.Id || item.id;
        if (!id) return;
        marking = { ...marking, [id]: true };
        markError = { ...markError, [id]: undefined };
        try {
            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'dp-Monobar',
                'X-Environment': getBaseEnvironment(window.location),
                ...getSessionHeaders()
            };

            const response = await fetch(`${BASE_API_PATH}/markPlayed?id=${encodeURIComponent(id)}`, {
                method: 'POST',
                headers
            });
            
            if (response.status === 200) {
                if (onDataRefresh) {
                    onDataRefresh();
                }
            } else {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                markError = { ...markError, [id]: errorData.message || 'Failed to mark as watched' };
            }
        } catch (error) {
            console.error('❌ Failed to mark as played:', error);
            markError = { ...markError, [id]: error instanceof Error ? error.message : 'Unknown error' };
        } finally {
            marking = { ...marking, [id]: false };
        }
    }
</script>

{#if data?.length}
<section class="flex overflow-x-auto gap-0 pb-4 scrollbar-hide">        
    {#each data as item}
        {@const itemId = item.Id || item.id || item.Name || ''}              
        <div
            class={`flex flex-col items-center min-w-[280px] max-w-[280px] ${itemHoverClass} flex-shrink-0 cursor-pointer`}
            title={item.Overview}
            data-item-id={itemId}
            tabindex="0"
            role="button"
            on:click={() => {
                window.location.href = `/watch?id=${item.Id}&type=${item.Type}&seriesId=${item.SeriesId}`;
            }}
            on:keydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    window.location.href = `/watch?id=${item.Id}&type=${item.Type}&seriesId=${item.SeriesId}`;
                }
            }}
        >
            <div class="relative w-full aspect-[16/9]">
                <!-- Mark as Watched Icon -->
                <button
                    type="button"
                    class="absolute top-2 right-2 z-20 bg-white/80 rounded-full p-1 transition hover:bg-green-200 group"
                    aria-label="Mark as Watched"
                    on:click|stopPropagation={() => handleMarkPlayed(item)}
                    disabled={marking[item.Id || item.id || '']}
                    style="--icon-color: black; --icon-hover-color: #16a34a;"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="var(--icon-color)" class="w-6 h-6 transition-colors duration-200 group-hover:stroke-[var(--icon-hover-color)]">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </button>
                {#if markError[item.Id || item.id || '']}
                    <div class="absolute top-10 right-2 bg-red-500 text-white text-xs rounded px-2 py-1 z-30">
                        {markError[item.Id || item.id || '']}
                    </div>
                {/if}
                {#if (item.ImageTags?.Primary || item.ImageTags?.Thumb)}                        
                    <ImageComponent 
                        src={item.ImageTags?.Primary || item.ImageTags?.Thumb}
                        alt={item.Name || 'Image'}
                        aspectRatio="16/9"
                        borderRadius="rounded-none"
                        fallbackName={item.OriginalTitle || item.Name || 'Unknown'}
                    />
                    
                    <!-- Logo overlay in top-left corner -->
                    {#if item.ImageTags?.Logo}
                        <div class="absolute bottom-12 left-2 max-w-[40%] max-h-[40%] z-10">
                            <img 
                                src={item.ImageTags.Logo} 
                                alt={`${item.SeriesName || item.Name} logo`} 
                                class="w-auto h-auto max-w-full max-h-full object-contain drop-shadow-lg"
                            />
                        </div>
                    {/if}
                    
                    <!-- Episode title overlay -->
                    <div class="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-3xl text-sm px-2 py-2">
                        <p class="text-lg font-light text-white line-clamp-1 max-w-full w-full"
                           style="font-size:clamp(0.85rem,1.2vw,1.25rem);"
                           >
                            <span class="block w-full" style="display:inline-block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                                {formatEpisodeTitle(item)}
                            </span>
                        </p>
                    </div>
                    
                    <!-- Progress bar -->
                    {#if hasWatchProgress(item)}
                        <div class="absolute bottom-0 left-0 right-0 bg-black/20 h-1 z-10">
                            <div
                                class="h-full bg-green-500 transition-all duration-300"
                                style="width: {getWatchProgress(item) * 100}%;"
                            ></div>
                        </div>
                    {/if}
                {:else}
                    <div class="flex flex-col items-center justify-center w-full h-full bg-base-200 rounded-lg text-xs text-base-content p-2 text-center">
                        {#if item.ImageTags?.Logo}
                            <img src={item.ImageTags.Logo} alt={item.Name} class="w-fit max-h-16 object-contain mb-2" />
                        {:else}
                            <div class="font-bold text-2xl my-2">{item.OriginalTitle || item.Name}</div>
                        {/if}
                        {#if item.ProductionYear}
                            <div>{item.ProductionYear}</div>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
    {/each}
</section>
{/if}
