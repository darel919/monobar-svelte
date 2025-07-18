import { getHomeData, getLeftoversData } from '$lib/server/api.js';

export async function load({ fetch, url, cookies }) {
    // Call AI availability check, but do not pass result to client
    return {
        serverData: getHomeData(fetch, url, cookies),
        leftoversData: getLeftoversData(fetch, url, cookies)
    };
}