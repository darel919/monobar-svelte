import { getItemInfoData } from '$lib/server/api.js';

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
    const serverData = await getItemInfoData(id, fetch, url, cookies);
    
    return {
        serverData,
        id,
        type
    };
}
