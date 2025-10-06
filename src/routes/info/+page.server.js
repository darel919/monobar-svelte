import { getItemInfoData, getRecommendationData } from '$lib/server/api.js';

export async function load({ url, fetch, cookies }) {
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type');
    const episodeId = url.searchParams.get('episodeId');
    
    if (!id) {
        return {
            serverData: Promise.resolve({
                data: null,
                error: 'ID parameter is required'
            }),
            recommendationData: Promise.resolve({
                data: null,
                error: 'ID parameter is required'
            }),
            id,
            type,
            episodeId
        };
    }
    
    return {
        serverData: getItemInfoData(id, fetch, url, cookies),
        recommendationData: getRecommendationData(id, fetch, url, cookies),
        id,
        type,
        episodeId
    };
}
