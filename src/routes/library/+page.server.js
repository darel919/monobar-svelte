import { getLibraryData } from '$lib/server/api.js';

export async function load({ url, fetch }) {
    const id = url.searchParams.get('id');
    console.log('Loading library data for ID:', id);
    const serverData = await getLibraryData(id, fetch);
    
    return {
        serverData
    };
}