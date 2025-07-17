<script lang="ts">
    import RequestViewDisplay from '$lib/components/RequestViewDisplay.svelte';

    export let data;

    let showsRequestDataPromise = data.showsRequestData;
    let showsRequestWaitingListDataPromise = data.showsRequestWaitingListData;
</script>

<main class="min-h-screen max-w-5xl mx-auto p-8 pt-24">
    <h1 class="text-4xl font-light mb-8">TV Shows Requests</h1>

    {#await showsRequestDataPromise}
        <section class="my-4">
            <div class="flex items-center justify-center min-h-[200px]">
                <span class="loading loading-spinner loading-lg"></span>
            </div>
        </section>
    {:then showsRequestData}
        <section class="my-4">
            <RequestViewDisplay data={showsRequestData} title="coming soon"></RequestViewDisplay>
        </section>
    {/await}

    {#await showsRequestWaitingListDataPromise}
        <section class="my-4">
            <div class="flex items-center justify-center min-h-[200px]">
                <span class="loading loading-spinner loading-lg"></span>
            </div>
        </section>
    {:then showsRequestWaitingListData}
        <section class="my-4">
            <RequestViewDisplay data={showsRequestWaitingListData} title="in waiting list" allowDelete={true}></RequestViewDisplay>
        </section>
    {/await}
</main>