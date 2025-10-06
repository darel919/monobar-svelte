import { dev } from '$app/environment';

/**
 * @param {URL | { hostname?: string } | undefined} url
 * @returns {string}
 */
export function getBaseEnvironment(url) {
    if (dev) {
        return 'development';
    }
    
    const hostname = url?.hostname || '';

    if (hostname.includes('10.10.10.')) {
        return 'development';
    }
    
    if (hostname.includes('server.drl')) {
        return 'production_local';
    }
    
    if (hostname.includes('darelisme.my.id')) {
        return 'production';
    }
    
    return 'production';
}
