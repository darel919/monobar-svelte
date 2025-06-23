import { getHomeData } from '$lib/server/api.js';

export async function load({ fetch, url }) {
    const serverData = await getHomeData(fetch, url);
    
    return {
        serverData
    };
}