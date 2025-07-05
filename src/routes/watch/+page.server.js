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

    const serverData = await getItemWatchData(id, fetch, url, cookies);
    
    // If authentication failed on the API side, return auth error
    if (serverData.error && (
        serverData.error.includes('401') || 
        serverData.error.includes('unauthorized') || 
        serverData.error.includes('forbidden')
    )) {
        return {
            serverData: {
                data: null,
                error: 'Authentication required to access this content.'
            },
            id,
            type,
            seriesData: null,
            requiresAuth: true
        };
    }
    
    // Optionally, fetch seriesData for Series/Episode types
    let seriesData = null;
    if ((type === 'Series' || type === 'Episode') && seriesId && isAuthenticated) {
        seriesData = await getItemInfoData(seriesId, fetch, url, cookies);
    }
    
    return {
        serverData,
        id,
        type,
        seriesData: seriesData ? seriesData.data : null
    };
}
