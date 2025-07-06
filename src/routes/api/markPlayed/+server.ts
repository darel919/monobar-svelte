import { json } from '@sveltejs/kit';
import { markPlayed } from '$lib/server/api.js';

export async function POST({ url, request, cookies, fetch }) {
    const { id } = await request.json();
    if (!id) {
        return json({ success: false, error: 'ID is required' }, { status: 400 });
    }
    const result = await markPlayed(id, fetch, url, cookies);
    if (result.success) {
        return json({ success: true });
    } else {
        return json({ success: false, error: result.error || 'Failed' }, { status: 500 });
    }
}
