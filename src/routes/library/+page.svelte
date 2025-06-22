<script>
  import { LibraryViewDisplay } from '$lib';

    // import LibraryViewDisplay from '$lib/components/LibraryViewDisplay.svelte';
    
    export let data;
    
    $: serverData = data.serverData.data || null;
</script>

<main class="flex flex-col min-h-screen p-8">

    {#if serverData}
        <section class="mb-8">
            <h1 class="text-4xl mb-4">{serverData.library.Name}</h1>
        </section>
        <section>
            <LibraryViewDisplay data={serverData.content} viewMode="default_thumb_library" />
        </section>
        <!-- <section class="mb-8">
            <h2 class="text-2xl mb-4">Server Data</h2>
            <div class="bg-base-800 p-4 rounded-lg">
                <pre class="text-sm overflow-auto">{JSON.stringify(serverData, null, 2)}</pre>
            </div>
        </section> -->
    {/if}

</main>


