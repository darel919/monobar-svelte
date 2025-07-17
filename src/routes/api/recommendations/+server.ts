import { json } from '@sveltejs/kit';
import { getHomeRecommendationData } from '$lib/server/api.js';

export async function GET({ url, cookies, fetch }) {
    const result = await getHomeRecommendationData(fetch, url, cookies);
    return json(result);
}
