import { getMovieRequestData, getMovieRequestWaitingListData } from '$lib/server/api.js';

export async function load({ fetch, url, cookies }) {
    return {
        movieRequestData: getMovieRequestData(fetch, url, cookies),
        movieRequestWaitingListData: getMovieRequestWaitingListData(fetch, url, cookies)
    };
}