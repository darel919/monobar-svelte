<script lang="ts">
    import AutoRefreshRequestData from '$lib/components/AutoRefreshRequestData.svelte';
    import { onMount } from 'svelte';
    onMount(() => {
        document.title = 'Media Requests - Monobar';
    });
</script>

<main class="min-h-screen max-w-5xl mx-auto p-8 pt-24">
    <h1 class="text-4xl font-light mb-8">media requests</h1>
    <section class="mb-8 flex flex-row items-center justify-between">
        <p class="text-2xl font-light">coming soon movies</p>
        <a href="/search?type=request_movies" class="btn btn-primary mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Search Movies
        </a>
    </section>
   
    <section class="my-8">
        <AutoRefreshRequestData type="movies" title="Movies"/>
    </section>
    <section class="mb-8 flex flex-row items-center justify-between">
        <p class="text-2xl font-light">coming soon tv shows</p>
                <a href="/search?type=request_shows" class="btn btn-primary mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>

            Search TV Shows
        </a>
    </section>

    <section class="my-8">
        <AutoRefreshRequestData type="shows" title="TV Shows"/>
    </section>
</main>
