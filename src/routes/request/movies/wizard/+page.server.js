// @ts-nocheck
import { searchMovieRequests, searchData } from '$lib/server/api.js';

export async function load({ url, fetch, cookies }) {
    const intent = url.searchParams.get('intent') || 'create';
    const id = url.searchParams.get('id');
    const tmdbId = url.searchParams.get('tmdbId');
    const imdbId = url.searchParams.get('imdbId');
    
    if (!id) {
        throw new Error('Missing required parameter: id');
    }

    let movieData = null;
    
    try {
        if (intent === 'create') {
            // First, try the movie request search using the ID as search term
            console.log('Searching for movie with ID:', id);
            let searchResult = await searchMovieRequests(id, fetch, url, cookies);
            console.log('Movie request search result:', searchResult);
            
            // If no results from movie request search, try general search with external results
            if (!searchResult.data || searchResult.data.length === 0) {
                console.log('No results from movie request search, trying general search...');
                searchResult = await searchData(id, 'request_movies', true, fetch, url, cookies);
                console.log('General search result:', searchResult);
            }
            
            if (searchResult.data && searchResult.data.length > 0) {
                console.log('Found search results, looking for match with ID:', id);
                // Try to find exact match first
                movieData = searchResult.data.find((item) => {
                    console.log('Checking item:', { id: item.id, imdbId: item.imdbId, tmdbId: item.tmdbId, name: item.Name || item.name });
                    return item.id === id || 
                           item.tmdbId?.toString() === id ||
                           item.tmdbId?.toString() === tmdbId || 
                           item.imdbId === id ||
                           item.imdbId === imdbId;
                });
                
                // If no exact match, use the first result
                if (!movieData) {
                    console.log('No exact match found, using first result');
                    movieData = searchResult.data[0];
                }
                console.log('Final movieData selected:', movieData);
            } else {
                console.log('No search results found');
            }
            
            // Don't create fallback data - let movieData be null if no results found
        }
        // Note: Movies typically don't have an 'update' mode like TV shows
        // since they don't have seasons to manage
    } catch (error) {
        console.error('Failed to load movie data:', error);
        // Don't create fallback data on error either
    }

    return {
        intent,
        id,
        tmdbId,
        imdbId,
        movieData
    };
}
