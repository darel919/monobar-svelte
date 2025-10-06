<script lang="ts">
import { onDestroy, onMount } from 'svelte';
import WatchPlayer from '$lib/components/Watch/WatchPlayer.svelte';
import StopState from '$lib/components/StopState.svelte';
import SeasonsEpisodesViewer from '$lib/components/SeasonsEpisodesViewer.svelte';
import { page } from '$app/stores';
import { browser } from '$app/environment';
import CastViewDisplay from '$lib/components/CastViewDisplay.svelte';
import { goto } from '$app/navigation';

export let data;
  
$: id = $page.url.searchParams.get('id');
$: type = $page.url.searchParams.get('type');
$: requiresAuth = data.requiresAuth || false;

// Check for authentication errors and handle redirect
$: if (requiresAuth && browser) {
  // Store current path for redirect after login
  const currentPath = window.location.pathname + window.location.search;
  const existing = localStorage.getItem('redirectAfterAuth');
  console.log('🔄 Watch page - existing redirect:', existing, 'setting to:', currentPath);
  localStorage.setItem('redirectAfterAuth', currentPath);
  
  // Small delay to ensure localStorage write is complete before navigation
  setTimeout(() => {
    goto('/auth/login');
  }, 10);
}

// Document title logic - updated to work with promises
let documentTitle = 'Loading - Monobar';

$: {
  if (data.serverData && typeof data.serverData === 'object' && 'then' in data.serverData) {
    if (data.seriesData && typeof data.seriesData === 'object' && 'then' in data.seriesData) {
      Promise.all([data.serverData, data.seriesData]).then(([serverDataResult, seriesDataResult]) => {
        const watchData = serverDataResult?.data;
        const seriesData = seriesDataResult?.data;
        
        if (type === 'Episode' && watchData && seriesData) {
          const seriesName = seriesData.Name || 'Unknown Series';
          const seasonNum = watchData.ParentIndexNumber ? `S${String(watchData.ParentIndexNumber).padStart(2, '0')}` : '';
          const episodeNum = watchData.IndexNumber ? `E${String(watchData.IndexNumber).padStart(2, '0')}` : '';
          const episodeName = watchData.Name || '';
          
          if (seasonNum && episodeNum) {
            documentTitle = `Playing: ${seriesName} ${seasonNum}${episodeNum}${episodeName ? ` - ${episodeName}` : ''}`;
          } else {
            documentTitle = `Playing: ${seriesName}${episodeName ? ` - ${episodeName}` : ''}`;
          }
        } else if (type === 'Movie' && watchData) {
          documentTitle = `Playing: ${watchData.Name || 'Unknown Movie'}`;
        }
      }).catch(() => {
        documentTitle = 'Error - Monobar';
      });
    } else {
      data.serverData.then((serverDataResult: any) => {
        const watchData = serverDataResult?.data;
        if (type === 'Movie' && watchData) {
          documentTitle = `Playing: ${watchData.Name || 'Unknown Movie'}`;
        }
      }).catch(() => {
        documentTitle = 'Error - Monobar';
      });
    }
  }
}

if (browser) {
    onMount(() => {
        console.warn('Watch page mounted');
        
        // Handle series redirection
        if (type === 'Series' && data.seriesData && typeof data.seriesData === 'object' && 'then' in data.seriesData) {
          data.seriesData.then((seriesDataResult: any) => {
            const seriesData = seriesDataResult?.data;
            if (seriesData?.availableSeasons && seriesData.availableSeasons.length > 0) {
              const firstSeason = seriesData.availableSeasons[0];
              if (firstSeason.episodes && firstSeason.episodes.length > 0) {
                const firstEpisode = firstSeason.episodes[0];
                goto(`/watch?id=${firstEpisode.Id}&type=Episode&seriesId=${id}`, { replaceState: true });
                return;
              }
            } else {
              // If no episodes found, show error
              alert("No episodes available for this series.");
              goto(`/info?id=${id}&type=Series`, { replaceState: true });
              return;
            }
          }).catch((error: any) => {
            console.error('Error loading series data:', error);
            goto(`/info?id=${id}&type=Series`, { replaceState: true });
          });
        }
    });
    
    onDestroy(() => {
        console.warn('Watch page unmounted');
    });
}


</script>

<svelte:head>
    <title>{documentTitle}</title>
</svelte:head>

{#if !id || !type}
    <StopState
        message="Missing required parameters."
        actionDesc="ID and type parameters are required."
        action="back"
        actionText="Go back"
    />
{:else if requiresAuth}
    <StopState
        message="Authentication Required"
        actionDesc="Authentication is required to access this content."
        action="/auth/login"
        actionText="Sign In"
    />
{:else}
    {#await data.serverData}
        <!-- Loading state with skeleton -->
        <main class="min-h-screen pt-16 pb-12 px-4">
            <div class="max-w-7xl mx-auto">
                <div class="flex flex-col lg:flex-row gap-4">
                    <!-- Left side skeleton -->
                    <div class="flex-1 min-w-0">
                        <!-- Player skeleton -->
                        <section class="relative w-full aspect-video bg-base-300 rounded-lg overflow-hidden my-6">
                            <div class="skeleton w-full h-full"></div>
                        </section>
                        
                        <!-- Content skeleton -->
                        <div class="bg-base-200 rounded-lg p-6">
                            <div class="space-y-4">
                                <!-- Title area skeleton -->
                                <div class="space-y-2">
                                    <div class="skeleton h-6 w-3/4"></div>
                                    <div class="skeleton h-8 w-1/2"></div>
                                </div>
                                
                                <!-- Overview skeleton -->
                                <div class="space-y-2">
                                    <div class="skeleton h-4 w-full"></div>
                                    <div class="skeleton h-4 w-5/6"></div>
                                    <div class="skeleton h-4 w-4/6"></div>
                                </div>
                                
                                <!-- Meta info skeleton -->
                                <div class="flex gap-4">
                                    <div class="skeleton h-4 w-20"></div>
                                    <div class="skeleton h-4 w-24"></div>
                                    <div class="skeleton h-4 w-16"></div>
                                </div>
                                
                                <!-- Cast skeleton -->
                                <div class="mt-6">
                                    <div class="skeleton h-6 w-20 mb-4"></div>
                                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {#each Array(6) as _}
                                            <div class="flex flex-col items-center">
                                                <div class="skeleton w-16 h-16 rounded-full mb-2"></div>
                                                <div class="skeleton h-3 w-16"></div>
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Right side skeleton -->
                    <div class="w-full lg:w-96 flex-shrink-0">
                        <div class="bg-base-200 rounded-lg p-4">
                            <div class="skeleton h-6 w-32 mb-4"></div>
                            <div class="space-y-3">
                                {#each Array(5) as _}
                                    <div class="flex gap-3">
                                        <div class="skeleton w-24 h-16 rounded"></div>
                                        <div class="flex-1 space-y-2">
                                            <div class="skeleton h-4 w-full"></div>
                                            <div class="skeleton h-3 w-3/4"></div>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    {:then serverDataResult}
        {@const serverError = serverDataResult?.error}
        {@const watchData = serverDataResult?.data}
        
        {#if serverError}
            <StopState
                message="Error loading content"
                actionDesc={serverError}
                action="back"
                actionText="Go back"
            />
        {:else if type === 'Episode' && watchData}
            {#if data.seriesData}
                {#await data.seriesData}
                    <!-- Series data loading - show player but skeleton for series info -->
                    <main class="min-h-screen pt-16 pb-12 px-4">
                        <div class="max-w-7xl mx-auto">
                            <div class="flex flex-col lg:flex-row gap-4">
                                <!-- Left side -->
                                <div class="flex-1 min-w-0">
                                    <!-- Player section -->
                                    <section class="relative w-full aspect-video bg-black rounded-lg overflow-hidden my-6">
                                        <WatchPlayer id={id} poster={watchData?.BackdropImageTags} 
                                            fullData={watchData} type={type} seriesData={null} />
                                    </section>
                                    
                                    <!-- Episode Data Section with skeleton for series info -->
                                    <div class="bg-base-200 rounded-lg p-6">
                                        <div class="space-y-4">
                                            <div>
                                                <!-- Series info skeleton -->
                                                <section class="mb-4">
                                                    <div class="flex flex-col sm:flex-row sm:items-center">
                                                        <div class="skeleton h-9 w-64 mb-2 sm:mb-0"></div>
                                                        <div class="flex items-center gap-2 sm:ml-auto">
                                                            <div class="skeleton h-6 w-20"></div>
                                                            <span class="text-base-content/60">•</span>
                                                            <div class="skeleton h-6 w-20"></div>
                                                        </div>
                                                    </div>
                                                </section>
                                                
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
                                                                                <img class="size-10 rounded-box object-cover" src={stars.image} alt={stars.Name}/>
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
                                
                                <!-- Right side skeleton -->
                                <div class="w-full lg:w-96 flex-shrink-0">
                                    <div class="bg-base-200 rounded-lg p-4">
                                        <div class="skeleton h-6 w-32 mb-4"></div>
                                        <div class="space-y-3">
                                            {#each Array(5) as _}
                                                <div class="flex gap-3">
                                                    <div class="skeleton w-24 h-16 rounded"></div>
                                                    <div class="flex-1 space-y-2">
                                                        <div class="skeleton h-4 w-full"></div>
                                                        <div class="skeleton h-3 w-3/4"></div>
                                                    </div>
                                                </div>
                                            {/each}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                {:then seriesDataResult}
                    {@const seriesData = seriesDataResult?.data}
                    <main class="min-h-screen pt-16 pb-12 px-4">
                        <div class="max-w-7xl mx-auto">
                            <div class="flex flex-col lg:flex-row gap-4">
                                <!-- Left side -->
                                <div class="flex-1 min-w-0">
                                    <!-- Player section -->
                                    <section class="relative w-full aspect-video bg-black rounded-lg overflow-hidden my-6">
                                        <WatchPlayer id={id} poster={watchData?.BackdropImageTags} 
                                            fullData={watchData} type={type} seriesData={seriesData} />
                                    </section>
                                    
                                    <!-- Episode Data Section -->
                                    <div class="bg-base-200 rounded-lg p-6">
                                        <div class="space-y-4">                                    
                                            <div>
                                                {#if type === 'Episode' && seriesData}
                                                    <section>
                                                        <div class="flex flex-col sm:flex-row sm:items-center">
                                                            <div class="flex items-center">
                                                                {#if seriesData?.ImageTags?.Logo}
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
                                                                                <img class="size-10 rounded-box object-cover" src={stars.image} alt={stars.Name}/>
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
                {:catch error}
                    <StopState
                        message="Error loading series data"
                        actionDesc={`Failed to load series information: ${error?.message || 'Unknown error'}`}
                        action="back"
                        actionText="Go back"
                    />
                {/await}
            {:else}
                <!-- Episode without series data -->
                <main class="min-h-screen pt-16 pb-12 px-4">
                    <div class="max-w-7xl mx-auto">
                        <div class="flex flex-col lg:flex-row gap-4">
                            <!-- Left side -->
                            <div class="flex-1 min-w-0">
                                <!-- Player section -->
                                <section class="relative w-full aspect-video bg-black rounded-lg overflow-hidden my-6">
                                    <WatchPlayer id={id} poster={watchData?.BackdropImageTags} 
                                        fullData={watchData} type={type} seriesData={null} />
                                </section>
                                
                                <!-- Episode Data Section -->
                                <div class="bg-base-200 rounded-lg p-6">
                                    <div class="space-y-4">
                                        <div>
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
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            {/if}
        {:else if type === 'Movie' && watchData}
            <main class="min-h-screen pt-16">
                <section class="relative max-h-screen w-full aspect-video bg-black rounded-lg overflow-hidden my-6">
                    <WatchPlayer id={id} poster={watchData?.BackdropImageTags} 
                        fullData={watchData} type={type} seriesData={null} />
                </section>
            </main>
        {:else}
            <StopState
                message="Invalid content type"
                actionDesc="Please check the URL and try again."
                action="back"
                actionText="Go back"
            />
        {/if}
    {:catch error}
        <StopState
            message="Error loading content"
            actionDesc={`Failed to load content: ${error?.message || 'Unknown error'}`}
            action="back"
            actionText="Go back"
        />
    {/await}
{/if}
