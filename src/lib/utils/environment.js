<<<<<<< HEAD
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
    
    // Debug log in development and console
    if (typeof console !== 'undefined') {
        console.log('🌍 Environment detection:', { hostname, url: url instanceof URL ? url.href : url });
    }

    if (hostname.includes('10.10.10.')) {
        console.log('🌍 Environment: development (IP)');
        return 'development';
    }
    
    // Ensure ANY .darelisme.my.id domain (including subdomains) gets production environment
    if (hostname.includes('darelisme.my.id') || hostname.endsWith('.darelisme.my.id')) {
        console.log('🌍 Environment: production (darelisme.my.id)');
        return 'production';
    }
    
    if (hostname.includes('server.drl')) {
        console.log('🌍 Environment: production_local (server.drl)');
        return 'production_local';
    }
    
    console.log('🌍 Environment: production (default)');
    return 'production';
}
=======
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
>>>>>>> 539b80a (reinit)
