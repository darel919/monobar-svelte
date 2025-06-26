// @ts-nocheck
import { dev } from '$app/environment';
import { APP_PATH, DEV_API_BASE_URL, PROD_API_BASE_URL } from '$env/static/private';
import { getBaseEnvironment } from '$lib/utils/environment.js';

const BASE_API_PATH = (() => {
    const path = APP_PATH;
    const endpoint = dev ? DEV_API_BASE_URL : PROD_API_BASE_URL;
    return `${endpoint}${path}`;
})();

export async function getHomeData(fetch, url) {
    // console.log('Fetching data from:', BASE_API_PATH);
    try {
        const response = await fetch(`${BASE_API_PATH}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'dp-Monobar',
                'X-Environment': getBaseEnvironment(url)
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
            data
        };
    } catch (error) {
        console.error('Failed to fetch data:', error);
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
export async function getItemInfoData(id, fetch, url) {
    // console.log('Fetching item data from:', BASE_API_PATH);
    if(!id) {
        return {
            data: null,
            error: 'ID is required'
        };
    }
    try {
        const response = await fetch(`${BASE_API_PATH}/watch?intent=info&id=${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'dp-Monobar',
                'X-Environment': getBaseEnvironment(url)
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return {
            data
        };
    } catch (error) {
        console.error('Failed to fetch data:', error);
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
export async function getItemWatchData(id, fetch, url) {
    // console.log('Fetching item watch data from:', BASE_API_PATH);
    if(!id) {
        return {
            data: null,
            error: 'ID is required'
        };
    }
    try {
        const response = await fetch(`${BASE_API_PATH}/watch?intent=play&id=${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'dp-Monobar',
                'X-Environment': getBaseEnvironment(url)
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return {
            data
        };
    } catch (error) {
        console.error('Failed to fetch data:', error);
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
export async function getLibraryData(id, fetch, url, options = {}) {
    // console.log('Fetching library data from:', BASE_API_PATH);
    if(!id) {
        return {
            data: null,
            error: 'ID is required'
        };
    }
    
    const params = new URLSearchParams();
    params.append('id', id);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    const query = params.toString();
    
    try {
        const response = await fetch(`${BASE_API_PATH}/library?${query}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'dp-Monobar',
                'X-Environment': getBaseEnvironment(url)
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return {
            data
        };
    } catch (error) {
        console.error('Failed to fetch data:', error);
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
export async function getLibraryTypeData(options = {}, fetch, url) {
    // console.log('Fetching library type data from:', BASE_API_PATH);
    const params = new URLSearchParams();
    if (options.id) params.append('id', options.id);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    const query = params.toString();
    
    try {
        const response = await fetch(`${BASE_API_PATH}/library/type?${query}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'dp-Monobar',
                'X-Environment': getBaseEnvironment(url)
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return {
            data
        };
    } catch (error) {
        console.error('Failed to fetch data:', error);
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
export async function getGenreData(options = {}, fetch, url) {
    // console.log('Fetching genre data from:', BASE_API_PATH);
    const params = new URLSearchParams();
    if (options.genreId) params.append('id', options.genreId);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    const query = params.toString();
    // console.log(query)
    
    try {
        const response = await fetch(`${BASE_API_PATH}/library/genre?${query}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'dp-Monobar',
                'X-Environment': getBaseEnvironment(url)
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return {
            data
        };
    } catch (error) {
        console.error('Failed to fetch data:', error);
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function searchData(query, type, includeExternal, fetch, url) {
    // console.log('Searching data from:', BASE_API_PATH);
    if (!query || !query.trim()) {
        return {
            data: [],
            error: null
        };
    }

    try {
        let searchUrl = `${BASE_API_PATH}/search?q=${encodeURIComponent(query.trim())}`;
        if (includeExternal) {
            searchUrl += `&includeExternal=true`;
        }
        if (type) {
            searchUrl += `&type=${encodeURIComponent(type)}`;
        }

        const response = await fetch(searchUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'dp-Monobar',
                'X-Environment': getBaseEnvironment(url)
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return {
            data
        };
    } catch (error) {
        console.error('Failed to search data:', error);
        return {
            data: [],
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}