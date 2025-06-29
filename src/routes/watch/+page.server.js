import { getItemWatchData } from '$lib/server/api.js';

export async function load({ url, fetch, cookies }) {
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type');
    
    if (!id) {
        return {
            serverData: {
                data: null,
                error: 'ID parameter is required'
            }
        };
    }

    const serverData = await getItemWatchData(id, fetch, url, cookies);
    // console.log('Server Data:', serverData);
    return {
        serverData,
        id,
        type
    };
}
