<script lang="ts">    
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import HoverModalView from './HoverModalView.svelte';
    import ImageComponent from './ImageComponent.svelte';

    interface LibraryItem {
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
        ImageTags?: {
            Thumb: string | null | undefined;
            Primary?: string;
            Logo?: string;
        };
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
    let isScrolling: boolean = false;
    let scrollTimeout: number | null = null;    
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
    });    $: {
        if (browser && data?.length) {
            imgLoaded = {};
            imgError = {};
        }
    }
     function getImageSource(item: LibraryItem): string | null {
        if (!item) return null;
        
        if (responsiveViewMode === "poster grid") {
            if (viewMode === "default_thumb_recommendation") {
                return item.ImageTags?.Primary || null;
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
    }    function handleItemHover(item: LibraryItem, event: MouseEvent): void {
        if (disableClick || isScrolling) return;
        
        if (responsiveViewMode === "default_thumb_home") {
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                hoverTimeout = null;
            }
            mousePosition = { x: event.clientX, y: event.clientY };
            modalItem = item;
            modalOpen = true;
        } else if (responsiveViewMode === "default_thumb_library") {
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                hoverTimeout = null;
            }
            mousePosition = { x: event.clientX, y: event.clientY };
            modalItem = item;
            modalOpen = true;
        } else if (responsiveViewMode === "default_thumb_recommendation") {
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                hoverTimeout = null;
            }
            const itemId = item.Id || item.id || item.Name || '';
            hoverTimeout = setTimeout(() => {
                if (!isScrolling) {
                    hoveredItemId = itemId;
                    modalItem = item;
                    modalOpen = true;
                }
            }, 600);
        }
    }    function handleItemLeave(): void {
        if (responsiveViewMode === "default_thumb_home" || responsiveViewMode === "default_thumb_library") {
            hoverTimeout = setTimeout(() => {
                modalOpen = false;
                modalItem = null;
            }, 100);
        } else if (responsiveViewMode === "default_thumb_recommendation") {
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
    }
    function handleModalEnter(): void {
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            hoverTimeout = null;
        }
    }    function handleModalLeave(): void {
        if (responsiveViewMode === "default_thumb_home" || responsiveViewMode === "default_thumb_library") {
            modalOpen = false;
            modalItem = null;
        } else if (responsiveViewMode === "default_thumb_recommendation") {
            hoverTimeout = setTimeout(() => {
                hoveredItemId = null;
                modalOpen = false;
                modalItem = null;
            }, 100);
        }
    }

    function handleImgLoad(id: string): void {
        imgLoaded = { ...imgLoaded, [id]: true };
        imgError = { ...imgError, [id]: false };
    }

    function handleImgError(id: string): void {
        imgLoaded = { ...imgLoaded, [id]: true };
        imgError = { ...imgError, [id]: true };
    }

    const itemHoverClass = "transition-transform duration-200 ease-in-out hover:-translate-y-1 p-1";
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
            {@const uniqueKey = `${itemId}-${item.Type || ''}-${index}`}            <a
                href={disableClick ? undefined : `/info?id=${itemId}&type=${item.Type}`}
                class={`flex flex-col items-center ${itemHoverClass}`}
                title={item.Overview || item.overview}
                style={disableClick ? 'cursor: default; pointer-events: none;' : ''}
            >
                <div class="relative w-full mb-4 aspect-[2/3]">
                    {#if posterImgSrc && !imgError[itemId]}                        <ImageComponent 
                            src={posterImgSrc}
                            alt={item.Name || item.title || 'Image'}
                            aspectRatio="2/3"
                            borderRadius="rounded-lg"
                            onload={() => handleImgLoad(itemId)}
                            onerror={() => handleImgError(itemId)}
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
    <section class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">        {#each data as item}
            {@const itemId = item.Id || item.id || item.Name || ''}            <a
                href={disableClick ? undefined : `/info?id=${item.Id}&type=${item.Type}`}
                class={`flex flex-col items-center ${itemHoverClass}`}
                title={item.Overview}
                style={disableClick ? 'cursor: default; pointer-events: none;' : ''}
                on:mouseenter={(e) => handleItemHover(item, e)}
                on:mouseleave={handleItemLeave}
            >
                <div class="relative w-full aspect-[16/9]">                    {#if (item.thumbPath || item.ImageTags?.Primary)}                        <ImageComponent 
                            src={item.thumbPath || item.ImageTags?.Primary || ''}
                            alt={item.Name || 'Image'}
                            aspectRatio="16/9"
                            borderRadius="rounded-sm"
                            onload={() => handleImgLoad(itemId)}
                            onerror={() => handleImgError(itemId)}
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
                    {/if}                </div>
            </a>
        {/each}
    </section>
{:else if responsiveViewMode === "default_thumb_home"}
    <section class="flex overflow-x-auto gap-0 pb-4 scrollbar-hide">        
        {#each data as item}
            {@const itemId = item.Id || item.id || item.Name || ''}            <a
                href={disableClick ? undefined : `/info?id=${item.Id}&type=${item.Type}`}
                class={`flex flex-col items-center min-w-[280px] max-w-[280px] ${itemHoverClass} flex-shrink-0`}
                title={item.Overview}
                style={disableClick ? 'cursor: default; pointer-events: none;' : ''}                
                on:mouseenter={(e) => handleItemHover(item, e)}
                on:mouseleave={handleItemLeave}
            >
                <div class="relative w-full aspect-[16/9]">                    {#if (item.thumbPath || item.ImageTags?.Primary)}                        <ImageComponent 
                            src={item.thumbPath || item.ImageTags?.Primary || ''}
                            alt={item.Name || 'Image'}
                            aspectRatio="16/9"
                            borderRadius="rounded-none"
                            onload={() => handleImgLoad(itemId)}
                            onerror={() => handleImgError(itemId)}
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
        {/each}
    </section>
{:else if responsiveViewMode === "default_thumb_recommendation"}
    <section 
        class="flex overflow-x-auto gap-0 pb-4 scrollbar-hide relative"
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
            {@const isHovered = hoveredItemId === itemId}              <div
                class={`flex flex-col items-center min-w-[280px] max-w-[280px] ${itemHoverClass} flex-shrink-0 transition-all duration-300 ease-in-out relative`}
                data-item-id={itemId}
                role="button"
                tabindex="0"
                on:mouseenter={(e) => handleItemHover(item, e)}
                on:mouseleave={handleItemLeave}
            >
                <a
                    href={disableClick ? undefined : `/info?id=${item.Id}&type=${item.Type}`}
                    class={`flex flex-col items-center w-full ${isHovered ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
                    title={item.Overview}
                    style={disableClick ? 'cursor: default; pointer-events: none;' : ''}
                >                    <div class="relative w-full aspect-[16/9]">                        {#if item.ImageTags?.Thumb}                            <ImageComponent 
                                src={item.ImageTags.Thumb}
                                alt={item.Name || 'Image'}
                                aspectRatio="16/9"
                                borderRadius="rounded-none"
                                onload={() => handleImgLoad(itemId)}
                                onerror={() => handleImgError(itemId)}
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
{:else}
    <!-- Default fallback view -->
    <section class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
        {#each data as item}
            {@const itemId = item.Id || item.id || item.Name || ''}
              <a
                href={disableClick ? undefined : `/info?id=${item.Id}&type=${item.Type}`}
                class={`flex flex-col items-center ${itemHoverClass}`}
                title={item.Overview}
                style={disableClick ? 'cursor: default; pointer-events: none;' : ''}
            >
                <div class="relative w-full mb-2 aspect-[2/1]">                    {#if item.thumbPath}                        <ImageComponent 
                            src={item.thumbPath}
                            alt={item.Name || 'Image'}
                            aspectRatio="2/1"
                            onload={() => handleImgLoad(itemId)}
                            onerror={() => handleImgError(itemId)}
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

{#if modalOpen && modalItem}
    <HoverModalView 
        isOpen={modalOpen} 
        on:close={() => modalOpen = false}
        item={modalItem}
        mouseX={responsiveViewMode === "default_thumb_recommendation" ? 0 : mousePosition.x}
        mouseY={responsiveViewMode === "default_thumb_recommendation" ? 0 : mousePosition.y}
        isInPlace={responsiveViewMode === "default_thumb_recommendation"}
        hoveredItemId={hoveredItemId}
        on:mouseenter={handleModalEnter}
        on:mouseleave={handleModalLeave}
    />
{/if}
