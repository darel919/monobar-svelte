import { dev } from '$app/environment';
import { browser } from '$app/environment';
import { 
    PUBLIC_DEV_API_BASE_URL,
    PUBLIC_PROD_API_BASE_URL,
    PUBLIC_APP_PATH,
    PUBLIC_APP_AUTH_PATH
} from '$env/static/public';

export const BASE_API_PATH = (() => {
    if (dev) {
        return `${PUBLIC_DEV_API_BASE_URL}${PUBLIC_APP_PATH}`;
    }
    
    if (!browser) {
        return `${PUBLIC_PROD_API_BASE_URL}${PUBLIC_APP_PATH}`;
    }
    
    const hostname = window.location.hostname;
    
    if (hostname.includes('10.10.10.') || hostname.includes('server.drl')) {
        return `${PUBLIC_DEV_API_BASE_URL}${PUBLIC_APP_PATH}`;
    }
    
    if (hostname.includes('darelisme.my.id')) {
        return `${PUBLIC_PROD_API_BASE_URL}${PUBLIC_APP_PATH}`;
    }
    
    return `${PUBLIC_PROD_API_BASE_URL}${PUBLIC_APP_PATH}`;
})();
export const BASE_API_AUTH_PATH = (() => {
    if (dev) {
        return `${PUBLIC_DEV_API_BASE_URL}${PUBLIC_APP_AUTH_PATH}`;
    }
    
    if (!browser) {
        return `${PUBLIC_PROD_API_BASE_URL}${PUBLIC_APP_AUTH_PATH}`;
    }
    
    const hostname = window.location.hostname;
    
    if (hostname.includes('10.10.10.') || hostname.includes('server.drl')) {
        return `${PUBLIC_DEV_API_BASE_URL}${PUBLIC_APP_AUTH_PATH}`;
    }
    
    if (hostname.includes('darelisme.my.id')) {
        return `${PUBLIC_PROD_API_BASE_URL}${PUBLIC_APP_AUTH_PATH}`;
    }
    
    return `${PUBLIC_PROD_API_BASE_URL}${PUBLIC_APP_AUTH_PATH}`;
})();
