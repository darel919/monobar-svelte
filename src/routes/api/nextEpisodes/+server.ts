import { json } from '@sveltejs/kit';
import { getHomeNextEpisodeData } from '$lib/server/api.js';

export async function GET({ url, cookies, fetch }) {
    const result = await getHomeNextEpisodeData(fetch, url, cookies);
    return json(result);
}
