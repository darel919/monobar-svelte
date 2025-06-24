<script>
  import LibraryViewDisplay from '$lib/components/LibraryViewDisplay.svelte';
    import YtPlayer from '$lib/components/TrailerPlayer.svelte';
    export let data;
    
    $: serverData = data.serverData.data || null;
    $: id = data.id;
    $: type = data.type;
</script>

<main class="flex flex-col min-h-screen px-8 pt-20">

    {#if serverData}        
    <section class="fixed inset-0 -z-1">
            <YtPlayer 
                ytId=""
                trailerData={serverData.RemoteTrailers || []}
                mute={true}
                enabled={true}
                loop={false}
                backdrop={serverData.posterPath || serverData.thumbPath || serverData.ImageTags?.Primary}
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20"></div>
        </section>

        <section class="max-w-2xl relative z-10">
        <!-- Genre Display -->
        {#if serverData.GenreItems && serverData.GenreItems.length > 0}
            <section class="">
                <div class="flex flex-wrap gap-2">
                    {#each serverData.GenreItems as item}
                        {#if item.Id !== ""}
                        <a href={`/library?id=${item.Id}&type=genre`} title={`Show more ${item.Name}`}>
                            <span class="badge badge-neutral rounded-sm px-3 text-sm hover:underline">{item.Name}</span>
                        </a>
                        {/if}
                    {/each}
                </div>
            </section>
        {/if}

        <!-- Item Logo/Title -->
        {#if serverData.ImageTags && serverData.ImageTags.Logo}
        <section class="py-4 sm:py-8">
            <img loading="eager" src={serverData.ImageTags.Logo} alt={serverData.OriginalTitle ? serverData.OriginalTitle : serverData.Name} class="h-32 w-fit max-w-58 sm:max-w-64 md:max-w-80 object-contain pointer-events-none" />
        </section>
        {:else}
        <section>
            <h1 class="text-5xl font-bold my-8">{serverData.OriginalTitle ? serverData.OriginalTitle : serverData.Name}</h1>
        </section>
        {/if}
        
        <!-- Item Description -->
        {#if serverData.Overview && serverData.Overview !== ""}
            <section class="mb-8">
                <p class="text-lg opacity-75">{serverData.Overview}</p>
            </section>
        {/if}

        <!-- Item Tags -->
        {#if serverData.Tags && serverData.Tags.length > 0}
            <section class="mb-8">
                <div class="mb-4 text-md"><b>{serverData.Name.toLowerCase()}</b> is about:</div>
                <div class="flex flex-wrap gap-2">
                    {#each serverData.Tags as tag}
                        {#if tag !== ""}
                        <a href="/search?q={tag}&type=tag" class="" title={`Search for ${tag}`}>
                            <span class="badge badge-ghost rounded-none px-3 text-xs hover:underline">{tag}</span>
                        </a>
                        {/if}
                    {/each}
                </div>
            </section>
        {/if}
        </section>

        <!-- Recommendation/Similar Items -->
        {#if serverData.recommendation && serverData.recommendation.length > 0}
            <section class="mb-8">
                <div class="mb-4 text-md">just like <b>{serverData.Name.toLowerCase()}</b>:</div>
                <div class="flex flex-wrap gap-2">
                    <LibraryViewDisplay data={serverData.recommendation} viewMode="default_thumb_recommendation" />
                </div>
            </section>
        {/if}

        <section>

        </section>
        <!-- <section class="mb-8">
            <h2 class="text-2xl mb-4">Server Data</h2>
            <div class="bg-base-800 p-4 rounded-lg">
                <pre class="text-sm overflow-auto">{JSON.stringify(serverData, null, 2)}</pre>
            </div>
        </section> -->
    {/if}
</main>
