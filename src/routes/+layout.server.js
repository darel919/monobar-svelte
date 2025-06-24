import { getHomeData } from '$lib/server/api.js';

export async function load({ fetch, url }) {
    const homeData = await getHomeData(fetch, url);
    
    return {
        homeData: homeData?.data || []
    };
}
