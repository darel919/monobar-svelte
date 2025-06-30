<script lang="ts">
import { onDestroy } from 'svelte';
import WatchPlayer from '$lib/components/WatchPlayer.svelte';
import StopState from '$lib/components/StopState.svelte';
import SeasonsEpisodesViewer from '$lib/components/SeasonsEpisodesViewer.svelte';
import { page } from '$app/stores';
import { browser } from '$app/environment';
  import CastViewDisplay from '$lib/components/CastViewDisplay.svelte';
export let data;
  
$: watchData = data.serverData.data || null;
$: playUrl = watchData?.playbackUrl || null;
$: seriesData = data.seriesData || null;
$: id = $page.url.searchParams.get('id');
$: type = $page.url.searchParams.get('type');

if (browser) {
  // console.log(seriesData)
    onDestroy(() => {
        console.warn('Watch page unmounted');
    });
}


</script>
{console.log('watchData', watchData)}
{#if !id || !type}
    <div class="error">Missing id or type</div>
{:else if type !== 'Movie' && type !== 'Episode' && type !== 'Series'}
    <StopState
        message="Invalid type."
        actionDesc="Please recheck the URL."
        action="back"
        actionText="Go back"
    />
{:else if type === 'Episode' && watchData}
    <main class="min-h-screen pt-16 pb-12 px-4">
        <div class="max-w-7xl mx-auto">
          <div class="flex flex-col lg:flex-row gap-4">
            <!-- Left side -->
            <div class="flex-1 min-w-0">
              <!-- Player section -->
              <section class="relative w-full aspect-video bg-black rounded-lg overflow-hidden my-6">
                <WatchPlayer id={id} poster={watchData?.BackdropImageTags} 
                    fullData={watchData} type={type} />
              </section>
              <!-- Episode Data Section -->
              <div class="bg-base-200 rounded-lg p-6">
                <div class="space-y-4">                                    
                  <div>
                      {#if type === 'Episode' && seriesData}
                          <section>
                              <div class="flex flex-col sm:flex-row sm:items-center">
                                  <div class="flex items-center">
                                      {#if seriesData?.ImageTags.Logo}
                                          <img 
                                              src={seriesData.ImageTags.Logo} 
                                              alt={seriesData.Name} 
                                              class="max-w-64 h-9 sm:my-1 my-4" 
                                          />
                                      {:else}
                                        <h2 class="text-xl font-bold text-primary">{seriesData.Name}</h2>
                                      {/if}
                                      
                                  </div>
                                  <div class="flex items-center gap-2 sm:ml-auto">
                                      <div class="badge badge-primary font-medium rounded-none">
                                          Season {watchData.ParentIndexNumber}
                                      </div>
                                      <span class="text-base-content/60">•</span>
                                      <div class="badge badge-secondary font-medium rounded-none">
                                          Episode {watchData.IndexNumber}
                                      </div>
                                  </div>
                              </div>
                          </section>
                      {/if}

                      <h1 class="text-2xl font-bold my-2">{watchData.Name}</h1>

                  </div>
                  
                  {#if watchData.Overview}
                      <div>
                          <p class="text-base-content/80 leading-relaxed">{watchData.Overview}</p>
                      </div>
                  {/if}

                  <div class="flex flex-wrap gap-4 text-sm text-base-content/70">
                      {#if watchData.RunTimeTicks}
                          <div>
                              <span class="font-medium">Runtime:</span> {Math.round(watchData.RunTimeTicks / 600000000)} min
                          </div>
                      {/if}
                      {#if watchData.PremiereDate}
                          <div>
                              <span class="font-medium">Air Date:</span> {new Date(watchData.PremiereDate).toLocaleDateString()}
                          </div>
                      {/if}
                      {#if watchData.CommunityRating}
                          <div>
                              <span class="font-medium">Rating:</span> {watchData.CommunityRating.toFixed(1)}/10
                          </div>
                      {/if}
                  </div>
                  {#if watchData.People && watchData.People.Actors && watchData.People.Actors.content.length > 0}
                      <div class="mt-4">
                        <h3 class="text-lg font-semibold">Cast:</h3>
                        <section class="my-4">
                          <h4 class="mb-2">Starring:</h4>
                          <CastViewDisplay data={watchData.People.Actors.content} />
                        </section>
                        {#if watchData.People.GuestStars && watchData.People.GuestStars.content.length > 0}
                        <section class="my-4">
                          <ul class="list bg-base-100 rounded-box shadow-md">
                            
                            <li class="p-4 pb-2 text-xs opacity-60 tracking-wide">Guest Stars</li>
                            
                            {#each watchData.People.GuestStars.content as stars}
                              <li class="list-row">
                              {#if stars.image}
                                <div>
                                  <img class="size-10 rounded-box object-cover" src={stars.image}/>
                                </div>
                                {:else}
                                <div class="size-10 rounded-box bg-base-300 flex items-center justify-center">
                                  <span class="text-xs font-semibold opacity-60">{stars.Name.charAt(0)}</span>
                                </div>
                                {/if}
                                <div>
                                  <div>{stars.Name}</div>
                                  <div class="text-xs uppercase font-semibold opacity-60">as {stars.Role}</div>
                                </div>
                              </li>
                            {/each}
                          </ul>
                        </section>
                        {/if}
                      </div>
                  {/if}
                </div>
              </div>
            </div>
            <!-- Right side -->
            <div class="w-full lg:w-96 flex-shrink-0">
              <SeasonsEpisodesViewer
                seriesData={seriesData}
                currentEpisodeId={id}
                mode="watch"
              />
            </div>    
          </div>
        </div>
    </main>
{:else}
    <main class="min-h-screen pt-16">
       <section class="relative max-h-screen w-full aspect-video bg-black rounded-lg overflow-hidden my-6">
         <WatchPlayer id={id} poster={watchData?.BackdropImageTags} 
            fullData={watchData} type={type} />
       </section>
    </main>
{/if}
