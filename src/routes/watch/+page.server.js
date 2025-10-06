import { getItemWatchData, getItemInfoData } from '$lib/server/api.js';
import { getSessionHeaders } from '$lib/utils/authUtils';

export async function load({ url, fetch, cookies }) {
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type');
    const seriesId = url.searchParams.get('seriesId');
    
    if (!id) {
        return {
            serverData: {
                data: null,
                error: 'ID parameter is required'
            }
        };
    }

    // Check authentication status
    const sessionHeaders = getSessionHeaders(cookies);
    const isAuthenticated = !!(sessionHeaders['Authorization'] && sessionHeaders['X-Session-Id']);
    
    // If not authenticated, only allow Movie type
    if (!isAuthenticated && type !== 'Movie') {
        return {
            serverData: {
                data: null,
                error: `Authentication required. Only Movie content is available without authentication.`
            },
            id,
            type,
            seriesData: null,
            requiresAuth: true
        };
    }

    // Return promises instead of awaited data for faster page load
    const serverDataPromise = getItemWatchData(id, fetch, url, cookies);
    
    // Handle series data as promise too
    let seriesDataPromise = null;
    if ((type === 'Series' || type === 'Episode') && seriesId && isAuthenticated) {
        seriesDataPromise = getItemInfoData(seriesId, fetch, url, cookies);
    }
    
    return {
        serverData: serverDataPromise,
        seriesData: seriesDataPromise,
        id,
        type,
        requiresAuth: !isAuthenticated && type !== 'Movie'
    };
}
