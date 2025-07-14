<script lang="ts">
import { authStore } from '$lib/stores/authStore';
import { goto } from '$app/navigation';

interface AssistData {
    mostWatchedGenre: string;
    averageRating: number;
    explanation: string;
}

export let data: {
    assistData: Promise<{
        data: AssistData | null;
        error: string | null;
    }>;
};

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
</script>
<svelte:head>
    <title>your account - moNobar</title>
</svelte:head>

<section class=" max-w-5xl mx-auto px-8 my-24">
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
        {#await data.assistData}
            <!-- Loading State -->
            <div class="card bg-base-200 shadow-xl mb-8">
                <div class="card-body">
                    <div class="flex items-start gap-3 mb-4">
                        <div class="text-sm font-bold text-info bg-info/20 px-3 py-1 rounded-full animate-pulse">Darmono is thinking...</div>
                    </div>
                    <!-- Skeleton for explanation text -->
                    <div class="mb-4 space-y-3">
                        <div class="skeleton h-6 w-full"></div>
                        <div class="skeleton h-6 w-4/5"></div>
                        <div class="skeleton h-6 w-3/5"></div>
                    </div>
                    <!-- Skeleton for stats -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="stat bg-base-100 rounded-lg shadow">
                            <div class="skeleton h-4 w-32 mb-2"></div>
                            <div class="skeleton h-8 w-24"></div>
                        </div>
                        <div class="stat bg-base-100 rounded-lg shadow">
                            <div class="skeleton h-4 w-24 mb-2"></div>
                            <div class="skeleton h-8 w-16"></div>
                        </div>
                    </div>
                </div>
            </div>
        {:then assistResult}
            {#if assistResult.error === 'timeout'}
                <div class="card bg-base-200 shadow-xl mb-8">
                    <div class="card-body">
                        <div class="flex items-start gap-3 mb-4">
                            <div class="text-sm font-bold text-warning bg-warning/20 px-3 py-1 rounded-full">Darmono says:</div>
                        </div>
                        <p class="text-lg mb-4 leading-relaxed">Darmono is busy, maybe try again later 😊</p>
                    </div>
                </div>
            {:else if assistResult.data}
                <div class="card bg-base-200 shadow-xl mb-8">
                    <div class="card-body">
                        <div class="flex items-start gap-3 mb-4">
                            <div class="text-sm font-bold text-primary bg-primary/20 px-3 py-1 rounded-full">Darmono says:</div>
                        </div>
                        <p class="text-lg mb-4 leading-relaxed">{assistResult.data.explanation}</p>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="stat bg-base-100 rounded-lg shadow">
                                <div class="stat-title">Most Watched Genre</div>
                                <div class="stat-value text-primary text-2xl">{assistResult.data.mostWatchedGenre}</div>
                            </div>
                            <div class="stat bg-base-100 rounded-lg shadow">
                                <div class="stat-title">Average Rating</div>
                                <div class="stat-value text-secondary text-2xl">{assistResult.data.averageRating}</div>
                            </div>
                        </div>
                    </div>
                </div>
            {:else if assistResult.error}
                <div class="card bg-base-200 shadow-xl mb-8">
                    <div class="card-body">
                        <div class="flex items-start gap-3 mb-4">
                            <div class="text-sm font-bold text-warning bg-warning/20 px-3 py-1 rounded-full">Darmono says:</div>
                        </div>
                        <p class="text-lg mb-4 leading-relaxed">{getErrorMessage(assistResult.error)}</p>
                        {#if assistResult.error.includes('No watched items found') || assistResult.error.includes('No AI help')}
                            <div class="flex items-center gap-2 text-sm text-base-content/70">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m4.5 0a12.078 12.078 0 0 0 2.25-2.445M16.5 18a12.08 12.08 0 0 1-2.25 2.445M8.25 18a12.08 12.08 0 0 0 2.25 2.445m-2.25 0a12.06 12.06 0 0 0-4.5 0m4.5 0a12.078 12.078 0 0 1-2.25-2.445" />
                                </svg>
                                <span>Tip: Watch a few movies or shows to help me learn your preferences!</span>
                            </div>
                        {/if}
                    </div>
                </div>
            {:else}
                <div class="card bg-base-200 shadow-xl mb-8">
                    <div class="card-body">
                        <div class="flex items-start gap-3 mb-4">
                            <div class="text-sm font-bold text-info bg-info/20 px-3 py-1 rounded-full">Darmono says:</div>
                        </div>
                        <p class="text-lg mb-4 leading-relaxed">I'm ready to analyze your viewing habits! Once you start watching some content, I'll be able to provide personalized insights about your preferences.</p>
                        <div class="flex items-center gap-2 text-sm text-base-content/70">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                            </svg>
                            <span>Start exploring the library to get your personalized recommendations!</span>
                        </div>
                    </div>
                </div>
            {/if}
        {:catch error}
            <div class="card bg-base-200 shadow-xl mb-8">
                <div class="card-body">
                    <div class="flex items-start gap-3 mb-4">
                        <div class="text-sm font-bold text-error bg-error/20 px-3 py-1 rounded-full">Darmono says:</div>
                    </div>
                    <p class="text-error">Sorry, something went wrong while I was analyzing your data. Please try refreshing the page.</p>
                </div>
            </div>
        {/await}

    {:else}
        <div class="text-lg">You are not logged in.</div>
    {/if}
</section>
