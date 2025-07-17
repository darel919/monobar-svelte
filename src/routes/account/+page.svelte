<script lang="ts">
import { authStore } from '$lib/stores/authStore';
import { goto } from '$app/navigation';
import { onMount } from 'svelte';
import { BASE_API_PATH } from '$lib/config/api';
import { getSessionHeaders } from '$lib/utils/authUtils';
import { getBaseEnvironment } from '$lib/utils/environment';
import { page } from '$app/stores';

export let data;

let streamedText = '';
let isStreaming = false;
let streamError: string | null = null;
let streamStarted = false;
let watchedStatsPromise = data.watchedStats;

function handleSignOut() {
    authStore.logout();
    goto('/');
}

function getErrorMessage(error: string | null): string {
    if (!error) return 'An unknown error occurred.';
    
    // Parse JSON error if it exists
    try {
        const parsedError = JSON.parse(error);
        if (parsedError.status === 404 || error.includes('No watched items found')) {
            return "I need more data to analyze your viewing habits. Start watching some content and come back later!";
        }
        if (parsedError.status === 401 || parsedError.status === 403) {
            return "I don't have permission to access your viewing data right now.";
        }
        if (parsedError.status >= 500) {
            return "I'm having trouble connecting to my analysis engine. Please try again later.";
        }
    } catch {
        // If it's not JSON, check for common error patterns
        if (error.includes('No watched items found') || error.includes('No AI help')) {
            return "I need more data to analyze your viewing habits. Start watching some content and come back later!";
        }
        if (error.includes('unauthorized') || error.includes('forbidden')) {
            return "I don't have permission to access your viewing data right now.";
        }
        if (error.includes('network') || error.includes('fetch')) {
            return "I'm having trouble connecting right now. Please check your internet connection.";
        }
    }
    
    return "I'm having some technical difficulties analyzing your data. Please try again later.";
}

async function startAssistStream() {
    streamedText = '';
    isStreaming = true;
    streamError = null;
    streamStarted = false;
    try {
        const headers = {
            'Accept': 'text/event-stream',
            'User-Agent': 'dp-Monobar',
            'X-Environment': getBaseEnvironment($page.url),
            ...getSessionHeaders()
        };
        
        const response = await fetch(`${BASE_API_PATH}/assist/watched/summary`, {
            method: 'GET',
            headers
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error || errorMessage;
            } catch {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
        if (!response.body) {
            throw new Error('No response body');
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            if (!streamStarted && chunk.trim().length > 0) streamStarted = true;
            streamedText += chunk;
        }
    } catch (e: any) {
        streamError = e?.message || 'Unknown error';
    } finally {
        isStreaming = false;
    }
}

onMount(() => {
    if (typeof window !== 'undefined') {
        startAssistStream();
    }
});
</script>
<svelte:head>
    <title>your account - moNobar</title>
</svelte:head>

<section class=" max-w-5xl mx-auto px-4 sm:px-8 my-24">
    <h1 class="text-4xl font-extralight mb-6">your account</h1>
    {#if $authStore.isAuthenticated && $authStore.userSession?.user}
        <div class="flex items-center gap-6 mb-8 justify-between">
           <section class="flex items-center gap-6">
         {#if $authStore.userSession.user.user_metadata?.avatar_url || $authStore.userSession.user.user_metadata?.avatar}
                <img src={$authStore.userSession.user.user_metadata?.avatar_url || $authStore.userSession.user.user_metadata?.avatar} alt="Avatar" class="h-20 w-20 rounded-full object-cover border border-base-300 shadow" referrerpolicy="no-referrer" />
            {/if}
            <div>
                <div class="text-xl font-semibold">{$authStore.userSession.user.user_metadata?.full_name || $authStore.userSession.user.user_metadata?.name || $authStore.userSession.user.email}</div>
                <div class="text-base text-base-content/70">{$authStore.userSession.user.email}</div>
            </div>
                
        </section>

        <button class="btn btn-error btn-outline" on:click={handleSignOut}>Sign Out</button>
        </div>

        <!-- AI Assistant Card -->
        {#if isStreaming}
            {#if !streamStarted}
                <div class="card bg-base-200 shadow-xl mb-8">
                    <div class="card-body">
                        <div class="flex items-start gap-3 mb-4">
                            <div class="text-sm font-bold text-info bg-info/20 px-3 py-1 rounded-full animate-pulse">Darmono is thinking...</div>
                        </div>
                        <div class="mb-4 space-y-3">
                            <div class="skeleton h-6 w-full"></div>
                            <div class="skeleton h-6 w-4/5"></div>
                            <div class="skeleton h-6 w-3/5"></div>
                        </div>
                    </div>
                </div>
            {:else}
                <div class="card bg-base-200 shadow-xl mb-8">
                    <div class="card-body">
                        <div class="flex items-start gap-3 mb-4">
                            <div class="text-sm font-bold text-info bg-info/20 px-3 py-1 rounded-full">Darmono is thinking...</div>
                        </div>
                        <div class="mb-4 whitespace-pre-line text-lg leading-relaxed">{streamedText}</div>
                    </div>
                </div>
            {/if}
        {:else if streamedText}
            <div class="card bg-base-200 shadow-xl mb-8">
                <div class="card-body">
                    <div class="flex items-start gap-3 mb-4">
                        <div class="text-sm font-bold text-primary bg-primary/20 px-3 py-1 rounded-full">Darmono says:</div>
                    </div>
                    <div class="mb-4 whitespace-pre-line text-lg leading-relaxed">{streamedText}</div>
                </div>
            </div>
        {:else if streamError}
            <div class="card bg-base-200 shadow-xl mb-8">
                <div class="card-body">
                    <div class="flex items-start gap-3 mb-4">
                        <div class="text-sm font-bold text-error bg-error/20 px-3 py-1 rounded-full">Darmono says:</div>
                    </div>
                    <p class="text-error">{getErrorMessage(streamError)}</p>
                </div>
            </div>
        {:else}
            <div class="card bg-base-200 shadow-xl mb-8">
                <div class="card-body">
                    <div class="flex items-start gap-3 mb-4">
                        <div class="text-sm font-bold text-info bg-info/20 px-3 py-1 rounded-full animate-pulse">Darmono is thinking...</div>
                    </div>
                    <div class="mb-4 space-y-3">
                        <div class="skeleton h-6 w-full"></div>
                        <div class="skeleton h-6 w-4/5"></div>
                        <div class="skeleton h-6 w-3/5"></div>
                    </div>
                </div>
            </div>
        {/if}

        <!-- Watch History Statistics Card -->
        {#await watchedStatsPromise}
            <div class="card bg-base-200 shadow-xl mb-8">
                <div class="card-body">
                    <div class="flex items-start gap-3 mb-4">
                        <div class="text-sm font-bold text-info bg-info/20 px-3 py-1 rounded-full animate-pulse">Loading your watch history...</div>
                    </div>
                    <div class="mb-4 space-y-3">
                        <div class="skeleton h-6 w-full"></div>
                        <div class="skeleton h-6 w-4/5"></div>
                        <div class="skeleton h-6 w-3/5"></div>
                    </div>
                </div>
            </div>
        {:then watchedStatsRaw}
            {#if watchedStatsRaw && watchedStatsRaw.data}
                {@const watchedStats = watchedStatsRaw.data}
                <div class="card bg-base-200 shadow-xl mb-8">
                    <div class="card-body">
                        <div class="flex items-start gap-3 mb-4">
                            <div class="text-sm font-bold text-secondary bg-secondary/20 px-3 py-1 rounded-full">Your Watch History Stats</div>
                        </div>
                        <div class="mb-4 text-lg leading-relaxed">
                            <div><span class="font-semibold">Most Watched Genre:</span> {watchedStats.statistics?.mostWatchedGenre ?? 'N/A'}</div>
                            <div><span class="font-semibold">Average Rating:</span> {watchedStats.statistics?.averageRating?.toFixed(2) ?? 'N/A'}</div>
                            <div class="mt-4">
                                <span class="font-semibold">Recently Watched:</span>
                                <ul class="list list-disc list-inside daisy-list ml-0 mt-2">
                                    {#each watchedStats.watched as item (item.Id)}
                                        <li class="mb-1">
                                            <span class="font-medium">{item.Name}</span>
                                            <span class="text-base-content/60"> ({item.ProductionYear})</span>
                                            <span class="italic"> - {item.Genre?.join(', ')}</span>
                                        </li>
                                    {/each}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            {:else}
                <div class="card bg-base-200 shadow-xl mb-8">
                    <div class="card-body">
                        <div class="flex items-start gap-3 mb-4">
                            <div class="text-sm font-bold text-error bg-error/20 px-3 py-1 rounded-full">No watch history found.</div>
                        </div>
                    </div>
                </div>
            {/if}
        {/await}

    {:else}
        <div class="text-lg">You are not logged in.</div>
    {/if}
</section>
