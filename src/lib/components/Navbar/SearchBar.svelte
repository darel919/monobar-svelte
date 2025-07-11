<script>
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { parseSearchInput, getSearchPlaceholder, buildSearchUrl, SEARCH_TYPES } from '$lib/utils/searchUtils.js';
    import { getSessionHeaders } from '$lib/utils/authUtils';
    
    let searchQuery = '';
    /** @type {string | null} */
    let activePrefix = null;
    /** @type {HTMLInputElement} */
    let searchInputRef;
    /** @type {any[]} */
    let results = [];    
    let isLoading = false;
    let showResults = false;    
    let hasSearched = false;
    /** @type {HTMLDivElement | undefined} */
    let searchContainerRef;
    /** @type {number | undefined} */
    let debounceTimer;

    /**
     * @param {string} query
     * @param {string | null} type
     */
    async function clientSearch(query, type) {
        try {
            let searchUrl = `/api/search?q=${encodeURIComponent(query.trim())}`;
            if (type) {
                searchUrl += `&type=${encodeURIComponent(type)}`;
            }
            
            const sessionHeaders = getSessionHeaders();
            const response = await fetch(searchUrl, {
                headers: sessionHeaders
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            return data || [];
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }

    $: placeholder = activePrefix ? SEARCH_TYPES[activePrefix]?.placeholder || 'search' : 'search';    
    onMount(() => {
        /**
         * @param {MouseEvent} event
         */        const handleClickOutside = (event) => {
            if (searchContainerRef && event.target instanceof Node && !searchContainerRef.contains(event.target)) {
                showResults = false;
            }
        };

        if (browser) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    });    $: {
        if (browser) {
            if (searchQuery.trim() === '') {
                results = [];
                hasSearched = false;
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                }
            } else {
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                }
                  debounceTimer = setTimeout(async () => {
                    isLoading = true;
                    try {
                        const searchResults = await clientSearch(searchQuery, activePrefix);
                        results = searchResults.slice(0, 5);
                        hasSearched = true;
                    } catch (error) {
                        console.error('Search error:', error);
                        results = [];
                        hasSearched = true;
                    } finally {
                        isLoading = false;
                    }
                }, 300);
            }
        }    }

    /**
     * @param {any} e
     */
    function handleSearchChange(e) {
        const inputValue = /** @type {HTMLInputElement} */ (e.target).value;
        
        if (inputValue.includes(':') && !activePrefix) {
            const colonIndex = inputValue.indexOf(':');
            const possiblePrefix = inputValue.substring(0, colonIndex);
            
            if (SEARCH_TYPES[possiblePrefix]) {
                activePrefix = possiblePrefix;
                const newQuery = inputValue.substring(colonIndex + 1);
                searchQuery = newQuery;
                
                setTimeout(() => {
                    if (searchInputRef) {
                        searchInputRef.focus();
                        searchInputRef.setSelectionRange(newQuery.length, newQuery.length);
                    }
                }, 0);
                
                return;
            }
        }
        
        searchQuery = inputValue;
    }

    function handleInputFocus() {
        showResults = true;
    }

    /**
     * @param {KeyboardEvent} e
     */    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            handleSubmit(e);        
        } else if (e.key === 'Backspace' && activePrefix && searchQuery === '') {
            activePrefix = null;
        }
    }

    /**
     * @param {any} e
     */
    function handleSubmit(e) {
        e.preventDefault();
        if (!searchQuery.trim() && !activePrefix) return;
        
        let searchUrl;
        if (activePrefix) {
            searchUrl = buildSearchUrl(searchQuery, { type: activePrefix });
        } else {
            searchUrl = buildSearchUrl(searchQuery);
        }        
        goto(searchUrl);
        showResults = false;
    }

    function handleResultClick() {
        showResults = false;
    }    function handlePrefixRemove() {
        activePrefix = null;
        if (searchInputRef) {
            searchInputRef.focus();
        }    }
</script>

<div class="relative w-full max-w-md" bind:this={searchContainerRef}>
    <!-- Input field -->
    <form on:submit={handleSubmit} class="relative">
        <div class="relative flex items-center">
            {#if activePrefix}
                <div class="absolute left-2 flex items-center gap-1 z-10">
                    <div class="bg-base-200 px-2 py-1 rounded text-xs flex items-center gap-1">
                        {activePrefix}
                        <button
                            type="button"
                            class="text-gray-500 hover:text-gray-700 text-sm"
                            on:click={handlePrefixRemove}
                        >
                            ×
                        </button>
                    </div>
                </div>
            {/if}
              
            <label class="input">
                <input
                    bind:this={searchInputRef}
                    type="search"
                    value={searchQuery}
                    on:input={handleSearchChange}
                    on:keydown={handleKeyDown}
                    on:focus={handleInputFocus}
                    class="h-10 w-full text-lg font-light {activePrefix ? 'pl-13' : 'pl-0'} pr-8 rounded-md"
                    {placeholder}
                    autocomplete="off"
                />
            </label>
            
            {#if isLoading}
                <div class="absolute right-3 top-1/2 -translate-y-1/2">
                    <div class="loading loading-spinner loading-sm opacity-50"></div>
                </div>
            {/if}
              <button type="submit" class="absolute right-2 p-1 hover:bg-base-200 rounded" aria-label="Search">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>        
        </div>
    </form>
    
    <!-- Results  -->
    {#if showResults && searchQuery.trim() !== ''}
        <div class="absolute top-full w-full">
            <div class="relative mt-2">
                <div class="absolute w-full bg-base-200 rounded-2xl shadow-xl overflow-hidden">
                    {#if isLoading}
                        <div class="p-4 text-sm opacity-50 flex items-center gap-2">
                            <div class="loading loading-spinner loading-xs"></div>
                            Searching...
                        </div>
                    {:else if results.length > 0}
                        <div>
                            {#each results as item, index}
                                <a
                                    href={activePrefix === 'genre' ? `/library?genreId=${item.id}` : `/info?id=${item.id}&type=${item.type || "Movie"}`}
                                    class="block px-4 py-2 hover:bg-base-300 transition-colors"
                                    on:click={handleResultClick}
                                >
                                    <section class="py-1">
                                        <h2 class="text-lg">{item.OriginalTitle || item.Name} {#if item.ProductionYear}<span class='opacity-50'>({item.ProductionYear})</span>{/if}</h2>
                                        <h2 class="text-xs truncate opacity-50">{item.Overview}</h2>
                                    </section>
                                </a>
                            {/each}
                            {#if results.length === 5}
                                <a
                                    href={buildSearchUrl(activePrefix ? `${activePrefix}:${searchQuery}` : searchQuery)}
                                    class="block px-4 py-3 text-sm hover:bg-base-300/50 transition-colors border-t border-base-300/20 font-medium text-primary"
                                    on:click={handleResultClick}
                                >
                                    View all results...
                                </a>
                            {/if}
                        </div>
                    {:else if !isLoading && hasSearched && searchQuery.trim() !== ''}
                        <div class="p-4 text-sm opacity-50">No results found</div>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>
