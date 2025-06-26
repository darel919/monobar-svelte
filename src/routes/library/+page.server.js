import { getLibraryData, getLibraryTypeData, getGenreData } from '$lib/server/api.js';

export async function load({ url, fetch, cookies }) {
    const id = url.searchParams.get('id');
    const sortBy = url.searchParams.get('sortBy') || cookies.get('librarySortBy') || "ProductionYear";
    const sortOrder = url.searchParams.get('sortOrder') || cookies.get('librarySortOrder') || "desc";
    const type = url.searchParams.get('type') || null;
    console.log('Loading library data for ID:', id);
    if(!type) {
        const options = {
            sortBy,
            sortOrder
        };
        const serverData = await getLibraryData(id, fetch, url, options, cookies);  
        return {
            serverData,
            sortBy,
            sortOrder,
            id
        };
    } else {
        let serverData;
        if (type === 'genre') {
            const options = {
                genreId: id,
                sortBy,
                sortOrder
            };
            serverData = await getGenreData(options, fetch, url, cookies);
        } else {
            const options = {
                id,
                sortBy,
                sortOrder
            };
            serverData = await getLibraryTypeData(options, fetch, url, cookies);
        }
        
        return {
            serverData,
            sortBy,
            sortOrder,
            id
        };
    }
}