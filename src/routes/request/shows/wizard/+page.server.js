// @ts-nocheck
import { searchShowsRequests, getShowsRequestDetailsData, getShowsRequestLibraryData } from '$lib/server/api.js';

export async function load({ url, fetch, cookies }) {
    const intent = url.searchParams.get('intent') || 'create';
    const id = url.searchParams.get('id');
    const tmdbId = url.searchParams.get('tmdbId');
    const imdbId = url.searchParams.get('imdbId');
    
    if (!id) {
        throw new Error('Missing required parameter: id');
    }

    let seriesData = null;
    let existingSeriesData = null;
    
    try {
        if (intent === 'create') {
            // For new series, search by ID to get series details
            const searchResult = await searchShowsRequests(id, fetch, url, cookies);
            if (searchResult.data && searchResult.data.length > 0) {
                seriesData = searchResult.data.find((item) => 
                    item.id === id || 
                    item.tmdbId?.toString() === tmdbId || 
                    item.imdbId === imdbId
                ) || searchResult.data[0];
            }
        } else if (intent === 'update') {
            // For updating existing series, get details
            const detailsResult = await getShowsRequestDetailsData(id, fetch, url, cookies);
            if (detailsResult.data) {
                existingSeriesData = detailsResult.data;
                seriesData = detailsResult.data;
            }
        }

        // If we're in create mode but the series already exists in library, 
        // we should try to get existing data and switch to update mode
        if (intent === 'create' && seriesData) {
            try {
                const libraryData = await getShowsRequestLibraryData(fetch, url, cookies);
                if (libraryData.data) {
                    const existingSeries = libraryData.data.find((item) =>
                        item.tmdbId?.toString() === seriesData.tmdbId?.toString() ||
                        item.imdbId === seriesData.imdbId ||
                        item.id === seriesData.id
                    );
                    
                    if (existingSeries) {
                        existingSeriesData = existingSeries;
                        // Keep the search data for display but mark that we have existing data
                    }
                }
            } catch (libraryError) {
                console.warn('Could not check library for existing series:', libraryError);
                // Continue with create flow if library check fails
            }
        }
    } catch (error) {
        console.error('Failed to load series data:', error);
    }

    return {
        intent,
        id,
        tmdbId,
        imdbId,
        seriesData,
        existingSeriesData
    };
}
