<script lang="ts">
    import AutoRefreshRequestData from '$lib/components/AutoRefreshRequestData.svelte';
    import { onMount } from 'svelte';
    onMount(() => {
        document.title = 'Media Requests - Monobar';
    });
</script>

<main class="min-h-screen max-w-5xl mx-auto p-8 pt-24">
    <h1 class="text-4xl font-light mb-8">media requests</h1>

    <section class="my-8">
        <h2 class="text-2xl font-light mb-8">coming soon movies</h2>
        <AutoRefreshRequestData type="movies"/>
    </section>

    <section class="my-8">
        <h2 class="text-2xl font-light mb-8">coming soon tv series</h2>
        <AutoRefreshRequestData type="shows" />
    </section>
</main>
