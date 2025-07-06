import { getHomeData, getLeftoversData, getHomeRecommendationData, getHomeNextEpisodeData } from '$lib/server/api.js';

export async function load({ fetch, url, cookies }) {
    return {
        serverData: getHomeData(fetch, url, cookies),
        leftoversData: getLeftoversData(fetch, url, cookies),
        nextEpisodesData: getHomeNextEpisodeData(fetch, url, cookies),
        recommendationData: getHomeRecommendationData(fetch, url, cookies)
    };
}