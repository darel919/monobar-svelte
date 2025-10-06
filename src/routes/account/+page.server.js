import { getWatchedStatsData } from '$lib/server/api.js';

export async function load({ fetch, url, cookies }) {
    return {
        watchedStats: getWatchedStatsData(fetch, url, cookies)
    };
}
