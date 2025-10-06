<<<<<<< HEAD
import { getHomeData } from '$lib/server/api.js';

export async function load({ fetch, url, cookies, route }) {
    // Only load homeData for routes that actually need it (home and library pages)
    const needsHomeData = route.id === '/' || route.id?.startsWith('/library');
    
    if (needsHomeData) {
        const homeData = await getHomeData(fetch, url, cookies);
        return {
            homeData: homeData?.data || []
        };
    }
    
    return {
        homeData: []
    };
}
=======
import { getHomeData } from '$lib/server/api.js';

export async function load({ fetch, url, cookies }) {
    const homeData = await getHomeData(fetch, url, cookies);
    
    return {
        homeData: homeData?.data || []
    };
}
>>>>>>> 539b80a (reinit)
