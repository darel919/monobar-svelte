import { searchMovieRequests } from '$lib/server/api.js';
import { json } from '@sveltejs/kit';

export async function GET({ url, fetch, cookies }) {
    const query = url.searchParams.get('q') || '';
    
    // Return empty array for empty queries to prevent crashes
    if (!query.trim()) {
        return json([]);
    }
    
    try {
        const { data, error } = await searchMovieRequests(query, fetch, url, cookies);
        
        if (error) {
            console.warn('Movie request search error:', error);
            // Return empty array instead of error to prevent crashes
            return json([]);
        }
        
        // Ensure we always return an array
        return json(Array.isArray(data) ? data : []);
    } catch (error) {
        console.error('Movie request search API error:', error);
        // Return empty array instead of error to prevent crashes
        return json([]);
    }
}
