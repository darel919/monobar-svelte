import { getLibraryData, getLibraryTypeData, getGenreData } from '$lib/server/api.js';

export async function load({ url, fetch, cookies }) {
    const id = url.searchParams.get('id');
    const sortBy = url.searchParams.get('sortBy') || cookies.get('librarySortBy') || "ProductionYear";
    const sortOrder = url.searchParams.get('sortOrder') || cookies.get('librarySortOrder') || "desc";
    const type = url.searchParams.get('type') || null;
    
    if(!type) {
        const options = {
            sortBy,
            sortOrder
        };
        
        return {
            serverData: getLibraryData(id, fetch, url, options, cookies),
            sortBy,
            sortOrder,
            id
        };
    } else {
        let serverDataPromise;
        if (type === 'genre') {
            const options = {
                genreId: id,
                sortBy,
                sortOrder
            };
            serverDataPromise = getGenreData(options, fetch, url, cookies);
        } else {
            const options = {
                id,
                sortBy,
                sortOrder
            };
            serverDataPromise = getLibraryTypeData(options, fetch, url, cookies);
        }
        
        return {
            serverData: serverDataPromise,
            sortBy,
            sortOrder,
            id
        };
    }
}