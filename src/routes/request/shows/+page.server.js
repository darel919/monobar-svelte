import { getShowsRequestData, getShowsRequestWaitingListData } from '$lib/server/api.js';

export async function load({ fetch, url, cookies }) {
    return {
        showsRequestData: getShowsRequestData(fetch, url, cookies),
        showsRequestWaitingListData: getShowsRequestWaitingListData(fetch, url, cookies)
    };
}