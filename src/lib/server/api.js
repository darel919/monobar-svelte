// @ts-nocheck
import { dev } from '$app/environment';
import { PUBLIC_APP_PATH, PUBLIC_DEV_API_BASE_URL, PUBLIC_PROD_API_BASE_URL } from '$env/static/public';
import { getBaseEnvironment } from '$lib/utils/environment.js';
import { getAuthorizationHeader, getSessionHeaders } from '$lib/utils/authUtils';

export const BASE_API_PATH = (() => {
    const path = PUBLIC_APP_PATH;
    const endpoint = PUBLIC_DEV_API_BASE_URL;
    return `${endpoint}${path}`;
})();

export async function getHomeData(fetch, url, cookies) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'dp-Monobar',
            'X-Environment': getBaseEnvironment(url),
            ...getSessionHeaders(cookies)
        };
        
        const response = await fetch(`${BASE_API_PATH}`, {
            method: 'GET',
            headers
        });

        // console.log(headers)
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(JSON.stringify({ status: response.status, statusText: response.statusText, ...errorData }));
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
export async function getHomeRecommendationData(fetch, url, cookies) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'dp-Monobar',
            'X-Origin-Id': 'home',
            'X-Environment': getBaseEnvironment(url),
            ...getSessionHeaders(cookies)
        };
        
        const response = await fetch(`${BASE_API_PATH}/recommendation`, {
            method: 'GET',
            headers
        });

        // console.log(headers)
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(JSON.stringify({ status: response.status, statusText: response.statusText, ...errorData }));
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
export async function getLeftoversData(fetch, url, cookies) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'dp-Monobar',
            'X-Environment': getBaseEnvironment(url),
            ...getSessionHeaders(cookies)
        };
        
        const response = await fetch(`${BASE_API_PATH}/resumeWatching`, {
            method: 'GET',
            headers
        });

        // console.log(headers)
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(JSON.stringify({ status: response.status, statusText: response.statusText, ...errorData }));
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
export async function getHomeNextEpisodeData(fetch, url, cookies) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'dp-Monobar',
            'X-Environment': getBaseEnvironment(url),
            ...getSessionHeaders(cookies)
        };
        
        const response = await fetch(`${BASE_API_PATH}/continueWatching`, {
            method: 'GET',
            headers
        });

        // console.log(headers)
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(JSON.stringify({ status: response.status, statusText: response.statusText, ...errorData }));
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
export async function getItemInfoData(id, fetch, url, cookies) {
    if(!id) {
        return {
            data: null,
            error: 'ID is required'
        };
    }
    try {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'dp-Monobar',
            'X-Environment': getBaseEnvironment(url),
            ...getSessionHeaders(cookies)
        };
        
        const response = await fetch(`${BASE_API_PATH}/watch?intent=info&id=${id}`, {
            method: 'GET',
            headers
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(JSON.stringify({ status: response.status, statusText: response.statusText, ...errorData }));
        }
        
        const data = await response.json();


        return {
            data
        };
    } catch (error) {
        console.error('Failed to fetch data:', error);
        
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            try {
                const parsedError = JSON.parse(error.message);
                errorMessage = parsedError.error || parsedError.message || parsedError.error || error.message;
            } catch {
                errorMessage = error.message;
            }
        }
        
        return {
            data: null,
            error: errorMessage
        };
    }
}
export async function getItemWatchData(id, fetch, url, cookies) {
    if(!id) {
        return {
            data: null,
            error: 'ID is required'
        };
    }
    try {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'dp-Monobar',
            'X-Environment': getBaseEnvironment(url),
            ...await getSessionHeaders(cookies)
        };
        
        const response = await fetch(`${BASE_API_PATH}/watch?intent=play&id=${id}`, {
            method: 'GET',
            headers
        });
        // console.log(response)
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(JSON.stringify({ status: response.status, statusText: response.statusText, ...errorData }));
        }
        
        const data = await response.json();

                // console.log('Item Info Data:', data);
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
export async function getLibraryData(id, fetch, url, options = {}, cookies) {
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
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'dp-Monobar',
            'X-Environment': getBaseEnvironment(url),
            ...getSessionHeaders(cookies)
        };
        
        const response = await fetch(`${BASE_API_PATH}/library?${query}`, {
            method: 'GET',
            headers
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(JSON.stringify({ status: response.status, statusText: response.statusText, ...errorData }));
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
export async function getLibraryTypeData(options = {}, fetch, url, cookies) {
    const params = new URLSearchParams();
    if (options.id) params.append('id', options.id);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    const query = params.toString();
    
    try {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'dp-Monobar',
            'X-Environment': getBaseEnvironment(url),
            ...getSessionHeaders(cookies)
        };
        
        const response = await fetch(`${BASE_API_PATH}/library/type?${query}`, {
            method: 'GET',
            headers
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(JSON.stringify({ status: response.status, statusText: response.statusText, ...errorData }));
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
export async function getGenreData(options = {}, fetch, url, cookies) {
    const params = new URLSearchParams();
    if (options.genreId) params.append('id', options.genreId);
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);
    const query = params.toString();
    
    try {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'dp-Monobar',
            'X-Environment': getBaseEnvironment(url),
            ...getSessionHeaders(cookies)
        };
        
        const response = await fetch(`${BASE_API_PATH}/library/genre?${query}`, {
            method: 'GET',
            headers
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(JSON.stringify({ status: response.status, statusText: response.statusText, ...errorData }));
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

export async function searchData(query, type, includeExternal, fetch, url, cookies) {
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

        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'dp-Monobar',
            'X-Environment': getBaseEnvironment(url),
            ...getSessionHeaders(cookies)
        };

        const response = await fetch(searchUrl, {
            method: 'GET',
            headers
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(JSON.stringify({ status: response.status, statusText: response.statusText, ...errorData }));
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
export async function getRecommendationData(id, fetch, url, cookies) {
    if(!id) {
        return {
            data: null,
            error: 'ID is required'
        };
    }
    try {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'dp-Monobar',
            'X-Environment': getBaseEnvironment(url),
            'X-Origin-Id': id,
            ...getSessionHeaders(cookies)
        };
        
        const response = await fetch(`${BASE_API_PATH}/recommendation`, {
            method: 'GET',
            headers
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(JSON.stringify({ status: response.status, statusText: response.statusText, ...errorData }));
        }
        
        const data = await response.json();

        return {
            data
        };
    } catch (error) {
        console.error('Failed to fetch recommendation data:', error);
        
        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
            try {
                const parsedError = JSON.parse(error.message);
                errorMessage = parsedError.error || parsedError.message || parsedError.error || error.message;
            } catch {
                errorMessage = error.message;
            }
        }
        
        return {
            data: null,
            error: errorMessage
        };
    }
}
export async function getChangelog(fetch) {
    try {
        const response = await fetch(`${BASE_API_PATH}/changes`);
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(JSON.stringify({ status: response.status, statusText: response.statusText, error: errorData }));
        }
        const data = await response.json();
        if (Array.isArray(data)) {
            return { data };
        } else {
            return {
                data: [],
                error: 'Malformed changelog data: expected an array.'
            };
        }
    } catch (error) {
        console.error('Failed to fetch changelog:', error);
        return {
            data: [],
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
export async function markPlayed(id, fetch, url, cookies) {
    if (!id) {
        return { success: false, error: 'ID is required' };
    }
    try {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'dp-Monobar',
            'X-Environment': getBaseEnvironment(url),
            ...getSessionHeaders(cookies)
        };
        const response = await fetch(`${BASE_API_PATH}/markPlayed?id=${encodeURIComponent(id)}`, {
            method: 'POST',
            headers
        });
        if (response.status === 200) {
            return { success: true };
        } else {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            return { success: false, error: errorData.message || 'Failed to mark as watched' };
        }
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}


// REQUESTS
// MOVIES
export async function getMovieRequestData(fetch, url, cookies) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'dp-Monobar',
            'X-Environment': getBaseEnvironment(url),
            ...getSessionHeaders(cookies)
        };
        
        const response = await fetch(`${BASE_API_PATH}/request/movies`, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(JSON.stringify({ status: response.status, statusText: response.statusText, ...errorData }));
        }
        
        const data = await response.json();
        
        return {
            data
        };
    } catch (error) {
        console.error('Failed to fetch movie request data:', error);
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
export async function getMovieRequestWaitingListData(fetch, url, cookies) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'dp-Monobar',
            'X-Environment': getBaseEnvironment(url),
            ...getSessionHeaders(cookies)
        };
        
        const response = await fetch(`${BASE_API_PATH}/request/movies/waitingList`, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(JSON.stringify({ status: response.status, statusText: response.statusText, ...errorData }));
        }
        
        const data = await response.json();
        
        return {
            data
        };
    } catch (error) {
        console.error('Failed to fetch movie request data:', error);
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}



// SHOWS
export async function getShowsRequestData(fetch, url, cookies) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'dp-Monobar',
            'X-Environment': getBaseEnvironment(url),
            ...getSessionHeaders(cookies)
        };
        
        const response = await fetch(`${BASE_API_PATH}/request/shows`, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(JSON.stringify({ status: response.status, statusText: response.statusText, ...errorData }));
        }
        
        const data = await response.json();
        
        return {
            data
        };
    } catch (error) {
        console.error('Failed to fetch shows request data:', error);
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
export async function getShowsRequestWaitingListData(fetch, url, cookies) {
    try {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'dp-Monobar',
            'X-Environment': getBaseEnvironment(url),
            ...getSessionHeaders(cookies)
        };
        
        const response = await fetch(`${BASE_API_PATH}/request/shows/waitingList`, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(JSON.stringify({ status: response.status, statusText: response.statusText, ...errorData }));
        }
        
        const data = await response.json();
        
        return {
            data
        };
    } catch (error) {
        console.error('Failed to fetch shows request data:', error);
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}