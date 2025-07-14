import { getAssistData } from '$lib/server/api.js';

export async function load({ fetch, url, cookies }) {
    return {
        assistData: getAssistData(fetch, url, cookies)
    };
}
