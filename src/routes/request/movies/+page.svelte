<script lang="ts">
    import RequestViewDisplay from '$lib/components/RequestViewDisplay.svelte';

    export let data;

    let movieRequestDataPromise = data.movieRequestData;
    let movieRequestWaitingListDataPromise = data.movieRequestWaitingListData;
</script>

<main class="min-h-screen p-8 pt-20">
    <h1 class="text-5xl font-light mb-8">Movie Requests</h1>

    {#await movieRequestDataPromise}
        <!-- Display nothing -->
    {:then movieRequestData}
        <section class="my-4">
            <RequestViewDisplay data={movieRequestData} title="coming soon"/>
        </section>
    {/await}

    {#await movieRequestWaitingListDataPromise}
        <!-- Display nothing -->
    {:then movieRequestWaitingListData}
        <section class="my-4">
            <RequestViewDisplay data={movieRequestWaitingListData} title="in waiting list"/>
        </section>

    {/await}
</main>