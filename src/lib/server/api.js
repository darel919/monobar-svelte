import { dev } from '$app/environment';
import { APP_PATH, DEV_API_BASE_URL, PROD_API_BASE_URL } from '$env/static/private';

const BASE_API_PATH = (() => {
    const path = APP_PATH;
    const endpoint = dev ? DEV_API_BASE_URL : PROD_API_BASE_URL;
    // const endpoint = PROD_API_BASE_URL;
    return `${endpoint}${path}`;
})();

export async function getServerData(fetch) {
    console.log('Fetching data from:', BASE_API_PATH);
    try {
        const response = await fetch(`${BASE_API_PATH}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'dp-Monobar',
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