<script lang="ts">
    import RequestViewDisplay from '$lib/components/RequestViewDisplay.svelte';

    export let data;

    let showsRequestDataPromise = data.showsRequestData;
    let showsRequestWaitingListDataPromise = data.showsRequestWaitingListData;
</script>

<main class="min-h-screen p-8 pt-20">
    <h1 class="text-5xl font-light mb-8">TV Shows Requests</h1>

    {#await showsRequestDataPromise}
        <!-- Display nothing -->
    {:then showsRequestData}
        <section class="my-4">
            <RequestViewDisplay data={showsRequestData} title="coming soon"/>
        </section>
    {/await}

    {#await showsRequestWaitingListDataPromise}
        <!-- Display nothing -->
    {:then showsRequestWaitingListData}
        <section class="my-4">
            <RequestViewDisplay data={showsRequestWaitingListData} title="in waiting list"/>
        </section>

    {/await}
</main>