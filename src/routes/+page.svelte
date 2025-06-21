<script>
    import LibraryViewDisplay from '$lib/components/LibraryViewDisplay.svelte';
    
    export let data;
    
    $: serverData = data.serverData;
    $: libraryCategories = serverData?.data || [];
    $: libraryComingSoon = serverData?.data?.comingSoon || [];
</script>

<main class="flex flex-col min-h-screen p-8">
    <section class="mb-8">
        <h1 class="text-4xl mb-4">Home</h1>
        <!-- <p class="text-lg opacity-75">Media Library Display</p> -->
    </section>

    {#if libraryCategories.length === 0}
        <section class="mb-8">
            <h2 class="text-2xl mb-4">No Data Available</h2>
            <p class="text-lg opacity-75">Please check your server connection or data source.</p>
        </section>
    {/if}
    
    {#each libraryCategories as category}
        {#if category.latest && category.latest.length > 0}
            <section class="mb-8">
                
                <a href={`/library?id=${category.Id}`} class="text-blue-500 hover:underline mb-2 block">
                    <h2 class="text-2xl mb-4">{category.Name}</h2>
                </a>
                <LibraryViewDisplay data={category.latest} viewMode="default_thumb_home" />
            </section>
        {/if}
    {/each}

    {#if libraryComingSoon && libraryComingSoon.length > 0}
        <section class="mb-8">
            <h2 class="text-2xl mb-4">Coming Soon</h2>
            <LibraryViewDisplay data={libraryComingSoon} viewMode="default_thumb_home" />
        </section>
    {/if}


    {#if serverData}
        <section class="mb-8">
            <h2 class="text-2xl mb-4">Server Data</h2>
            <div class="bg-base-800 p-4 rounded-lg">
                <pre class="text-sm overflow-auto">{JSON.stringify(serverData, null, 2)}</pre>
            </div>
        </section>
    {/if}
</main>

<style>
    main {
        max-width: 1200px;
        margin: 0 auto;
    }
</style>

