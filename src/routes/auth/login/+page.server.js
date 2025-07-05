import { redirect } from '@sveltejs/kit';
import { getAuthorizationHeader } from '$lib/utils/authUtils.js';

export async function load({ cookies, url }) {
    // Check if user is already authenticated
    const authHeader = getAuthorizationHeader(cookies);
    
    if (authHeader) {
        // User is authenticated, redirect to home or saved redirect path
        const redirectAfterAuth = url.searchParams.get('redirect') || '/';
        throw redirect(302, redirectAfterAuth);
    }
    
    // User is not authenticated, allow access to login page
    return {};
}
