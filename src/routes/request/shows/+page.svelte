<script lang="ts">
    import RequestViewDisplay from '$lib/components/RequestViewDisplay.svelte';
    import AutoRefreshRequestData from '$lib/components/AutoRefreshRequestData.svelte';

    export let data;

    let showsRequestWaitingListDataPromise = data.showsRequestWaitingListData;
</script>

<main class="min-h-screen max-w-5xl mx-auto p-8 pt-24">
    <h1 class="text-4xl font-light mb-8">TV Shows Requests</h1>

    <section class="my-4">
        <AutoRefreshRequestData type="shows" title="coming soon"></AutoRefreshRequestData>
    </section>

    {#await showsRequestWaitingListDataPromise}
        <!-- Display nothing -->
    {:then showsRequestWaitingListData}
        <section class="my-4">
            <RequestViewDisplay data={showsRequestWaitingListData} title="in waiting list"></RequestViewDisplay>
        </section>

    {/await}
</main>