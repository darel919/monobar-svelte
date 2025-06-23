import { getLibraryData, getLibraryTypeData, getGenreData } from '$lib/server/api.js';

export async function load({ url, fetch }) {
    const id = url.searchParams.get('id');
    const sortBy = url.searchParams.get('sortBy');
    const sortOrder = url.searchParams.get('sortOrder');
    const type = url.searchParams.get('type') || null;
    console.log('Loading library data for ID:', id);
    if(!type) {
        const serverData = await getLibraryData(id, fetch, url);  
        return {
            serverData
        };
    } else {
        console.log('Type provided:', type);
        
        let serverData;
        if (type === 'genre') {
            // console.warn("Fetching genre data for ID:", id);
            const options = {
                genreId: id,
                sortBy,
                sortOrder
            };
            serverData = await getGenreData(options, fetch, url);
        } else {
            const options = {
                id,
                sortBy,
                sortOrder
            };
            serverData = await getLibraryTypeData(options, fetch, url);
        }
        
        return {
            serverData
        };
    }
}