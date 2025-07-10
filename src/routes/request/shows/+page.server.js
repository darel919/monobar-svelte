import { getShowsRequestWaitingListData } from '$lib/server/api.js';

export async function load({ fetch, url, cookies }) {
    return {
        showsRequestWaitingListData: getShowsRequestWaitingListData(fetch, url, cookies)
    };
}