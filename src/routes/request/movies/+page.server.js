import { getMovieRequestWaitingListData } from '$lib/server/api.js';

export async function load({ fetch, url, cookies }) {
    return {
        movieRequestWaitingListData: getMovieRequestWaitingListData(fetch, url, cookies)
    };
}