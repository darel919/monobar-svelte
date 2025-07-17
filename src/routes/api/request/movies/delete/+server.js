import { deleteMovie } from '$lib/server/api.js';
import { json } from '@sveltejs/kit';

export async function DELETE({ url, fetch, cookies }) {
    const movieId = url.searchParams.get('id');
    const deleteFiles = url.searchParams.get('deleteFiles') === 'true';
    
    if (!movieId) {
        return json({ error: 'Movie ID is required' }, { status: 400 });
    }
    
    try {
        const result = await deleteMovie(movieId, deleteFiles, fetch, url, cookies);
        
        if (result.success) {
            return json({ success: true });
        } else {
            return json({ error: result.error || 'Unknown error' }, { status: 400 });
        }
    } catch (error) {
        console.error('Delete movie API error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}
