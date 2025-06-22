import { getHomeData } from '$lib/server/api.js';

export async function load({ fetch }) {
    const serverData = await getHomeData(fetch);
    
    return {
        serverData
    };
}