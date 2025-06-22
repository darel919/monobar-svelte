import { getItemInfoData } from '$lib/server/api.js';

export async function load({ url, fetch }) {
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type');
    
    console.log('Loading info data for ID:', id, 'Type:', type);
    
    if (!id) {
        return {
            serverData: {
                data: null,
                error: 'ID parameter is required'
            }
        };
    }
    
    const serverData = await getItemInfoData(id, fetch);
    
    return {
        serverData,
        id,
        type
    };
}
