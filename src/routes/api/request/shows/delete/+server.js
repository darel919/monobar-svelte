import { deleteShowSeries } from '$lib/server/api.js';
import { json } from '@sveltejs/kit';

export async function DELETE({ url, fetch, cookies }) {
    const seriesId = url.searchParams.get('id');
    const deleteFiles = url.searchParams.get('deleteFiles') === 'true';
    
    if (!seriesId) {
        return json({ error: 'Series ID is required' }, { status: 400 });
    }
    
    try {
        const result = await deleteShowSeries(seriesId, deleteFiles, fetch, url, cookies);
        
        if (result.success) {
            return json({ success: true });
        } else {
            return json({ error: result.error || 'Unknown error' }, { status: 400 });
        }
    } catch (error) {
        console.error('Delete TV series API error:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}
