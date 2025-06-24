import { searchData, getLibraryData, getGenreData } from '$lib/server/api.js';
import { getSearchTypeDisplayName, parseSearchInput } from '$lib/utils/searchUtils.js';

export async function load({ url, fetch }) {
    const query = url.searchParams.get('q') || '';
    const typeParam = url.searchParams.get('type') || '';
    const includeExternal = url.searchParams.get('includeExternal') === 'true';
    const errorParam = url.searchParams.get('error');
    
    let type = typeParam;
    let parsedQuery = query;
    
    // If no separate type param, try parsing from query
    if (!type && query.includes(':')) {
        const parsed = parseSearchInput(query);
        type = parsed.type || '';
        parsedQuery = parsed.query;
    } else if (type && query.includes(':')) {
        // If we have a type param and query contains a colon, extract just the query part
        const colonIndex = query.indexOf(':');
        if (query.substring(0, colonIndex) === type) {
            parsedQuery = query.substring(colonIndex + 1);
        }
    }
    
    let results = [];
    let error = null;
    let onlineLookupError = false;

    if (errorParam === 'lookup' && !includeExternal) {
        onlineLookupError = true;
    } else if (query.trim()) {
        try {
            // Try using the dedicated search API first
            const searchResult = await searchData(parsedQuery || query, type, includeExternal, fetch, url);
            
            if (searchResult.data && searchResult.data.length > 0) {
                results = searchResult.data;
            } else if (type === 'genre') {
                // For genre searches, search through genres specifically
                const searchTerm = parsedQuery || query;
                const genreData = await getGenreData({}, fetch, url);
                if (genreData.data && Array.isArray(genreData.data)) {
                    results = genreData.data.filter(/** @param {any} genre */ genre => 
                        (genre.Name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (genre.SortName?.toLowerCase().includes(searchTerm.toLowerCase()))
                    );
                }
            } else {
                // Fallback for other search types
                const searchTerm = parsedQuery || query;
                const libraryData = await getLibraryData(null, fetch, url);
                if (libraryData.data && Array.isArray(libraryData.data)) {
                    results = libraryData.data.filter(/** @param {any} item */ item => 
                        (item.Name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (item.OriginalTitle?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (item.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        (item.name?.toLowerCase().includes(searchTerm.toLowerCase()))
                    );
                }
            }
            
            if (searchResult.error) {
                error = searchResult.error;
            }
        } catch (err) {
            error = err instanceof Error ? err.message : 'Unknown error occurred';
        }
    }

    const searchTypeDisplay = type ? getSearchTypeDisplayName(type) : null;

    return {
        query,
        type,
        includeExternal,
        results,
        error,
        onlineLookupError,
        searchTypeDisplay
    };
}