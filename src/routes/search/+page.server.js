import { getSearchTypeDisplayName, parseSearchInput } from '$lib/utils/searchUtils.js';

export async function load({ url }) {
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
    
    let onlineLookupError = false;
    if (errorParam === 'lookup' && !includeExternal) {
        onlineLookupError = true;
    }

    const searchTypeDisplay = type ? getSearchTypeDisplayName(type) : null;

    return {
        query: parsedQuery || query,
        originalQuery: query,
        type,
        includeExternal,
        onlineLookupError,
        searchTypeDisplay
    };
}