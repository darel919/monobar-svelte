import { getServerData } from '$lib/server/api.js';

export async function load({ fetch }) {
    const serverData = await getServerData(fetch);
    
    return {
        serverData
    };
}