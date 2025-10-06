import { getHomeData } from '$lib/server/api.js';

export async function load({ fetch, url, cookies }) {
    const homeData = await getHomeData(fetch, url, cookies);
    
    return {
        homeData: homeData?.data || []
    };
}
