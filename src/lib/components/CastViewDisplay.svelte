<!--
@component
Cast View Display Component for rendering cast/people in a horizontal scrollable layout

Props:
- data: Array of LibraryItem objects to display (defaults to [])
-->

<script lang="ts">    
    import ImageComponent from './ImageComponent.svelte';

    interface LibraryItem {
        Id?: string;
        id?: string;
        Name: string;
        OriginalTitle?: string;
        ProductionYear?: number;
        year?: number;
        Type?: string;
        Overview?: string;
        overview?: string;
        title?: string;
        thumbPath?: string;
        posterPath?: string;
        ImageTags?: {
            Thumb: string | null | undefined;
            Primary?: string;
            Logo?: string;
        };
        image?: string;
        Role?: string;
    }

    export let data: LibraryItem[] = [];
    export let disableClick: boolean = false;
</script>

{#if !data?.length}
    <section>
        <h1>No data available.</h1>
    </section>
{:else}
    <section class="flex overflow-x-auto gap-x-4 pl-4">
        {#each data as item, index}
            {@const itemId = item.Id || item.id || item.Name || index.toString()}
            <a
                href={disableClick ? undefined : undefined}
                class="flex flex-col items-center max-w-[150px] transition-transform duration-240 ease-in-out hover:-translate-y-2 p-2"
                title={item.Overview}
                style={disableClick ? 'cursor: default; pointer-events: none;' : ''}
            >
                <div class="relative w-full flex justify-center items-center">
                    <div class="avatar w-24 h-24 sm:w-28 sm:h-28">
                        {#if item.image || item.ImageTags?.Primary}
                            <ImageComponent 
                                src={item.image || item.ImageTags?.Primary || null}
                                alt={item.Name}
                                aspectRatio="1/1"
                                borderRadius="rounded-full"
                                fallbackName={item.Name || 'Unknown'}
                            />
                        {:else}
                            <div class="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold text-sm">
                                <div class="text-center leading-none w-full h-full flex flex-col justify-center">
                                    {#each item.Name.split(' ') as word}
                                        <div class="break-words">{word}</div>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
                <div class="mt-4 w-24 sm:w-28 text-center" title={item.Name} style="max-width: 124px;">
                    <p class="truncate font-bold">{item.Name}</p>
                    {#if item.Role}
                        <p class="truncate text-xs">{item.Role}</p>
                    {/if}
                </div>
            </a>
        {/each}
    </section>
{/if}

