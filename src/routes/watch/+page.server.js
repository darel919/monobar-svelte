import { getItemWatchData, getItemInfoData } from '$lib/server/api.js';

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

    const serverData = await getItemWatchData(id, fetch, url, cookies);
    // Optionally, fetch seriesData for Series/Episode types
    let seriesData = null;
    if ((type === 'Series' || type === 'Episode') && seriesId) {
        seriesData = await getItemInfoData(seriesId, fetch, url, cookies);
    }
    return {
        serverData,
        id,
        type,
        seriesData: seriesData ? seriesData.data : null
    };
}
