import { searchShowsRequests } from '$lib/server/api.js';
import { json } from '@sveltejs/kit';

export async function GET({ url, fetch, cookies }) {
    const query = url.searchParams.get('q') || '';
    
    try {
        const { data, error } = await searchShowsRequests(query, fetch, url, cookies);
        
        if (error) {
            return json({ error }, { status: 400 });
        }
        
        return json(data || []);
    } catch (error) {
        console.error('Shows request search API error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}
