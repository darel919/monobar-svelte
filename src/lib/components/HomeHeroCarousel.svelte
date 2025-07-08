<!--
@component
Home Hero Carousel Component - Full-width carousel for featured content

Props:
- leftoversData: Promise resolving to leftovers data
- recommendationsData: Promise resolving to recommendations data
-->

<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { browser } from '$app/environment';
    import { goto } from '$app/navigation';
    import YtPlayer from './TrailerPlayer.svelte';
    import ImageComponent from './ImageComponent.svelte';
    import { useSettingsStore } from '$lib/stores/settings';

    export let leftoversData: Promise<any>;
    export let recommendationsData: Promise<any>;
    export let nextUpData: Promise<any>;

    interface CarouselItem {
        Taglines: any;
        Id?: string;
        id?: string;
        Name: string;
        OriginalTitle?: string;
        Type?: string;
        Overview?: string;
        thumbPath?: string;
        posterPath?: string;
        CommunityRating?: number;
        ImageTags?: {
            Logo?: string;
            Backdrop?: string;
        };
        RemoteTrailers?: Array<{
            Name: string;
            Url: string;
        }>;
        category?: 'leftovers' | 'movies' | 'tv-series' | 'nextup';
        SeriesName?: string;
        IndexNumber?: number;
        ParentIndexNumber?: number;
        SeriesId?: string;
        watchId?: string;
        People?: {
            Actors?: {
                content: Array<{
                    image?: string;
                    Name: string;
                }>;
            };
        };
    }

    let carouselItems: CarouselItem[] = [];
    let currentIndex = 0;
    let fadeClass = 'opacity-100';
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let resumeTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let settingsStore: ReturnType<typeof useSettingsStore> | null = null;
    let isTransitioning = false;

    $: totalItems = carouselItems.length;
    $: currentItem = carouselItems[currentIndex] || null;
    $: showCarousel = settingsStore ? $settingsStore.showHomeHeroCarousel : true;

    async function loadCarouselData() {
        try {
            const [leftovers, recommendations, nextUp] = await Promise.all([
                leftoversData,
                recommendationsData,
                nextUpData
            ]);

            const items: CarouselItem[] = [];

            // Add leftovers with category marking
            if (leftovers?.data?.length > 0) {
                const leftoverItems = leftovers.data.map((item: any) => ({
                    ...item,
                    category: 'leftovers' as const
                }));
                items.push(...leftoverItems);
            }

            // Add next up with category marking
            if (nextUp?.data?.length > 0) {
                const nextUpItems = nextUp.data.map((item: any) => ({
                    ...item,
                    category: 'nextup' as const
                }));
                items.push(...nextUpItems);
            }

            // Add recommendations with category marking
            if (recommendations?.data?.length > 0) {
                const recItems = recommendations.data.map((item: any) => ({
                    ...item,
                    category: item.Type === 'Series' ? 'tv-series' as const : 'movies' as const
                }));
                items.push(...recItems);
            }

            carouselItems = items;
        } catch (error) {
            console.error('Error loading carousel data:', error);
            carouselItems = [];
        }
    }

    function startCarousel() {
        if (totalItems <= 1 || !browser) return;
        if (intervalId) return; // Prevent multiple intervals
        intervalId = setInterval(() => {
            nextSlide();
        }, 8000);
    }

    function stopCarousel() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    function resetResumeTimeout() {
        if (resumeTimeoutId) {
            clearTimeout(resumeTimeoutId);
            resumeTimeoutId = null;
        }
    }

    function scheduleResumeCarousel() {
        resetResumeTimeout();
        resumeTimeoutId = setTimeout(() => {
            startCarousel();
        }, 5000);
    }

    function nextSlide() {
        if (totalItems <= 1 || isTransitioning) return;
        isTransitioning = true;
        fadeClass = 'opacity-0';
        setTimeout(() => {
            currentIndex = (currentIndex + 1) % totalItems;
            fadeClass = 'opacity-100';
            isTransitioning = false;
        }, 200);
    }

    function goToSlide(index: number) {
        if (index === currentIndex || index >= totalItems || isTransitioning) return;
        stopCarousel();
        resetResumeTimeout();
        isTransitioning = true;
        fadeClass = 'opacity-0';
        setTimeout(() => {
            currentIndex = index;
            fadeClass = 'opacity-100';
            isTransitioning = false;
            scheduleResumeCarousel();
        }, 200);
    }

    function handleItemClick() {
        if (!currentItem) return;
        
        const itemId = currentItem.Id || currentItem.id;
        const itemType = currentItem.Type || '';
        const seriesId = currentItem.SeriesId;
        const watchId = currentItem.watchId || itemId;
        
        if (itemId) {
            if (currentItem.category === 'leftovers') {
                if (currentItem.Type === 'Series') {
                    const watchIdParam = watchId;
                    const seriesIdParam = seriesId || itemId;
                    goto(`/watch?id=${watchIdParam}&type=${itemType}&seriesId=${seriesIdParam}`);
                } else if (currentItem.Type === 'Episode') {
                    // Pass seriesId for episodes
                    if (seriesId) {
                        goto(`/watch?id=${itemId}&type=${itemType}&seriesId=${seriesId}`);
                    } else {
                        goto(`/watch?id=${itemId}&type=${itemType}`);
                    }
                } else {
                    goto(`/watch?id=${itemId}&type=${itemType}`);
                }
            } else {
                if (currentItem.Type === 'Series') {
                    goto(`/info?id=${itemId}&type=${itemType}`);
                } else if (currentItem.Type === 'Episode') {
                    // Pass seriesId for episodes
                    if (seriesId) {
                        goto(`/watch?id=${itemId}&type=${itemType}&seriesId=${seriesId}`);
                    } else {
                        goto(`/watch?id=${itemId}&type=${itemType}`);
                    }
                } else {
                    goto(`/info?id=${itemId}&type=${itemType}`);
                }
            }
        }
    }

    function getCategoryDisplay(category: string): string {
        switch (category) {
            case 'leftovers':
                return 'Continue Watching';
            case 'nextup':
                return 'Next Up';
            case 'tv-series':
                return 'TV Series';
            case 'movies':
                return 'Movies';
            default:
                return '';
        }
    }

    function getEpisodeInfo(item: CarouselItem): string {
        if (item.category === 'leftovers' && item.SeriesName) {
            const season = item.ParentIndexNumber || 1;
            const episode = item.IndexNumber || 1;
            return `${item.SeriesName} • S${season}E${episode}`;
        }
        if (item.category === 'nextup' && item.SeriesName) {
            const season = item.ParentIndexNumber || 1;
            const episode = item.IndexNumber || 1;
            const pad = (n: number) => n.toString().padStart(2, '0');
            return `${item.SeriesName} S${pad(season)}E${pad(episode)} is next to watch`;
        }
        return '';
    }

    onMount(() => {
        settingsStore = useSettingsStore();
        loadCarouselData().then(() => {
            if (carouselItems.length > 1) {
                startCarousel();
            }
        });
    });

    onDestroy(() => {
        stopCarousel();
        resetResumeTimeout();
    });
</script>

{#if showCarousel && carouselItems.length > 0 && currentItem}
    <section 
        class="relative w-full h-[70vh] min-h-[550px] overflow-hidden cursor-pointer group -mb-20"
        on:click={handleItemClick}
        on:keydown={(e) => e.key === 'Enter' && handleItemClick()}
        on:mouseenter={stopCarousel}
        on:mouseleave={startCarousel}
        role="button"
        tabindex="0"
    >
    {console.log('Current Item:', currentItem)}
        <!-- Background with YtPlayer -->
        <div class="absolute inset-0 transition-opacity duration-500 {fadeClass}">
            <YtPlayer 
                ytId=""
                trailerData={currentItem.RemoteTrailers || []}
                mute={true}
                enabled={true}
                loop={false}
                backdrop={currentItem.ImageTags?.Backdrop || currentItem.thumbPath || currentItem.posterPath || ''}
            />
        </div>
        
        <!-- Dark Overlay -->
        <div class="absolute inset-0 bg-black/40"></div>

        <!-- Gradient Overlay for smooth transition to content below -->
        <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-base-100"></div>

        <!-- Content -->
        <div class="relative z-10 h-full flex items-center">
            <div class="container mx-auto px-8">
                <div class="max-w-md">
                    <!-- Category Badge -->
                    {#if currentItem.category}
                        <div class="mb-4">
                            <span class="badge badge-ghost badge-lg rounded-none p-4 font-medium">
                                {getCategoryDisplay(currentItem.category)}
                            </span>
                        </div>
                    {/if}

                    <section class="flex flex-row gap-4 my-4 items-center">
                        <!-- Rating -->
                        {#if currentItem.CommunityRating}
                            <div class="flex items-center gap-2 mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-6 h-6 text-yellow-400">
                                    <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                </svg>
                                <span class="text-white text-lg font-medium">
                                    {currentItem.CommunityRating.toFixed(1)}
                                </span>
                            </div>
                        {/if}
                        {#if currentItem.CommunityRating && currentItem.People?.Actors?.content && currentItem.People.Actors.content.length > 0}
                            <span class="flex items-center justify-center h-6"><span class="bg-white/100 rounded-full w-2 h-2 block"></span></span>
                        {/if}
                        <!-- Actors -->
                        {#if currentItem.People?.Actors?.content && currentItem.People.Actors.content.length > 0}
                            <div class="flex items-center gap-3">
                                <span class="text-white/70 text-sm font-medium">Starring:</span>
                                <div class="flex items-center gap-3">
                                    {#each currentItem.People.Actors.content.slice(0, 3) as actor}
                                        <div class="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-full px-3 py-2 min-w-0 max-w-32 h-12 overflow-hidden">
                                            {#if actor.image}
                                                <section class="w-8 h-8 flex-shrink-0 overflow-hidden">
                                                    <ImageComponent 
                                                    src={actor.image} 
                                                    alt={actor.Name}
                                                    aspectRatio="1/1"
                                                    borderRadius="rounded-full"
                                                    imageClass="w-8 h-8 object-cover"
                                                    showSkeleton={true}
                                                    displayFallbackName={false}
                                                    fallbackName={actor.Name || 'Actor'}
                                                />
                                                </section>
                                            {/if}
                                            <span class="text-white text-xs font-medium truncate flex-1 min-w-0">{actor.Name}</span>
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </section>

                
                    <!-- Title -->
                    {#if currentItem.ImageTags?.Logo}
                        <div class="mb-6">
                            <img 
                                src={currentItem.ImageTags.Logo} 
                                alt={currentItem.Name}
                                class="h-24 w-auto max-w-full object-contain"
                            />
                        </div>
                    {:else}
                        <h1 class="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-2xl">
                            {currentItem.OriginalTitle || currentItem.Name}
                        </h1>
                    {/if}

                    <!-- Episode Info for Leftovers -->
                    {#if getEpisodeInfo(currentItem)}
                        <p class="text-white/90 text-lg mb-4 font-medium drop-shadow-lg">
                            {getEpisodeInfo(currentItem)}
                        </p>
                    {/if}

                   

                    <!-- Overview -->
                    {#if currentItem.Taglines && currentItem.Taglines[0]}
                        <p class="text-white/90 text-lg leading-relaxed line-clamp-2 drop-shadow-lg">
                            "<b>{currentItem.Taglines[0]}</b>"
                        </p>
                        {:else if currentItem.Overview}
                        <p class="text-white/90 text-md leading-relaxed line-clamp-2 drop-shadow-lg">
                            {currentItem.Overview}
                        </p>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Navigation Dots -->
        {#if totalItems > 1}
            <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
                {#each carouselItems as _, index}
                    <button
                        class="btn btn-xs btn-circle {index === currentIndex ? 'btn-primary' : 'btn-ghost bg-white/20 hover:bg-white/40'}"
                        on:click|stopPropagation={() => {
                            stopCarousel();
                            goToSlide(index);
                            startCarousel();
                        }}
                        aria-label="Go to slide {index + 1}"
                    ></button>
                {/each}
            </div>
        {/if}

        <!-- Arrow Navigation -->
        {#if totalItems > 1}
            <button
                class="absolute left-4 top-1/2 transform -translate-y-1/2 w-16 h-16 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white z-20 transition-all duration-200"
                on:click|stopPropagation={() => {
                    stopCarousel();
                    goToSlide((currentIndex - 1 + totalItems) % totalItems);
                    startCarousel();
                }}
                aria-label="Previous slide"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>
            
            <button
                class="absolute right-4 top-1/2 transform -translate-y-1/2 w-16 h-16 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/40 text-white z-20 transition-all duration-200"
                on:click|stopPropagation={() => {
                    stopCarousel();
                    goToSlide((currentIndex + 1) % totalItems);
                    startCarousel();
                }}
                aria-label="Next slide"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
            </button>
        {/if}
    </section>
{/if}

<style>
    .line-clamp-4 {
        display: -webkit-box;
        -webkit-line-clamp: 4;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>
