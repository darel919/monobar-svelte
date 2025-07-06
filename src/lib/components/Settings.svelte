<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { useSettingsStore, hydrateSettingsStore } from '$lib/stores/settings';

    let { showBackButton = true, context = 'standalone' } = $props();

    let settingsStore = $state<ReturnType<typeof useSettingsStore> | null>(null);
    let isLoaded = $state(false);

    onMount(() => {
        settingsStore = useSettingsStore();
        hydrateSettingsStore();
        isLoaded = true;
    });    function handleTrailerToggle() {
        if (settingsStore) {
            let currentValue = false;
            const unsubscribe = settingsStore.subscribe(s => currentValue = s.playTrailersAutomatically);
            unsubscribe();
            settingsStore.setPlayTrailersAutomatically(!currentValue);
        }
    }

    function handlePlayNextToggle() {
        if (settingsStore) {
            let currentValue = false;
            const unsubscribe = settingsStore.subscribe(s => currentValue = s.playNextEnabled);
            unsubscribe();
            settingsStore.setPlayNextEnabled(!currentValue);
        }
    }function handleThemeChange(newTheme: string) {
        if (settingsStore) {
            settingsStore.setTheme(newTheme);
        }
    }

    function handleSubtitleSizeChange(newSize: string) {
        if (settingsStore) {
            settingsStore.setSubtitleSize(newSize);
        }
    }

    function handleHomeViewModeChange(newMode: string) {
        if (settingsStore) {
            settingsStore.setHomeViewMode(newMode);
        }
    }

    function handleShowThresholdChange(e: Event) {
        const target = e.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (settingsStore && !isNaN(value)) {
            settingsStore.setPlayNextShowThreshold(value);
        }
    }

    function handleAutoProgressThresholdChange(e: Event) {
        const target = e.target as HTMLInputElement;
        const value = parseInt(target.value);
        if (settingsStore && !isNaN(value)) {
            settingsStore.setPlayNextAutoProgressThreshold(value);
        }
    }

    function handleResetSettings() {
        if (!browser || !settingsStore) return;
        
        if (confirm('Are you sure you want to reset all settings to default?')) {
            settingsStore.resetSettings();
        }
    }

    function handleDisableHoverPopupToggle() {
        if (settingsStore) {
            let currentValue = false;
            const unsubscribe = settingsStore.subscribe(s => currentValue = s.disableHoverPopup);
            unsubscribe();
            settingsStore.setDisableHoverPopup(!currentValue);
        }
    }

    function handleShowHomeHeroCarouselToggle() {
        if (settingsStore) {
            let currentValue = true;
            const unsubscribe = settingsStore.subscribe(s => currentValue = s.showHomeHeroCarousel);
            unsubscribe();
            settingsStore.setShowHomeHeroCarousel(!currentValue);
        }
    }
</script>

{#if !isLoaded}
    <div class="flex justify-center items-center min-h-[200px]">
        <div class="loading loading-spinner loading-lg"></div>
    </div>
{:else}
    <div class="space-y-6 overflow-x-hidden max-w-full">
        <!-- Playback Settings -->
        <div class="card bg-base-200 shadow-xl">
            <div class="card-body overflow-x-hidden">
                <h2 class="card-title text-2xl mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                    </svg>
                    Playback
                </h2>            
                
                <!-- Subtitle Size Selection -->
                <div class="form-control my-2">
                    <div class="label">
                        <span class="label-text text-lg font-medium">Subtitle Size</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">                        
                        <label class="label cursor-pointer justify-start gap-3 p-4 rounded-lg border border-base-300 hover:bg-base-300 transition-colors flex flex-row items-start">                            <input 
                                type="radio" 
                                name="subtitleSize" 
                                class="radio radio-primary mt-1" 
                                checked={settingsStore ? $settingsStore!.subtitleSize === 'small' : false}
                                onclick={() => handleSubtitleSizeChange('small')}
                            />
                            <div class="flex flex-col">
                                <span class="label-text font-medium">Small</span>
                                <p class="text-sm whitespace-normal leading-snug">Compact subtitle size.</p>
                            </div>
                        </label>
                        <label class="label cursor-pointer justify-start gap-3 p-4 rounded-lg border border-base-300 hover:bg-base-300 transition-colors flex flex-row items-start">                            <input 
                                type="radio" 
                                name="subtitleSize" 
                                class="radio radio-primary mt-1" 
                                checked={settingsStore ? $settingsStore!.subtitleSize === 'medium' : false}
                                onclick={() => handleSubtitleSizeChange('medium')}
                            />
                            <div class="flex flex-col">
                                <span class="label-text font-medium">Medium (Default)</span>
                                <p class="text-sm whitespace-normal leading-snug">Standard subtitle size.</p>
                            </div>
                        </label>
                        <label class="label cursor-pointer justify-start gap-3 p-4 rounded-lg border border-base-300 hover:bg-base-300 transition-colors flex flex-row items-start">                            <input 
                                type="radio" 
                                name="subtitleSize" 
                                class="radio radio-primary mt-1" 
                                checked={settingsStore ? $settingsStore!.subtitleSize === 'large' : false}
                                onclick={() => handleSubtitleSizeChange('large')}
                            />
                            <div class="flex flex-col">
                                <span class="label-text font-medium">Large</span>
                                <p class="text-sm whitespace-normal leading-snug">Bigger subtitle size.</p>
                            </div>
                        </label>
                        <label class="label cursor-pointer justify-start gap-3 p-4 rounded-lg border border-base-300 hover:bg-base-300 transition-colors flex flex-row items-start">                            <input 
                                type="radio" 
                                name="subtitleSize" 
                                class="radio radio-primary mt-1" 
                                checked={settingsStore ? $settingsStore!.subtitleSize === 'x-large' : false}
                                onclick={() => handleSubtitleSizeChange('x-large')}
                            />
                            <div class="flex flex-col">
                                <span class="label-text font-medium">Extra Large</span>
                                <p class="text-sm whitespace-normal leading-snug">Maximum subtitle size.</p>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Play Next for TV Series -->
                <div class="form-control w-full my-2">
                    <label class="label cursor-pointer justify-start gap-4 flex flex-row flex-wrap items-start px-1">
                        <input 
                            type="checkbox" 
                            class="toggle toggle-primary mt-1" 
                            checked={settingsStore ? $settingsStore!.playNextEnabled : false}
                            onclick={handlePlayNextToggle}
                        />
                        <div class="flex flex-col flex-1">
                            <span class="label-text text-lg font-medium break-normal">Show "Play Next" for TV Series</span>
                            <p class="text-sm text-base-content/60 mt-1 whitespace-normal leading-snug">
                                When enabled, shows a "Play Next" prompt before an episode ends.
                            </p>
                        </div>
                    </label>
                </div>

                <!-- Play Next Timing Settings -->
                {#if settingsStore && $settingsStore!.playNextEnabled}
                    <div class="form-control w-full my-2">
                        <div class="label">
                            <span class="label-text text-lg font-medium">Play Next Timing</span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="form-control">
                                <label class="label" for="playNextShowThreshold">
                                    <span class="label-text">Show prompt at (seconds from end)</span>
                                </label>
                                <input 
                                    id="playNextShowThreshold"
                                    type="number" 
                                    class="input input-bordered w-full" 
                                    min="10" 
                                    max="120" 
                                    value={settingsStore ? $settingsStore!.playNextShowThreshold : 40}
                                    oninput={handleShowThresholdChange}
                                />
                                <div class="label">
                                    <span class="label-text-alt">Default: 40 seconds</span>
                                </div>
                            </div>
                            <div class="form-control">
                                <label class="label" for="playNextAutoProgressThreshold">
                                    <span class="label-text">Auto-play at (seconds from end)</span>
                                </label>
                                <input 
                                    id="playNextAutoProgressThreshold"
                                    type="number" 
                                    class="input input-bordered w-full" 
                                    min="5" 
                                    max="60" 
                                    value={settingsStore ? $settingsStore!.playNextAutoProgressThreshold : 12}
                                    oninput={handleAutoProgressThresholdChange}
                                />
                                <div class="label">
                                    <span class="label-text-alt">Default: 12 seconds</span>
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}


            </div>
        </div>

        <!-- App Settings -->
        <div class="card bg-base-200 shadow-xl">
            <div class="card-body overflow-x-hidden">
                <h2 class="card-title text-2xl mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672Zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5" />
                    </svg>

                    Behaviour
                </h2>                
                <!-- Play Trailers Automatically -->
                {#if context !== 'player'}
                    <div class="form-control w-full">
                        <label class="label cursor-pointer justify-start gap-4 flex flex-row flex-wrap items-start px-1">                            <input 
                                type="checkbox" 
                                class="toggle toggle-primary mt-1" 
                                checked={settingsStore ? $settingsStore!.playTrailersAutomatically : false}
                                onclick={handleTrailerToggle}
                            />
                            <div class="flex flex-col flex-1">
                                <span class="label-text text-lg font-medium break-normal">Play Trailers Automatically</span>
                                <p class="text-sm text-base-content/60 mt-1 whitespace-normal leading-snug">
                                    When enabled, trailers will automatically play on movie's info page.
                                </p>
                            </div>
                        </label>
                    </div>
                {/if}

                <!-- Disable Popup on Hover -->
                <div class="form-control w-full">
                    <label class="label cursor-pointer justify-start gap-4 flex flex-row flex-wrap items-start px-1">
                        <input 
                            type="checkbox" 
                            class="toggle toggle-primary mt-1" 
                            checked={settingsStore ? $settingsStore!.disableHoverPopup : false}
                            onclick={handleDisableHoverPopupToggle}
                        />
                        <div class="flex flex-col flex-1">
                            <span class="label-text text-lg font-medium break-normal">Disable popup on hover</span>
                            <p class="text-sm text-base-content/60 mt-1 whitespace-normal leading-snug">
                                When enabled, disables the hover popup modal in library views.
                            </p>
                        </div>
                    </label>
                </div>

                
            </div>
        </div>

        <!-- Home Settings -->
        <div class="card bg-base-200 shadow-xl">
            <div class="card-body">
                <h2 class="card-title text-2xl mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                    </svg>
                    Home
                </h2>
                <!-- Show Home Hero Carousel -->
                <div class="form-control w-full">
                    <label class="label cursor-pointer justify-start gap-4 flex flex-row flex-wrap items-start px-1">
                        <input 
                            type="checkbox" 
                            class="toggle toggle-primary mt-1" 
                            checked={settingsStore ? $settingsStore!.showHomeHeroCarousel : true}
                            onclick={handleShowHomeHeroCarouselToggle}
                        />
                        <div class="flex flex-col flex-1">
                            <span class="label-text text-lg font-medium break-normal">Show Featured Content</span>
                            <p class="text-sm text-base-content/60 mt-1 whitespace-normal leading-snug">
                                When enabled, displays the featured content carousel on the home page.
                            </p>
                        </div>
                    </label>
                </div>

                <!-- Home View Mode Selection -->
                <!-- <div class="form-control">
                    <div class="label">
                        <span class="label-text text-lg font-medium">Default View Mode</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">                        <label class="label cursor-pointer justify-start gap-3 p-4 rounded-lg border border-base-300 hover:bg-base-300 transition-colors flex flex-row items-start">                            <input 
                                type="radio" 
                                name="homeViewMode" 
                                class="radio radio-primary mt-1" 
                                checked={settingsStore ? $settingsStore.homeViewMode === 'posterView' : false}
                                onclick={() => handleHomeViewModeChange('posterView')}
                            />
                            <div class="flex flex-col">
                                <span class="label-text font-medium">Poster View</span>
                                <p class="text-sm whitespace-normal leading-snug">Display items as posters in a grid layout.</p>
                            </div>
                        </label>
                        <label class="label cursor-pointer justify-start gap-3 p-4 rounded-lg border border-base-300 hover:bg-base-300 transition-colors flex flex-row items-start">                            <input 
                                type="radio" 
                                name="homeViewMode" 
                                class="radio radio-primary mt-1" 
                                checked={settingsStore ? $settingsStore.homeViewMode === 'listView' : false}
                                onclick={() => handleHomeViewModeChange('listView')}
                            />
                            <div class="flex flex-col">
                                <span class="label-text font-medium">List View</span>
                                <p class="text-sm whitespace-normal leading-snug">Display items in a detailed list format.</p>
                            </div>
                        </label>
                    </div>
                </div> -->
            </div>
        </div>

        <!-- Appearance Settings -->
        <div class="card bg-base-200 shadow-xl">
            <div class="card-body">
                <h2 class="card-title text-2xl mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12a7.5 7.5 0 0 0 15 0m-15 0a7.5 7.5 0 1 1 15 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077 1.41-.513m14.095-5.13 1.41-.513M5.106 17.785l1.15-.964m11.49-9.642 1.149-.964M7.501 19.795l.75-1.3m7.5-12.99.75-1.3m-6.063 16.658.26-1.477m2.605-14.772.26-1.477m0 17.726-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205 12 12m6.894 5.785l-1.149-.964M6.256 7.178l-1.15-.964m15.352 8.864-1.41-.513M4.954 9.435l-1.41-.514M12.002 12l-3.75 6.495" />
                    </svg>
                    Appearance
                </h2>
                
                <!-- Theme Selection -->
                <div class="form-control">
                    <div class="label">
                        <span class="label-text text-lg font-medium">Theme</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-3">                        <label class="label cursor-pointer justify-start gap-3 p-4 rounded-lg border border-base-300 hover:bg-base-300 transition-colors flex flex-row items-start">                            <input 
                                type="radio" 
                                name="theme" 
                                class="radio radio-primary mt-1" 
                                checked={settingsStore ? $settingsStore!.theme === 'system' : false}
                                onclick={() => handleThemeChange('system')}
                            />
                            <div class="flex flex-col">
                                <span class="label-text font-medium">System (Default)</span>
                                <p class="text-sm whitespace-normal leading-snug">Automatically match your device settings.</p>
                            </div>
                        </label>
                        <label class="label cursor-pointer justify-start gap-3 p-4 rounded-lg border border-base-300 hover:bg-base-300 transition-colors flex flex-row items-start">                            <input 
                                type="radio" 
                                name="theme" 
                                class="radio radio-primary mt-1" 
                                checked={settingsStore ? $settingsStore!.theme === 'dark' : false}
                                onclick={() => handleThemeChange('dark')}
                            />
                            <div class="flex flex-col">
                                <span class="label-text font-medium">Dark</span>
                                <p class="text-sm whitespace-normal leading-snug">Dark theme for low-light environments.</p>
                            </div>
                        </label>
                        <label class="label cursor-pointer justify-start gap-3 p-4 rounded-lg border border-base-300 hover:bg-base-300 transition-colors flex flex-row items-start">                            <input 
                                type="radio" 
                                name="theme" 
                                class="radio radio-primary mt-1" 
                                checked={settingsStore ? $settingsStore!.theme === 'light' : false}
                                onclick={() => handleThemeChange('light')}
                            />
                            <div class="flex flex-col">
                                <span class="label-text font-medium">Light</span>
                                <p class="text-sm whitespace-normal leading-snug">Light theme for bright environments.</p>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
        </div>

        <!-- Reset Settings -->
        {#if showBackButton}
            <div class="card bg-base-200 shadow-xl">
                <div class="card-body">
                    <h2 class="card-title text-2xl mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        Reset
                    </h2>
                    
                    <div class="flex flex-row gap-4 items-start">
                        <button 
                            class="btn btn-outline btn-warning"
                            onclick={handleResetSettings}
                        >
                            Reset All Settings
                        </button>
                        <p class="text-sm">
                            This will restore all settings to their default values.
                        </p>
                    </div>
                </div>
            </div>
        {/if}
    </div>
{/if}
