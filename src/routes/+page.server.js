import { getHomeData, getLeftoversData } from '$lib/server/api.js';

export async function load({ fetch, url, cookies }) {
    return {
        serverData: getHomeData(fetch, url, cookies),
        leftoversData: getLeftoversData(fetch, url, cookies),
    };
}