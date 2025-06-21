<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import YtPlayer from './ytPlayer.svelte';

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
      Primary?: string;
      Logo?: string;
    };
  }  
  export let isOpen: boolean = false;
  export let item: LibraryItem | null = null;
  export let mouseX: number = 0;
  export let mouseY: number = 0;
  const dispatch = createEventDispatcher();

  function closeModal() {
    dispatch('close');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }
  onMount(() => {
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });

  $: {
    if (isOpen) {
      document.addEventListener('keydown', handleKeydown);
    } else {
      document.removeEventListener('keydown', handleKeydown);
    }
  }
</script>

{#if isOpen}  
<div 
    class="fixed inset-0 z-50 pointer-events-none"
    transition:fade
    on:keydown={handleKeydown}
    on:mouseenter
    on:mouseleave
    role="presentation"
  >    
    <div 
      class="absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[360px] overflow-hidden pointer-events-auto"
      style="left: {Math.max(10, Math.min(mouseX + 20, (typeof window !== 'undefined' ? window.innerWidth : 1920) - 500))}px; top: {Math.max(10, Math.min(mouseY + 20, (typeof window !== 'undefined' ? window.innerHeight : 1080) - 300))}px;"
      role="document"
    >
      {#if item}
        <div class="relative w-full h-48 bg-gray-200 dark:bg-gray-700">
          {#if item.posterPath || item.thumbPath || item.ImageTags?.Primary}
            <!-- <YtPlayer 
                ytId="dQw4w9WgXcQ"
                class="w-full h-full"
                mute={false}
                on:close={closeModal}
            ></YtPlayer> -->
          <img 
              src={item.posterPath || item.thumbPath || item.ImageTags?.Primary} 
              alt={item.Name}
              class="w-full h-full object-cover"
            />
          {:else}
            <div class="w-full h-full flex items-center justify-center">
              <span class="text-gray-500 dark:text-gray-400">No Image</span>
            </div>
          {/if}
        </div>
        
        <div class="p-4">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate">
            {item.OriginalTitle || item.Name || 'Unknown'}
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {item.ProductionYear || item.year || 'Unknown Year'} • {item.Type || 'Unknown Type'}
          </p>
          
          <button 
            on:click={() => window.location.href = `/info?id=${item.Id}&type=${item.Type}`}
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            View Details
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}