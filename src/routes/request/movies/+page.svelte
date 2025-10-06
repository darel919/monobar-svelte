<script lang="ts">
    import RequestViewDisplay from '$lib/components/RequestViewDisplay.svelte';

    export let data;

    let movieRequestDataPromise = data.movieRequestData;
    let movieRequestWaitingListDataPromise = data.movieRequestWaitingListData;
</script>

<main class="min-h-screen max-w-5xl mx-auto p-8 pt-24">
    <h1 class="text-4xl font-light mb-8">Movie Requests</h1>

    {#await movieRequestDataPromise}
        <section class="my-4">
            <div class="flex items-center justify-center min-h-[200px]">
                <span class="loading loading-spinner loading-lg"></span>
            </div>
        </section>
    {:then movieRequestData}
        <section class="my-4">
            <RequestViewDisplay data={movieRequestData} title="coming soon"></RequestViewDisplay>
        </section>
    {/await}

    {#await movieRequestWaitingListDataPromise}
        <section class="my-4">
            <div class="flex items-center justify-center min-h-[200px]">
                <span class="loading loading-spinner loading-lg"></span>
            </div>
        </section>
    {:then movieRequestWaitingListData}
        <section class="my-4">
            <RequestViewDisplay data={movieRequestWaitingListData} title="in waiting list" allowDelete={true}></RequestViewDisplay>
        </section>
    {/await}
</main>