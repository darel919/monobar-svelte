<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { browser } from '$app/environment';
    import { LibraryViewDisplay } from '$lib';
    import StopState from '$lib/components/StopState.svelte';
    import ImageComponent from '$lib/components/ImageComponent.svelte';    
    import { parseSearchInput, getSearchPlaceholder, buildSearchUrl, buildFullQuery, SEARCH_TYPES } from '$lib/utils/searchUtils.js';    
    export let data;    
    $: ({ query: initialQuery, type, includeExternal: initialIncludeExternal, results, error, onlineLookupError, searchTypeDisplay } = data);    
    
    // Document title logic
    $: documentTitle = (() => {
        if (initialQuery?.trim()) {
            if (type && searchTypeDisplay) {
                return `Search ${searchTypeDisplay}: ${initialQuery} - moNobar`;
            }
            return `Search: ${initialQuery} - moNobar`;
        }
        return 'Search - moNobar';
    })();
    
    // Initialize query and activePrefix based on URL parameters
    let query = '';
    /** @type {string | null} */
    let activePrefix = null;
    
    $: {
        activePrefix = type || null;
        
        if (initialQuery) {
            if (type && initialQuery.includes(':')) {
                const colonIndex = initialQuery.indexOf(':');
                const prefixPart = initialQuery.substring(0, colonIndex);
                if (prefixPart === type) {
                    query = initialQuery.substring(colonIndex + 1);
                } else {
                    query = initialQuery;
                }
            } else {
                query = initialQuery;
            }
        } else {
            query = '';        
        }
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
    onMount(() => {
        if (browser && searchInputRef) {
            searchInputRef.focus();
        }
    });

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
            showLoading = false;        });
    }

    /**
     * @param {Event} e
     */    function handleInput(e) {
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
                    
                    if (searchInputRef) {
                        searchInputRef.value = newQuery;
                        searchInputRef.focus();
                        searchInputRef.setSelectionRange(newQuery.length, newQuery.length);
                    }
                    
                    return;
                }            }
            
            query = inputValue;
        }
    }

    /**
     * @param {Event} e
     */
    function handleSubmit(e) {
        e.preventDefault();
        performSearch();
    }    function performSearch() {
        if (!query.trim() && !activePrefix) return;
        
        let searchUrl;
        if (activePrefix) {
            searchUrl = buildSearchUrl(query, { type: activePrefix, includeExternal });
        } else {
            searchUrl = buildSearchUrl(query, { includeExternal });
        }
        
        goto(searchUrl);    }

    /**
     * @param {KeyboardEvent} e
     */    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            performSearch();
        } else if (e.key === 'Backspace' && activePrefix && query === '') {
            activePrefix = null;
            query = '';
        }
    }    function handlePrefixRemove() {
        activePrefix = null;
        if (searchInputRef) {
            searchInputRef.focus();
        }
    }
</script>

<svelte:head>
    <title>{documentTitle}</title>
</svelte:head>

<main class="min-h-screen pt-16 px-4">
<div class="w-full max-w-4xl mx-auto mt-24 px-8 min-h-screen">
    <h1 class="text-4xl font-extralight mb-8 text-white">search</h1>
    
    <form class="w-full flex flex-col gap-4" on:submit={handleSubmit}>        
        <div bind:this={searchContainerRef} class="relative flex items-center w-full">
            {#if activePrefix}
                <div class="absolute left-2 flex items-center gap-1 z-10">
                    <div class="bg-base-200 px-4 py-1 rounded-none text-sm flex items-center gap-2 shadow-sm">
                        {activePrefix}
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
                class="input input-bordered w-full {activePrefix ? 'pl-28' : ''}"
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
        
        {#if !activePrefix}
            <label class="flex items-center gap-2 cursor-pointer">
                <input
                    type="checkbox"
                    name="includeExternal"
                    value="true"
                    checked={includeExternal}
                    on:change={handleCheckbox}
                    class="checkbox"
                />
                <span class="label-text text-white">Online Lookup</span>
            </label>
        {/if}
        
        <button type="submit" class="btn btn-primary w-full text-inherit" disabled={isPending}>
            {#if isPending}
                <span class="flex items-center justify-center gap-2">
                    <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Loading
                </span>
            {:else}
                Search
            {/if}
        </button>
    </form>    
    <div class="mt-8">
        {#if error}
            <div class="flex justify-center items-center min-h-[300px]">
                <StopState errorCode={error} message="search is unavailable." />
            </div>        
        {:else if initialQuery && initialQuery.trim()}
            <div class="search-results py-8">
                <div class="mb-8">
                    <h2 class="text-3xl font-semibold text-white mb-2">
                        Search Results for "{initialQuery}"
                        {#if searchTypeDisplay}
                            <span class="text-gray-300 font-normal text-2xl">({searchTypeDisplay})</span>
                        {/if}
                    </h2>
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
                    {:else}
                     <LibraryViewDisplay 
                        viewMode="default_search"
                        data={results} 
                    />
                   {/if}
                {:else}
                    <div class="text-center py-12">
                        <StopState message="No results found for '{initialQuery}'" />                        
                    </div>
                {/if}
            </div>

        {/if}
    </div>
</div>
</main>

