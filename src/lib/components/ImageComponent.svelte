<!--
@component
Simple Image Component for handling image loading with error states, cookies, and custom headers

Props:
- src: Image source URL (can be null)
- alt (required): Alt text for accessibility  
- loading: 'lazy' | 'eager' (defaults to 'lazy')
- aspectRatio: CSS aspect ratio string (defaults to '16/9')
- borderRadius: CSS class for border radius (defaults to 'rounded-lg')
- withCredentials: Include cookies in cross-origin requests (defaults to false)
- headers: Custom HTTP headers for the request (defaults to {})
- showSkeleton: Show loading skeleton animation (defaults to true)
- onload: Callback function called when image loads successfully
- onerror: Callback function called when image fails to load
-->

<script lang="ts">
    import { onDestroy } from 'svelte';
    import { page } from '$app/state';
    import { getBaseEnvironment } from '$lib/utils/environment.js';
    
    export let src: string | null = null;
    export let alt: string;
    export let loading: 'lazy' | 'eager' = 'lazy';    
    export let aspectRatio: string = '16/9';
    export let borderRadius: string = 'rounded-lg';
    export let containerClass: string = '';
    export let imageClass: string = '';    
    export let withCredentials: boolean = false;
    export let headers: { [key: string]: string } = {};
    export let showSkeleton: boolean = true;
    export let onload: (() => void) | undefined = undefined;
    export let onerror: (() => void) | undefined = undefined;
    
    let isLoaded = false;
    let hasError = false;
    let imageUrl: string | null = null;
    
    $: {
        if (src) {
            loadImageWithCredentials();
        } else {
            imageUrl = null;
            isLoaded = false;
            hasError = false;        
        }
    }
    
    async function loadImageWithCredentials() {
        if (!src) return;
        
        try {
            if (withCredentials || Object.keys(headers).length > 0) {
                const fetchOptions: RequestInit = {
                    headers: {
                        ...headers
                    }
                };
                
                if (withCredentials) {
                    fetchOptions.credentials = 'include';
                }
                
                const response = await fetch(src, fetchOptions);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const blob = await response.blob();
                imageUrl = URL.createObjectURL(blob);
            } else {
                const response = await fetch(src, {
                    headers: {
                        // 'X-Environment': getBaseEnvironment(page.url)
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const blob = await response.blob();
                imageUrl = URL.createObjectURL(blob);
            }
        } catch (error) {
            console.error('Failed to load image:', error);            
            hasError = true;
            isLoaded = true;
            onerror?.();
        }
    }
    
    function handleLoad() {
        isLoaded = true;
        hasError = false;
        onload?.();
    }
    
    function handleError() {
        isLoaded = true;
        hasError = true;
        onerror?.();
    }
      function cleanup() {
        if (imageUrl && imageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(imageUrl);
        }
    }
    
    onDestroy(() => {
        cleanup();
    });
</script>

<div class="relative w-full h-full" style="aspect-ratio: {aspectRatio};">
    {#if showSkeleton && !isLoaded}
        <div class="skeleton absolute inset-0 w-full h-full {borderRadius} opacity-100 transition-opacity"></div>
    {/if}
    
    {#if imageUrl && !hasError}
        <img
            src={imageUrl}
            {alt}
            {loading}
            class="w-full h-full object-cover {borderRadius} transition-opacity duration-200 {isLoaded && !hasError ? 'opacity-100' : 'opacity-0'}"
            on:load={handleLoad}
            on:error={handleError}
        />
    {/if}
</div>
