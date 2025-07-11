<script lang="ts">
    import RequestViewDisplay from '$lib/components/RequestViewDisplay.svelte';
    import AutoRefreshRequestData from '$lib/components/AutoRefreshRequestData.svelte';

    export let data;

    let movieRequestWaitingListDataPromise = data.movieRequestWaitingListData;
</script>

<main class="min-h-screen max-w-4xl mx-auto p-8 pt-20">
    <h1 class="text-4xl font-light mb-8">Movie Requests</h1>

    <section class="my-4">
        <AutoRefreshRequestData type="movies" title="coming soon" />
    </section>

    {#await movieRequestWaitingListDataPromise}
        <!-- Display nothing -->
    {:then movieRequestWaitingListData}
        <section class="my-4">
            <RequestViewDisplay data={movieRequestWaitingListData} title="in waiting list"/>
        </section>

    {/await}
</main>