import { json } from '@sveltejs/kit';
import { getLeftoversData } from '$lib/server/api.js';

export async function GET({ url, cookies, fetch }) {
    const result = await getLeftoversData(fetch, url, cookies);
    return json(result);
}
