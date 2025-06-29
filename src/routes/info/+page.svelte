<script lang="ts">  
  import { onMount } from 'svelte';
  import LibraryViewDisplay from '$lib/components/LibraryViewDisplay.svelte';
  import StopState from '$lib/components/StopState.svelte';
  import YtPlayer from '$lib/components/TrailerPlayer.svelte';
  import { useSettingsStore } from '$lib/stores/settings';
  import { browser } from '$app/environment';
  import CastViewDisplay from '$lib/components/CastViewDisplay.svelte';
  import PlayActionButton from '$lib/components/PlayActionButton.svelte';
  
  export let data;
  
  let settingsStore: ReturnType<typeof useSettingsStore> | null = null;
  
  onMount(() => {
    settingsStore = useSettingsStore();
  });
  
  $: serverData = data.serverData.data || null;
  $: id = data.id;
  $: type = data.type;

</script>

<main class="flex flex-col min-h-screen px-8 pt-20 text-white">
    {#if type === "Movie" || type === "Series"}
        {#if serverData && !data.serverData.error}    
        <!-- {console.log("Server Data:", serverData)}         -->
            <section class="fixed inset-0 -z-1">                
                <YtPlayer 
                    ytId=""
                    trailerData={serverData.RemoteTrailers || []}
                    mute={true}
                    enabled={browser && settingsStore ? settingsStore.get().playTrailersAutomatically : false}
                    loop={false}
                    backdrop={serverData.ImageTags?.Backdrop}
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20"></div>
            </section>

            <section class="max-w-lg relative z-10 mt-72 sm:mt-96">


            <!-- Item Logo/Title -->
            {#if serverData.ImageTags && serverData.ImageTags.Logo}
                <section class="py-4 sm:py-8 transition-fade-in duration-600">
                    <img loading="eager" src={serverData.ImageTags.Logo} alt={serverData.OriginalTitle ? serverData.OriginalTitle : serverData.Name} class="h-32 w-fit max-w-58 sm:max-w-64 md:max-w-80 object-contain pointer-events-none" />
                </section>
            {:else}
                <section>
                    <h1 class="text-5xl font-extralight my-8">{serverData.OriginalTitle ? serverData.OriginalTitle : serverData.Name}</h1>
                </section>
            {/if}

            <!-- Badge display -->
            <section class="flex flex-row items-center gap-4 mb-8">
                <!-- Rating certification display -->
                {#if serverData.OfficialRating}
                    <section class="flex flex-wrap gap-4" title="Rating Certification">
                        <span class="text-sm cursor-default">
                            {serverData.OfficialRating}
                        </span>
                    </section>
                {/if}
                <!-- Production Year Display -->
                {#if serverData.ProductionYear}
                    <section class="flex flex-wrap gap-4">
                        {#if type === "Series"}
                            {@const startYear = serverData.ProductionYear}
                            {@const endYear = serverData.EndDate ? new Date(serverData.EndDate).getFullYear() : null}
                            {@const isOngoing = !serverData.EndDate || serverData.Status !== "Ended"}
                            <span class="text-sm cursor-default">
                                {startYear}-{isOngoing ? "now" : endYear}
                            </span>
                        {:else}
                            <span class="text-sm cursor-default">
                                {serverData.ProductionYear}
                            </span>
                        {/if}
                    </section>
                {/if}

                <!-- Genre Display -->
                {#if serverData.GenreItems && serverData.GenreItems.length > 0}
                    <section class="flex flex-wrap gap-2">
                        {#each serverData.GenreItems as item}
                            {#if item.Id !== ""}
                            <a href={`/library?id=${item.Id}&type=genre`} title={`Show more ${item.Name}`}>
                                <span class="badge badge-ghost rounded-sm sm:p-3 p-4 text-sm hover:underline">{item.Name}</span>
                            </a>
                            {/if}
                        {/each}
                    </section>
                {/if}
            </section>

            <PlayActionButton id={serverData.Id} type={serverData.Type} playUrl={serverData.playUrl} />
            
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
                                <span class="badge badge-ghost rounded-none sm:p-3 p-4 text-xs hover:underline">{tag}</span>
                            </a>
                            {/if}
                        {/each}
                    </div>
                </section>
            {/if}
            </section>
            {console.log("Server Data:", serverData)}
            {#if serverData.People}
            {#if serverData.People.Directors && serverData.People.Directors.content && serverData.People.Directors.content.length > 0} 
                    <section class="my-2">
                        <!-- <CastViewDisplay
                            data={serverData.People.Actors.content}
                        /> -->
                        {#each serverData.People.Directors.content as item}
                            <section class="mb-4">
                                <div class="text-md mb-2">Directed by: <b>{item.Name}</b></div>
                                <!-- {#if item.ImageTags && item.ImageTags.Primary}
                                    <img src={item.ImageTags.Primary} alt={item.Name} class="h-24 w-24 object-cover rounded-full" />
                                {:else}
                                    <span class="text-sm text-gray-400">No image available</span>
                                {/if} -->
                                </section>
                        {/each}
                    </section>
                {/if}
                {#if serverData.People.Actors && serverData.People.Actors.content && serverData.People.Actors.content.length > 0} 
                    <p>Cast:</p>    
                    <section class="-ml-4 my-2">
                        <CastViewDisplay
                            data={serverData.People.Actors.content}
                        />
                    </section>
                {/if}
                
            {/if}
            <!-- Recommendation/Similar Items -->
            {#if serverData.recommendation && serverData.recommendation.length > 0}
                <section class="mb-8">
                    <div class="mb-4 text-md">just like <b>{serverData.Name.toLowerCase()}</b>:</div>
                    <div class="flex flex-wrap gap-2">
                        <LibraryViewDisplay data={serverData.recommendation} viewMode="default_thumb_recommendation" />
                    </div>
                </section>
            {/if}
        {:else if data.serverData.error}
        <StopState
            action="back"
            message="title unavailable."
            actionDesc="This title is not available. Please try another title."
            actionText="Go Back"
            errorCode={String(data.serverData.error)}
        />
        {:else}
        <StopState
            action="back"
            message="title unavailable."
            actionDesc="The requested item is not available or does not exist."
            actionText="Go Back"
        />
        {/if}
    {:else} 
        <StopState
            message="Invalid type."
            actionDesc="Your current request is not valid. Please recheck the URL."
            action="back"
            actionText="Go back"
        ></StopState>
    {/if}
   
</main>
