/**
 * Set a cookie with the given name, value, and options
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {{ path?: string, expires?: Date | number, domain?: string, secure?: boolean, sameSite?: string }} options - Cookie options
 */
export function setCrossDomainDocumentCookie(name, value, options = {}) {
    if (typeof document === 'undefined') return;
    
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    
    if (options.path) {
        cookieString += `; Path=${options.path}`;
    }
    
    if (options.expires) {
        if (options.expires instanceof Date) {
            cookieString += `; Expires=${options.expires.toUTCString()}`;
        } else if (typeof options.expires === 'number') {
            const date = new Date();
            date.setTime(date.getTime() + options.expires * 24 * 60 * 60 * 1000);
            cookieString += `; Expires=${date.toUTCString()}`;
        }
    }
    
    if (options.domain) {
        cookieString += `; Domain=${options.domain}`;
    }
    
    if (options.secure) {
        cookieString += `; Secure`;
    }
    
    if (options.sameSite) {
        cookieString += `; SameSite=${options.sameSite}`;
    }
    
    document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} - Cookie value or null if not found
 */
export function getCookie(name) {
    if (typeof document === 'undefined') return null;
    
    const nameEQ = encodeURIComponent(name) + '=';
    const cookies = document.cookie.split(';');
    
    for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.indexOf(nameEQ) === 0) {
            return decodeURIComponent(cookie.substring(nameEQ.length));
        }
    }
    
    return null;
}
