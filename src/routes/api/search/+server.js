import { json } from '@sveltejs/kit';
import { searchData } from '$lib/server/api.js';

export async function GET({ url, fetch }) {
    const query = url.searchParams.get('q');
    const type = url.searchParams.get('type');
    
    if (!query || !query.trim()) {
        return json([]);
    }
    
    try {
        const result = await searchData(query, type, false, fetch, url);
        return json(result.data || []);
    } catch (error) {
        console.error('Search API error:', error);
        return json([]);
    }
}
