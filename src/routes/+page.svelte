<script>
    import LibraryViewDisplay from '$lib/components/LibraryViewDisplay.svelte';
  import StopState from '$lib/components/StopState.svelte';
    
    export let data;
    
    $: serverData = data.serverData;
    $: libraryCategories = serverData?.data || [];
    $: libraryComingSoon = serverData?.data?.comingSoon || [];
</script>

<main class="flex flex-col min-h-screen p-8 pt-20">
    <section class="mb-8">
        <h1 class="text-4xl">home</h1>
        <!-- <p class="text-lg opacity-75">Media Library Display</p> -->
    </section>

    {#if libraryCategories.length === 0}
    <StopState
        action="reload"
        message="moNobar is not available."
        actionDesc="Backend returns no data. Please try again in a little while."
        actionText="Reload">
        </StopState>
    {/if}
    
    {#each libraryCategories as category}
        {#if category.latest && category.latest.length > 0}
            <section class="mb-8">
                
                <div class="flex items-center mb-4">
                    <span class="mr-2">Newest</span>
                    <a href={`/library?id=${category.Id}`} class="hover:underline">
                        <h2 class="text-2xl">{category.Name}</h2>
                    </a>
                </div>
                
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


    <!-- {#if serverData}
        <section class="mb-8">
            <h2 class="text-2xl mb-4">Server Data</h2>
            <div class="bg-base-800 p-4 rounded-lg">
                <pre class="text-sm overflow-auto">{JSON.stringify(serverData, null, 2)}</pre>
            </div>
        </section>
    {/if} -->
</main>


