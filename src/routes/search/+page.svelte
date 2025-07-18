<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
    import { LibraryViewDisplay } from '$lib';
    import StopState from '$lib/components/StopState.svelte';
    import { getSearchPlaceholder, buildSearchUrl, SEARCH_TYPES, getSearchInputPaddingLeft } from '$lib/utils/searchUtils.js';
    import { BASE_API_PATH } from '$lib/config/api';
    import { getSessionHeaders } from '$lib/utils/authUtils';
    import { getBaseEnvironment } from '$lib/utils/environment';
    
    export let data;    
    $: ({ query: initialQuery, originalQuery, type, includeExternal: initialIncludeExternal, onlineLookupError, searchTypeDisplay } = data);    
    
    // Search results promise
    /** @type {Promise<{data: any[], error: string | null}> | null} */
    let searchResultsPromise = null;
    let isSearching = false;
    
    // Document title logic
    $: documentTitle = (() => {
        if (originalQuery?.trim()) {
            if (type && searchTypeDisplay) {
                return `Search ${searchTypeDisplay}: ${originalQuery} - moNobar`;
            }
            return `Search: ${originalQuery} - moNobar`;
        }
        return 'Search - moNobar';
    })();
    
    // Initialize query and activePrefix based on URL parameters
    let query = '';
    /** @type {string | null} */
    let activePrefix = null;
    
    $: {
        activePrefix = type || null;
        query = initialQuery || '';
    }
    
    let includeExternal = initialIncludeExternal || false;
    let lastIncludeExternal = initialIncludeExternal || false;
    let showLoading = false;
    let isPending = false;
    /** @type {HTMLInputElement | undefined} */
    let searchInputRef;
    /** @type {HTMLDivElement | undefined} */
    let searchContainerRef;

    $: placeholder = activePrefix ? getSearchPlaceholder(`${activePrefix}:`) : getSearchPlaceholder(query);
    
    // Initialize search results if there's a query in the URL
    onMount(() => {
        if (browser) {
            if (searchInputRef) {
                searchInputRef.focus();
            }
            
            // If there's an initial query, perform the search
            if (originalQuery?.trim()) {
                performClientSearch(initialQuery, type, initialIncludeExternal);
            }
        }
    });

    // Client-side search functions
    /**
     * @param {string} searchQuery
     * @param {string | null} searchType
     * @param {boolean} includeExternalParam
     */
    async function searchData(searchQuery, searchType, includeExternalParam) {
        if (!searchQuery || !searchQuery.trim()) {
            return { data: [], error: null };
        }

        try {
            let searchUrl = `${BASE_API_PATH}/search?q=${encodeURIComponent(searchQuery.trim())}`;
            if (includeExternalParam) {
                searchUrl += `&includeRequest=true`;
            }
            if (searchType) {
                searchUrl += `&type=${encodeURIComponent(searchType)}`;
            }

            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'dp-Monobar',
                'X-Environment': getBaseEnvironment(window.location),
                ...getSessionHeaders()
            };

            const response = await fetch(searchUrl, {
                method: 'GET',
                headers
            });
            
            if (!response.ok) {
                // For 4xx/5xx errors, we should show a proper error message
                if (response.status >= 500) {
                    throw new Error('Server error occurred');
                } else if (response.status === 404) {
                    // 404 means no results found, not an error
                    return { data: [] };
                } else {
                    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                    throw new Error(JSON.stringify({ status: response.status, statusText: response.statusText, ...errorData }));
                }
            }
            
            const data = await response.json();
            return { data };
        } catch (error) {
            console.error('Failed to search data:', error);
            // Only return error for actual server issues
            if (error.message === 'Server error occurred') {
                return {
                    data: [],
                    error: 'Search service is temporarily unavailable. Please try again later.'
                };
            }
            return {
                data: [],
                error: null // For other errors, just return empty results
            };
        }
    }

    /**
     * @param {string} searchQuery
     */
    async function searchMovieRequests(searchQuery) {
        if (!searchQuery || !searchQuery.trim()) {
            return { data: [], error: null };
        }

        try {
            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'dp-Monobar',
                'X-Environment': getBaseEnvironment(window.location),
                ...getSessionHeaders()
            };

            const response = await fetch(`${BASE_API_PATH}/request/movie/search?q=${encodeURIComponent(searchQuery.trim())}`, {
                method: 'GET',
                headers
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(JSON.stringify({ status: response.status, statusText: response.statusText, ...errorData }));
            }
            
            const data = await response.json();
            return { data };
        } catch (error) {
            console.error('Failed to search movie requests:', error);
            return {
                data: [],
                error: null // Don't treat API errors as search unavailable, just return empty results
            };
        }
    }

    /**
     * @param {string} searchQuery
     */
    async function searchShowsRequests(searchQuery) {
        if (!searchQuery || !searchQuery.trim()) {
            return { data: [], error: null };
        }

        try {
            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'dp-Monobar',
                'X-Environment': getBaseEnvironment(window.location),
                ...getSessionHeaders()
            };

            const response = await fetch(`${BASE_API_PATH}/request/tv/search?q=${encodeURIComponent(searchQuery.trim())}`, {
                method: 'GET',
                headers
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(JSON.stringify({ status: response.status, statusText: response.statusText, ...errorData }));
            }
            
            const data = await response.json();
            return { data };
        } catch (error) {
            console.error('Failed to search TV requests:', error);
            return {
                data: [],
                error: null // Don't treat API errors as search unavailable, just return empty results
            };
        }
    }

    /**
     * @param {string} searchQuery
     */
    async function searchGenreData(searchQuery) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'dp-Monobar',
                'X-Environment': getBaseEnvironment(window.location),
                ...getSessionHeaders()
            };

            const response = await fetch(`${BASE_API_PATH}/genre`, {
                method: 'GET',
                headers
            });
            
            if (!response.ok) {
                return { data: [], error: `Failed to fetch genres: ${response.status}` };
            }
            
            const genres = await response.json();
            
            if (genres && Array.isArray(genres)) {
                const filteredGenres = genres.filter(genre => 
                    (genre.Name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (genre.SortName?.toLowerCase().includes(searchQuery.toLowerCase()))
                );
                return { data: filteredGenres };
            }
            
            return { data: [] };
        } catch (error) {
            console.error('Failed to search genre data:', error);
            return {
                data: [],
                error: null // Don't treat API errors as search unavailable, just return empty results
            };
        }
    }

    /**
     * @param {string} searchQuery
     */
    async function searchLibraryData(searchQuery) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'dp-Monobar',
                'X-Environment': getBaseEnvironment(window.location),
                ...getSessionHeaders()
            };

            const response = await fetch(`${BASE_API_PATH}/library`, {
                method: 'GET',
                headers
            });
            
            if (!response.ok) {
                return { data: [], error: `Failed to fetch library: ${response.status}` };
            }
            
            const library = await response.json();
            
            if (library && Array.isArray(library)) {
                const filteredItems = library.filter(item => 
                    (item.Name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (item.OriginalTitle?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (item.title?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (item.name?.toLowerCase().includes(searchQuery.toLowerCase()))
                );
                return { data: filteredItems };
            }
            
            return { data: [] };
        } catch (error) {
            console.error('Failed to search library data:', error);
            return {
                data: [],
                error: null // Don't treat API errors as search unavailable, just return empty results
            };
        }
    }

    /**
     * @param {string} searchQuery
     * @param {string | null} searchType
     * @param {boolean} includeExternalParam
     */
    async function performClientSearch(searchQuery, searchType, includeExternalParam) {
        if (!searchQuery?.trim()) {
            searchResultsPromise = Promise.resolve({ data: [], error: null });
            return;
        }

        isSearching = true;
        
        try {
            let searchResult;
            
            // Handle request search types
            if (searchType === 'request_movies') {
                searchResult = await searchMovieRequests(searchQuery);
            } else if (searchType === 'request_shows') {
                searchResult = await searchShowsRequests(searchQuery);
            } else {
                // Try using the dedicated search API first
                searchResult = await searchData(searchQuery, searchType, includeExternalParam);
            }
            
            // If no results from main search, try fallback searches
            if (!searchResult.data || searchResult.data.length === 0) {
                if (searchType === 'genre') {
                    searchResult = await searchGenreData(searchQuery);
                } else if (!searchType || (searchType !== 'request_movies' && searchType !== 'request_shows')) {
                    searchResult = await searchLibraryData(searchQuery);
                }
            }
            
            searchResultsPromise = Promise.resolve({
                data: Array.isArray(searchResult.data) ? searchResult.data : [],
                error: searchResult.error || null
            });
        } catch (error) {
            console.error('Search error occurred:', error);
            searchResultsPromise = Promise.resolve({
                data: [],
                error: 'Unable to perform search. Please try again.'
            });
        } finally {
            isSearching = false;
        }
    }

    /**
     * @param {Event} e
     */
    function handleCheckbox(e) {
        const checked = /** @type {HTMLInputElement} */ (e.target).checked;
        const isInPrefixMode = activePrefix !== null;
        
        if (checked && isInPrefixMode) {
            return;
        }
        
        includeExternal = checked;
        showLoading = checked;

        let searchUrl;
        if (activePrefix) {
            searchUrl = buildSearchUrl(query, { type: activePrefix, includeExternal: checked });
        } else {
            searchUrl = buildSearchUrl(query, { includeExternal: checked });
        }
        
        isPending = true;
        goto(searchUrl).finally(() => {
            isPending = false;
            showLoading = false;        
        });
    }

    /**
     * @param {Event} e
     */    
    function handleInput(e) {
        const inputValue = /** @type {HTMLInputElement} */ (e.target).value;        
        if (activePrefix) {
            query = inputValue;
        } else {
            if (inputValue.includes(':')) {
                const colonIndex = inputValue.indexOf(':');
                const possiblePrefix = inputValue.substring(0, colonIndex);
                
                if (SEARCH_TYPES[possiblePrefix]) {
                    e.preventDefault();
                    activePrefix = possiblePrefix;
                    const newQuery = inputValue.substring(colonIndex + 1);
                    query = newQuery;

                    // Do NOT navigate here. Only update state. Navigation happens on submit/Enter.
                    if (searchInputRef) {
                        searchInputRef.value = newQuery;
                        searchInputRef.focus();
                        searchInputRef.setSelectionRange(newQuery.length, newQuery.length);
                    }
                    return;
                }            
            }
            
            query = inputValue;
        }
    }

    /**
     * @param {Event} e
     */
    function handleSubmit(e) {
        e.preventDefault();
        performSearch();
    }    

    function performSearch() {
        if (!query.trim() && !activePrefix) return;
        
        isPending = true;
        
        // Update URL first
        let searchUrl;
        if (activePrefix) {
            searchUrl = buildSearchUrl(query, { type: activePrefix, includeExternal });
        } else {
            searchUrl = buildSearchUrl(query, { includeExternal });
        }
        
        // Perform client-side search immediately
        const searchQuery = query.trim();
        if (searchQuery) {
            performClientSearch(searchQuery, activePrefix, includeExternal);
        }
        
        goto(searchUrl).finally(() => {
            isPending = false;
        });    
    }

    /**
     * @param {KeyboardEvent} e
     */    
    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            performSearch();
        } else if (e.key === 'Backspace' && activePrefix && query === '') {
            activePrefix = null;
            query = '';
        }
    }    
    
    function handlePrefixRemove() {
        activePrefix = null;
        if (searchInputRef) {
            searchInputRef.focus();
        }
    }

    $: activePrefixDisplay = activePrefix && SEARCH_TYPES[activePrefix]?.displayName ? SEARCH_TYPES[activePrefix].displayName : activePrefix;
</script>

<svelte:head>
    <title>{documentTitle}</title>
</svelte:head>

<main class="min-h-screen pt-24 px-4">
<div class="w-full max-w-5xl mx-auto px-4 sm:px-8 min-h-screen">
    <h1 class="text-4xl font-extralight mb-8 text-white">search</h1>
    
    <form class="w-full flex flex-col gap-4" on:submit={handleSubmit}>        
        <div bind:this={searchContainerRef} class="relative flex items-center w-full">
            {#if activePrefix}
                <div class="absolute left-2 flex items-center gap-1 z-10">
                    <div class="bg-base-200 px-4 py-1 rounded-none text-sm flex items-center gap-2 shadow-sm">
                        {activePrefixDisplay}
                        <button
                            type="button"
                            class="ml-2 text-gray-500 hover:text-gray-700"
                            on:click={handlePrefixRemove}
                        >
                            ×
                        </button>
                    </div>
                </div>
            {/if}            
            <input
                bind:this={searchInputRef}
                type="text"
                name="q"
                value={query}
                on:input={handleInput}
                on:keydown={handleKeyDown}
                class={`input input-bordered w-full ${getSearchInputPaddingLeft(activePrefix)}`}
                placeholder={placeholder}
                autocomplete="off"
            />            
            {#if showLoading && isPending}
                <div class="loading loading-spinner loading-sm absolute right-12"></div>
            {/if}            
            <!-- Search Dropdown -->
        </div>

        <input type="hidden" name="type" value={activePrefix || ''} />
        {#if activePrefix && query}
            <input type="hidden" name="q" value={query} />
        {/if}
        
        <button type="submit" class="btn btn-primary w-full text-inherit" disabled={isPending}>
            {#if isPending}
                <span class="flex items-center justify-center gap-2">
                    <span class="loading loading-spinner loading-sm"></span>
                    Searching
                </span>
            {:else}
                Search
            {/if}
        </button>
    </form>    
    <div class="mt-8">
        {#if onlineLookupError}
            <div class="flex justify-center items-center min-h-[300px]">
                <StopState message="Online lookup failed. Please try again or search locally." />
            </div>
        {:else if originalQuery && originalQuery.trim()}
            <div class="search-results py-8">
                <div class="mb-8">
                    <h2 class="text-3xl font-semibold text-white mb-2">
                        Search Results for "{originalQuery}"
                        {#if searchTypeDisplay}
                            <span class="text-gray-300 font-normal text-2xl">({searchTypeDisplay})</span>
                        {/if}
                    </h2>
                </div>

                {#if isSearching}
                    <div class="flex items-center justify-center min-h-[300px]">
                        <div class="flex flex-col items-center gap-4">
                            <div class="loading loading-spinner loading-lg"></div>
                            <p class="text-lg opacity-70">Searching...</p>
                        </div>
                    </div>
                {:else if searchResultsPromise}
                    {#await searchResultsPromise}
                        <div class="flex items-center justify-center min-h-[300px]">
                            <div class="flex flex-col items-center gap-4">
                                <div class="loading loading-spinner loading-lg"></div>
                                <p class="text-lg opacity-70">Searching...</p>
                            </div>
                        </div>
                    {:then searchResults}
                        {@const results = searchResults.data || []}
                        {@const error = searchResults.error}

                        {#if error}
                            <div class="flex justify-center items-center min-h-[300px]">
                                <StopState message="Search is unavailable. Please try again." />
                            </div>
                        {:else}
                            <div class="mb-4">
                                <p class="text-gray-300 text-lg">
                                    {results.length} result{results.length !== 1 ? 's' : ''} found
                                </p>
                            </div>

                            {#if results.length > 0}
                                {#if type == 'genre'}
                                    <LibraryViewDisplay 
                                        viewMode="default_search_genre"
                                        data={results} 
                                    />
                                {:else if type === 'request_movies' || type === 'request_shows'}
                                    <LibraryViewDisplay 
                                        viewMode="default_search_request"
                                        data={results}
                                    />
                                {:else}
                                    <LibraryViewDisplay 
                                        viewMode="default_search"
                                        data={results} 
                                    />
                                {/if}
                            {:else}
                                <div class="text-center py-12">
                                    <StopState message="No results found for '{originalQuery}'" />                        
                                </div>
                            {/if}
                        {/if}
                    {:catch error}
                        <div class="flex justify-center items-center min-h-[300px]">
                            <StopState message="Unable to perform search. Please try again." />
                        </div>
                    {/await}
                {/if}
            </div>
        {/if}
    </div>
</div>
</main>

