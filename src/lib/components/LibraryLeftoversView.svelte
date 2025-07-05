<!--
@component
Library Leftovers View Display Component for rendering collections of media items in various view modes

Props:
- data: Array of LibraryItem objects to display (defaults to [])
-->

<script lang="ts">    
    import ImageComponent from './ImageComponent.svelte';

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
        };
        ImageTags?: {
            Thumb: string | null | undefined;
            Primary?: string;
            Logo?: string;
        };
    }

    export let data: LibraryItem[] = [];

    const itemHoverClass = "transition-transform duration-200 ease-in-out hover:-translate-y-1 p-1";

    function getWatchProgress(item: LibraryItem) {
        if (item.UserData?.Played) return 1;
        if (typeof item.UserData?.PlaybackPositionTicks === 'number' && item.RunTimeTicks) {
            return Math.min(1, item.UserData.PlaybackPositionTicks / item.RunTimeTicks);
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
</script>

{#if !data?.length}
    <section>
        <h1>No data available.</h1>
    </section>
{:else}
        <section class="flex overflow-x-auto gap-0 pb-4 scrollbar-hide">        
        {#each data as item}
            {@const itemId = item.Id || item.id || item.Name || ''}              
            <a
                href={`/watch?id=${item.Id}&type=${item.Type}&seriesId=${item.SeriesId}`}
                class={`flex flex-col items-center min-w-[280px] max-w-[280px] ${itemHoverClass} flex-shrink-0`}
                title={item.Overview}
                data-item-id={itemId}
            >
                <div class="relative w-full aspect-[16/9]">                    
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
                        <div class="absolute bottom-0 left-0 right-0 bg-black/40  backdrop-blur-3xl text-sm px-2 py-2">
                            <p class="text-lg text-white" >{formatEpisodeTitle(item)}</p>
                        </div>
                        
                        <!-- Progress bar -->
                        {#if hasWatchProgress(item)}
                            <div class="absolute bottom-0 left-0 right-0 bg-black/20 h-1">
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
            </a>
        {/each}
    </section>
{/if}
