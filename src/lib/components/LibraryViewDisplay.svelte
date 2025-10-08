<!--
@component
Library View Display Component for rendering collections of media items in various view modes

Props:
- data: Array of LibraryItem objects to display (defaults to [])
- viewMode: Display mode string - 'default_thumb_library', 'poster grid', 'default_thumb_home', 'default_thumb_recommendation', 'default_search', 'default_search_genre', 'posterView', 'default_poster_home' (defaults to 'default_thumb_library')
- disableClick: Disable click interactions on items (defaults to false)
-->

<script lang="ts">    
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { page } from '$app/stores';
    import HoverModalView from './HoverModalView.svelte';
    import ImageComponent from './ImageComponent.svelte';
    import { useSettingsStore } from '$lib/stores/settings';



    interface LibraryItem {
        type?: string;
        Type?: string;
        images?: any;
        Id?: string;
        id?: string;
        Name?: string;
        name?: string;
        title?: string;
        OriginalTitle?: string;
        ProductionYear?: number;
        year?: number;
        Overview?: string;
        overview?: string;
        thumbPath?: string;
        posterPath?: string;
        ImageTags?: {
            Thumb?: string | null;
            Primary?: string;
            Logo?: string;
        };
        // Search-specific properties
        status?: string;
        tmdbId?: number | string;
        imdbId?: string;
        seasons?: any[];
        tvdbId?: number | string;
    }

    export let data: LibraryItem[] = [];
    export let viewMode: string = 'default_thumb_library';
    export let disableClick: boolean = false;    
    let responsiveViewMode: string = viewMode;
    let modalOpen: boolean = false;
    let modalItem: LibraryItem | null = null;
    let hoveredItemId: string | null = null;
    let imgLoaded: Record<string, boolean> = {};
    let imgError: Record<string, boolean> = {};
    let hoverTimeout: number | null = null;
    let mousePosition = { x: 0, y: 0 };
    let isScrolling = false;
    let scrollTimeout: number | null = null;    
    let settingsStore = useSettingsStore();
    onMount(() => {
        const checkWidth = () => {
            if (window.innerWidth < 540) {
                responsiveViewMode = "poster grid";
            } else {
                responsiveViewMode = viewMode;
            }
        };
        
        const handleScroll = () => {
            isScrolling = true;
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
            }, 150);
        };
        
        checkWidth();
        window.addEventListener('resize', checkWidth);
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        return () => {
            window.removeEventListener('resize', checkWidth);
            window.removeEventListener('scroll', handleScroll);
        };
    });    
    $: {
        if (browser && data?.length) {
            imgLoaded = {};
            imgError = {};
        }
    }
    function getImageSource(item: LibraryItem): string | null {
        if (!item) return null;
        
        if (responsiveViewMode === "poster grid") {
            // Handle request search mode on mobile
            if (isRequestSearchMode) {
                if (item.status === 'ready') {
                    return item.thumbPath || item.posterPath || null;
                } else {
                    // Handle search result images
                    if (Array.isArray(item.images) && item.images.length) {
                        const posterImg = item.images.find(imgObj => imgObj.coverType === 'poster' && (imgObj.dwsUrl || imgObj.remoteUrl));
                        if (posterImg) {
                            return posterImg.dwsUrl || posterImg.remoteUrl;
                        }
                    } else if (item.images?.dwsUrl || item.images?.remoteUrl) {
                        return item.images.dwsUrl || item.images.remoteUrl;
                    }
                    return null;
                }
            }
            
            if (viewMode === "default_thumb_recommendation") {
                return item.ImageTags?.Primary || null;
            }
            // For home/thumb modes on mobile, prefer Primary image if posterPath is not available
            if (viewMode === "default_thumb_home" || viewMode === "default_thumb_library") {
                return item.posterPath || item.ImageTags?.Primary || null;
            }
            return item.posterPath || null;
        } else if (responsiveViewMode === "posterView" || responsiveViewMode === "default_poster_home") {
            return item.posterPath || null;
        } else if (responsiveViewMode === "default_thumb_home" || responsiveViewMode === "default_thumb_library") {
            return item.thumbPath || item.ImageTags?.Primary || null;
        } else if (responsiveViewMode === "default_search" || responsiveViewMode === "default_search_genre") {
            return item.thumbPath || null;
        } else if (responsiveViewMode === "default_thumb_recommendation") {
            return item.ImageTags?.Thumb || null;
        }
        return item.thumbPath || null;
    }    
    function handleItemClick(item: LibraryItem): void {
        if (disableClick) return;
        
        if (responsiveViewMode === "default_search_genre") {
            window.location.href = `/library?genreId=${item.id}`;
            return;
        }
          if (responsiveViewMode === "default_thumb_home" || responsiveViewMode === "default_thumb_library" || responsiveViewMode === "default_thumb_recommendation") {
            window.location.href = `/info?id=${item.Id}&type=${item.Type}`;
            return;
        }
        
        modalItem = item;
        modalOpen = true;
    }    
    function handleItemHover(item: LibraryItem, event: MouseEvent): void {
        if (disableClick || isScrolling || settingsStore.get().disableHoverPopup) return;
        
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
        
        const itemId = item.Id || item.id || item.Name || '';
        hoveredItemId = itemId;
        modalItem = item;
        modalOpen = true;
    }    
    function handleItemLeave(): void {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
        hoverTimeout = setTimeout(() => {
            hoveredItemId = null;
            modalOpen = false;
            modalItem = null;
        }, 100);
    }
    function handleModalEnter(): void {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
    }    
    function handleModalLeave(): void {
        hoverTimeout = setTimeout(() => {
            hoveredItemId = null;
            modalOpen = false;
            modalItem = null;
        }, 100);
    }

    const itemHoverClass = "transition-transform duration-200 ease-in-out hover:-translate-y-1 p-1";

    // Function to determine if an item is a TV series
    function isItemTVSeries(item: any): boolean {
        return item.Type === 'Series' || 
               item.type === 'tv' || 
               item.type === 'show' || 
               item.type === 'series' ||
               item.Type === 'SeriesName' ||
               (typeof item.tvdbId !== 'undefined') ||
               (Array.isArray(item.seasons) && item.seasons.length > 0);
    }

    // Function to determine if an item is a movie
    function isItemMovie(item: any): boolean {
        return item.Type === 'Movie' || 
               item.type === 'movie' ||
               (!isItemTVSeries(item) && !item.seasons);
    }

    // Function to build the correct navigation URL for search results
    function getSearchItemUrl(item: any): string | undefined {
        const searchType = $page.url.searchParams.get('type');
        
        // For TV series in request_shows context, always go to wizard
        if (searchType === 'request_shows' && isItemTVSeries(item)) {
            const itemId = item.id || item.Id || item.itemId;
            if (item.status === 'ready') {
                // Existing content: go to wizard for season modification
                return `/request/shows/wizard?intent=update&id=${itemId}`;
            } else if (item.status === 'needRequest' || !item.status) {
                // New content: go to wizard for season selection
                return `/request/shows/wizard?intent=create&id=${itemId}`;
            } else if (item.status === 'partiallyAvailable') {
                // Partially available: go to wizard for additional seasons
                return `/request/shows/wizard?intent=update&id=${itemId}`;
            } else if (item.status === 'requested') {
                // Already requested: go to shows request status page
                return '/request/shows';
            }
        }
        
        // For ready content that's not in request context, go to info page
        if (item.status === 'ready' && $page.url.searchParams.get('type') !== 'request_shows') {
            let itemType = item.Type || item.type;
            // Ensure we have the correct type for the info page
            if (isItemTVSeries(item) && !itemType) {
                itemType = 'Series';
            } else if (isItemMovie(item) && !itemType) {
                itemType = 'Movie';
            }
            const itemId = item.Id || item.id;
            return `/info?id=${itemId}&type=${itemType}`;
        }
        
        // For requested content, go to monitoring page
        if (item.status === 'requested') {
            return $page.url.searchParams.get('type') === 'request_movies' ? '/request/movies' : '/request/shows';
        }
        
        // For content that needs to be requested
        if (item.status === 'needRequest') {
            if (isItemTVSeries(item)) {
                return `/request/shows/wizard?intent=create&id=${item.id}`;
            } else if (isItemMovie(item)) {
                return `/request/movies/wizard?intent=create&id=${item.id}`;
            }
        }
        
        // For partially available content (needs update)
        if (item.status === 'partiallyAvailable') {
            if (isItemTVSeries(item)) {
                return `/request/shows/wizard?intent=update&id=${item.id}`;
            }
        }
        
        // Fallback: if we're in a request_movies search context and it's a movie but no status
        if ($page.url.searchParams.get('type') === 'request_movies' && isItemMovie(item) && !item.status) {
            return `/request/movies/wizard?intent=create&id=${item.id}`;
        }
        
        // Additional fallback: if it looks like a TV series but we can't determine the intent
        // redirect to the wizard page directly
        if (isItemTVSeries(item)) {
            return `/request/shows/wizard?intent=create&id=${item.id}`;
        }
        
        return undefined;
    }

    // Helper to get the correct info id for /info page
    function getInfoId(item: any, mode: string): string | undefined {
        if (mode === 'default_search_request') {
            return item.itemId || item.Id || item.id;
        }
        return item.Id || item.id || item.itemId;
    }

    // Function to determine if an item should be clickable
    function isItemClickable(item: any): boolean {
        // If it has a specific status, use that
        if (item.status) {
            return ['ready', 'requested', 'needRequest', 'partiallyAvailable'].includes(item.status);
        }
        
        // Fallback: if we're in request context, items should be clickable
        const searchType = $page.url.searchParams.get('type');
        if (searchType === 'request_shows' && isItemTVSeries(item)) {
            return true;
        }
        if (searchType === 'request_movies' && isItemMovie(item)) {
            return true;
        }
        
        return false;
    }

    let isRequestSearchMode = false;
    $: isRequestSearchMode = viewMode === 'default_search_request';
</script>

{#if !data?.length}
    <section>
        <h1>No data available.</h1>
    </section>
{:else if responsiveViewMode === "poster grid"}
    <section class="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {#each data as item, index}
            {@const itemId = item.Id || item.id || item.Name || index.toString()}
            {@const posterImgSrc = getImageSource(item)}
            {@const uniqueKey = `${itemId}-${item.Type || ''}-${index}`}            
            <a
                href={disableClick ? undefined : (isRequestSearchMode ? getSearchItemUrl(item) : `/info?id=${itemId}&type=${item.type || item.Type}`)}
                class={`flex flex-col items-center ${itemHoverClass}`}
                title={item.Overview || item.overview}
                style={disableClick ? 'cursor: default; pointer-events: none;' : (isRequestSearchMode && !isItemClickable(item) ? 'cursor: default; pointer-events: none;' : '')}
            >
                <div class="relative w-full mb-4 aspect-[2/3]">
                    {#if posterImgSrc && !imgError[itemId]}                        
                    <ImageComponent 
                            src={posterImgSrc}
                            alt={item.Name || item.title || 'Image'}
                            aspectRatio="2/3"
                            borderRadius="rounded-lg"
                            fallbackName={item.OriginalTitle || item.Name || item.title || 'Unknown'}
                        />
                    {:else}
                        <div class="flex items-center justify-center w-full h-full bg-gray-200 rounded-lg text-xs text-gray-500">No Image</div>
                    {/if}
                </div>
                <section class="flex flex-col text-center items-center w-full">
                    <h2 class="w-full text-lg font-bold truncate">
                        {item.OriginalTitle || item.Name || item.title || 'Unknown'}
                    </h2>
                    {#if item.ProductionYear || item.year}
                        <p class="text-xs opacity-50">{item.ProductionYear || item.year}</p>
                    {/if}
                </section>
            </a>
        {/each}
    </section>
{:else if responsiveViewMode === "default_thumb_library"}
    <section class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">        
        {#each data as item}
            {@const itemId = item.Id || item.id || item.Name || ''}            
            <a
                href={disableClick ? undefined : `/info?id=${item.Id}&type=${item.Type}`}
                class={`flex flex-col items-center ${itemHoverClass}`}
                title={item.Overview}
                style={disableClick ? 'cursor: default; pointer-events: none;' : ''}
                data-item-id={itemId}
                on:mouseenter={(e) => handleItemHover(item, e)}
                on:mouseleave={handleItemLeave}
            >
                <div class="relative w-full aspect-[16/9]">                    
                    {#if (item.thumbPath || item.ImageTags?.Primary)}                        
                        <ImageComponent 
                            src={item.thumbPath || item.ImageTags?.Thumb || item.ImageTags?.Primary || ''}
                            alt={item.Name || 'Image'}
                            aspectRatio="16/9"
                            borderRadius="rounded-sm"
                            fallbackName={item.OriginalTitle || item.Name || 'Unknown'}
                        />
                    {:else}
                        <!-- Layered fallback: Primary as background, then Logo or title as overlay -->
                        <div class="relative w-full h-full bg-base-200 rounded-lg text-xs text-base-content p-2 text-center overflow-hidden">
                            {#if item.ImageTags?.Primary}
                                <!-- Primary poster as background, cover to fill (portrait will be centered and cropped) -->
                                <img src={item.ImageTags.Primary} alt={item.Name} class="absolute inset-0 w-full h-full object-cover transform scale-110" />
                                <div class="absolute inset-0 bg-black/60"></div>
                            {:else}
                                <div class="absolute inset-0 bg-base-200" />
                            {/if}

                            <!-- Overlay: Logo if available, otherwise title -->
                            <div class="relative z-10 flex flex-col items-center justify-center w-full h-full">
                                {#if item.ImageTags?.Logo}
                                    <img src={item.ImageTags.Logo} alt={item.Name} class="w-fit max-h-20 object-contain" />
                                {:else}
                                    <div class="font-bold text-2xl text-white drop-shadow-md px-2 text-center">{item.OriginalTitle || item.Name}</div>
                                {/if}

                                {#if item.ProductionYear}
                                    <div class="text-sm text-white/80 mt-2">{item.ProductionYear}</div>
                                {/if}
                            </div>
                        </div>
                    {/if}                
                </div>
            </a>
        {/each}
    </section>
{:else if responsiveViewMode === "default_thumb_home"}
    <section class="flex overflow-x-auto gap-0 py-4">        
        {#each data as item}
            {@const itemId = item.Id || item.id || item.Name || ''}              
            <a
                href={disableClick ? undefined : `/info?id=${item.Id}&type=${item.Type}`}
                class={`flex flex-col items-center min-w-[280px] max-w-[280px] ${itemHoverClass} flex-shrink-0`}
                title={item.Overview}
                style={disableClick ? 'cursor: default; pointer-events: none;' : ''}
                data-item-id={itemId}
                on:mouseenter={(e) => handleItemHover(item, e)}
                on:mouseleave={handleItemLeave}
            >
                <div class="relative w-full aspect-[16/9]">                    
                        {#if (item.thumbPath || item.ImageTags?.Thumb)}                        
                            <!-- Show actual landscape thumb if available -->
                            <ImageComponent 
                                src={item.thumbPath || item.ImageTags?.Thumb || ''}
                                alt={item.Name || 'Image'}
                                aspectRatio="16/9"
                                borderRadius="rounded-none"
                                fallbackName={item.OriginalTitle || item.Name || 'Unknown'}
                            />
                        {:else if item.ImageTags?.Primary}
                            <!-- No thumb/landscape available: use Primary as zoomed background and overlay Logo or title -->
                            <div class="relative w-full h-full bg-base-200 rounded-lg text-xs text-base-content p-2 text-center overflow-hidden">
                                <!-- Primary poster as background, cover to fill (portrait will be centered and cropped) -->
                                <img src={item.ImageTags.Primary} alt={item.Name} class="absolute inset-0 w-full h-full object-cover transform scale-110" />
                                <div class="absolute inset-0 bg-black/60"></div>

                                <!-- Overlay: Logo if available, otherwise title -->
                                <div class="relative z-10 flex flex-col items-center justify-center w-full h-full">
                                    {#if item.ImageTags?.Logo}
                                        <img src={item.ImageTags.Logo} alt={item.Name} class="w-fit max-h-20 object-contain" />
                                    {:else}
                                        <div class="font-bold text-2xl text-white drop-shadow-md px-2 text-center">{item.OriginalTitle || item.Name}</div>
                                    {/if}

                                    {#if item.ProductionYear}
                                        <div class="text-sm text-white/80 mt-2">{item.ProductionYear}</div>
                                    {/if}
                                </div>
                            </div>
                        {:else}
                            <!-- Fallback when no images present at all -->
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
{:else if responsiveViewMode === "default_thumb_recommendation"}
    <section 
        class="flex overflow-x-auto gap-0 pb-4 relative"
        on:scroll={() => {
            isScrolling = true;
            if (scrollTimeout) {
                clearTimeout(scrollTimeout);
            }
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
            }, 150);
        }}
    >          
    {#each data as item}
            {@const itemId = item.Id || item.id || item.Name || ''}
            {@const isHovered = hoveredItemId === itemId}              
            <div
                class={`flex flex-col items-center min-w-[280px] max-w-[280px] ${itemHoverClass} flex-shrink-0 transition-all duration-300 ease-in-out relative`}
                data-item-id={itemId}
                role="button"
                tabindex="0"
                on:mouseenter={(e) => handleItemHover(item, e)}
                on:mouseleave={handleItemLeave}
            >
                <a
                    href={disableClick ? undefined : `/info?id=${item.Id}&type=${item.Type}`}
                    class="flex flex-col items-center w-full"
                    title={item.Overview}
                    style={disableClick ? 'cursor: default; pointer-events: none;' : ''}
                >
                <div class="relative w-full aspect-[16/9]">                        
                    {#if item.ImageTags?.Thumb}                            
                        <ImageComponent 
                                src={item.ImageTags.Thumb}
                                alt={item.Name || 'Image'}
                                aspectRatio="16/9"
                                borderRadius="rounded-none"
                                fallbackName={item.OriginalTitle || item.Name || 'Unknown'}
                            />
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
            </div>
        {/each}
    </section>
{:else if responsiveViewMode === 'default_search_genre'}
    <section class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
        {#each data as item}
            {@const itemId = item.Id || item.id || item.Name || ''}
              <a
                href={disableClick ? undefined : `/library?id=${item.id}&type=${item.type}`}
                class={`flex flex-col items-center ${itemHoverClass}`}
                title={item.Overview}
                style={disableClick ? 'cursor: default; pointer-events: none;' : ''}
            >
                <section class="flex flex-col text-center items-center w-full">
                    {#if item.OriginalTitle}
                        <h2 class="w-full text-lg font-bold truncate">{item.OriginalTitle}</h2>
                    {:else}
                        <h2 class="w-full text-lg font-bold truncate">{item.Name}</h2>
                    {/if}
                    {#if item.ProductionYear}
                        <p class="text-xs opacity-50">{item.ProductionYear}</p>
                    {/if}                
                </section>
            </a>
        {/each}
    </section>
{:else if responsiveViewMode === 'default_search'}
    <section class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
        {#each data as item}
            {@const itemId = item.Id || item.id || item.Name || ''}
            <a
                href={disableClick ? undefined : getSearchItemUrl(item)}
                class={`flex flex-col items-center ${itemHoverClass}`}
                title={item.Overview}
                style={disableClick ? 'cursor: default; pointer-events: none;' : (!isItemClickable(item) ? 'cursor: default; pointer-events: none;' : '')}
            >
                <div class="relative w-full mb-2 aspect-[2/1]">
                    {#if item.status === 'ready'}
                        {#if item.thumbPath || item.posterPath}
                            <ImageComponent 
                                src={item.thumbPath || item.posterPath}
                                alt={item.Name || 'Image'}
                                aspectRatio="2/1"
                                fallbackName={item.OriginalTitle || item.Name || 'Unknown'}
                            />
                        {:else if Array.isArray(item.images) && item.images.length}
                            {@const posterImg = item.images.find(imgObj => imgObj.coverType === 'poster' && (imgObj.dwsUrl || imgObj.remoteUrl))}
                            {#if posterImg}
                                <ImageComponent 
                                    src={posterImg.dwsUrl || posterImg.remoteUrl}
                                    alt={item.Name || 'Image'}
                                    aspectRatio="2/1"
                                    fallbackName={item.OriginalTitle || item.Name || 'Unknown'}
                                />
                            {:else}
                                <div class="flex items-center justify-center w-full aspect-[2/1] bg-gray-200 rounded-lg text-xs text-gray-500">No Image</div>
                            {/if}
                        {:else}
                            <div class="flex items-center justify-center w-full aspect-[2/1] bg-gray-200 rounded-lg text-xs text-gray-500">No Image</div>
                        {/if}
                    {:else}
                        {#if Array.isArray(item.images) && item.images.length}
                            {@const posterImg = item.images.find(imgObj => imgObj.coverType === 'poster' && (imgObj.dwsUrl || imgObj.remoteUrl))}
                            {#if posterImg}
                                <ImageComponent 
                                    src={posterImg.dwsUrl || posterImg.remoteUrl}
                                    alt={item.Name || 'Image'}
                                    aspectRatio="2/1"
                                    fallbackName={item.OriginalTitle || item.Name || 'Unknown'}
                                />
                            {:else}
                                <div class="flex items-center justify-center w-full aspect-[2/1] bg-gray-200 rounded-lg text-xs text-gray-500">No Image</div>
                            {/if}
                        {:else if item.images?.dwsUrl || item.images?.remoteUrl}
                            <ImageComponent 
                                src={item.images.dwsUrl || item.images.remoteUrl}
                                alt={item.Name || 'Image'}
                                aspectRatio="2/1"
                                fallbackName={item.OriginalTitle || item.Name || 'Unknown'}
                            />
                        {:else}
                            <div class="flex items-center justify-center w-full aspect-[2/1] bg-gray-200 rounded-lg text-xs text-gray-500">No Image</div>
                        {/if}
                    {/if}
                </div>
                <section class="flex flex-col text-center items-center w-full">
                    {#if item.OriginalTitle}
                        <h2 class="w-full text-lg font-bold truncate">{item.OriginalTitle}</h2>
                    {:else}
                        <h2 class="w-full text-lg font-bold truncate">{item.Name}</h2>
                    {/if}
                    {#if item.ProductionYear}
                        <p class="text-xs opacity-50">{item.ProductionYear}</p>
                    {/if}                
                </section>
            </a>
        {/each}
    </section>
{:else if responsiveViewMode === 'default_search_request'}
    <section class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
        {#each data as item}
        <!-- {console.log(item)} -->
            {@const infoId = getInfoId(item, 'default_search_request')}
            <a
                href={disableClick ? undefined : getSearchItemUrl(item)}
                class={`flex flex-col items-center ${itemHoverClass}`}
                title={item.Overview}
                style={disableClick ? 'cursor: default; pointer-events: none;' : (!isItemClickable(item) ? 'cursor: default; pointer-events: none;' : '')}
            >
                <div class="relative w-full mb-2 aspect-[2/1]">
                    {#if item.status === 'ready'}
                        {#if item.thumbPath || item.posterPath}
                            <ImageComponent 
                                src={item.thumbPath || item.posterPath}
                                alt={item.Name || 'Image'}
                                aspectRatio="2/1"
                                fallbackName={item.OriginalTitle || item.Name || 'Unknown'}
                            />
                        {:else if Array.isArray(item.images) && item.images.length}
                            {@const posterImg = item.images.find(imgObj => imgObj.coverType === 'poster' && (imgObj.dwsUrl || imgObj.remoteUrl))}
                            {#if posterImg}
                                <ImageComponent 
                                    src={posterImg.dwsUrl || posterImg.remoteUrl}
                                    alt={item.Name || 'Image'}
                                    aspectRatio="2/1"
                                    fallbackName={item.OriginalTitle || item.Name || 'Unknown'}
                                />
                            {:else}
                                <div class="flex items-center justify-center w-full aspect-[2/1] bg-gray-200 rounded-lg text-xs text-gray-500">No Image</div>
                            {/if}
                        {:else}
                            <div class="flex items-center justify-center w-full aspect-[2/1] bg-gray-200 rounded-lg text-xs text-gray-500">No Image</div>
                        {/if}
                    {:else}
                        {#if Array.isArray(item.images) && item.images.length}
                            {@const posterImg = item.images.find(imgObj => imgObj.coverType === 'poster' && (imgObj.dwsUrl || imgObj.remoteUrl))}
                            {#if posterImg}
                                <ImageComponent 
                                    src={posterImg.dwsUrl || posterImg.remoteUrl}
                                    alt={item.Name || 'Image'}
                                    aspectRatio="2/1"
                                    fallbackName={item.OriginalTitle || item.Name || 'Unknown'}
                                />
                            {:else}
                                <div class="flex items-center justify-center w-full aspect-[2/1] bg-gray-200 rounded-lg text-xs text-gray-500">No Image</div>
                            {/if}
                        {:else if item.images?.dwsUrl || item.images?.remoteUrl}
                            <ImageComponent 
                                src={item.images.dwsUrl || item.images.remoteUrl}
                                alt={item.Name || 'Image'}
                                aspectRatio="2/1"
                                fallbackName={item.OriginalTitle || item.Name || 'Unknown'}
                            />
                        {:else}
                            <div class="flex items-center justify-center w-full aspect-[2/1] bg-gray-200 rounded-lg text-xs text-gray-500">No Image</div>
                        {/if}
                    {/if}
                </div>
                <section class="flex flex-col text-center items-center w-full">
                    {#if item.OriginalTitle}
                        <h2 class="w-full text-lg font-bold truncate">{item.OriginalTitle}</h2>
                    {:else}
                        <h2 class="w-full text-lg font-bold truncate">{item.Name}</h2>
                    {/if}
                    {#if item.ProductionYear}
                        <p class="text-xs opacity-50">{item.ProductionYear}</p>
                    {/if}                
                </section>
            </a>
        {/each}
    </section>
{:else}
    <!-- Default fallback view -->
    <section class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
        {#each data as item}
            {@const itemId = item.Id || item.id || item.Name || ''}
              <a
                href={disableClick ? undefined : `/info?id=${item.id}&type=${item.type}`}
                class={`flex flex-col items-center ${itemHoverClass}`}
                title={item.Overview}
                style={disableClick ? 'cursor: default; pointer-events: none;' : ''}
            >
                <div class="relative w-full mb-2 aspect-[2/1]">                    
                    {#if item.thumbPath}                        
                        <ImageComponent 
                            src={item.thumbPath}
                            alt={item.Name || 'Image'}
                            aspectRatio="2/1"
                            fallbackName={item.OriginalTitle || item.Name || 'Unknown'}
                        />
                    {:else}
                        <div class="flex items-center justify-center w-full aspect-[2/1] bg-gray-200 rounded-lg text-xs text-gray-500">No Image</div>
                    {/if}
                </div>
                <section class="flex flex-col text-center items-center w-full">
                    {#if item.OriginalTitle}
                        <h2 class="w-full text-lg font-bold truncate">{item.OriginalTitle}</h2>
                    {:else}
                        <h2 class="w-full text-lg font-bold truncate">{item.Name}</h2>
                    {/if}
                    {#if item.ProductionYear}
                        <p class="text-xs opacity-50">{item.ProductionYear}</p>
                    {/if}                
                </section>
            </a>
        {/each}
    </section>
{/if}

{#if modalOpen && modalItem && !settingsStore.get().disableHoverPopup}
    <HoverModalView 
        isOpen={modalOpen} 
        on:close={() => modalOpen = false}
        item={modalItem as any}
        modalMode="full"
        hoveredItemId={hoveredItemId}
        on:mouseenter={handleModalEnter}
        on:mouseleave={handleModalLeave}
    />
{/if}
