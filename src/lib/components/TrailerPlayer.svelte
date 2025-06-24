<!--
@component
YouTube Trailer Player Component with intersection observer and backdrop fallback

Props:
- ytId: YouTube video ID to play (defaults to '')
- trailerData: Array of trailer objects with Name and Url properties (defaults to [])
- mute: Whether to mute the video (defaults to true)
- enabled: Enable/disable the player functionality (defaults to true)
- backdrop: Backdrop image URL for fallback display (defaults to '')
- loop: Whether to loop the video (defaults to true)
-->

<script lang="ts">    import { onMount, onDestroy } from 'svelte';
    import ImageComponent from './ImageComponent.svelte';
    import { useSettingsStore } from '$lib/stores/settings';
    import { browser } from '$app/environment';
    
    interface TrailerData {
        Name: string;
        Url: string;
    }
    
    export let ytId: string = '';    export let trailerData: TrailerData[] = [];
    export let mute: boolean = true;
    export let enabled: boolean = true;
    export let backdrop: string = '';
    export let loop: boolean = true;
    
    let settingsStore: ReturnType<typeof useSettingsStore> | null = null;
    
    onMount(() => {
        settingsStore = useSettingsStore();
    });
    
    let videoLoaded = false;
    let videoEnded = false;
    let isInViewport = false;
    let iframeRef: HTMLIFrameElement;
    let containerRef: HTMLDivElement;
    let observer: IntersectionObserver;
    let currentYtId = '';
    let selectedYtId = '';
    let playerRef: any = null;    $: isTrailerEnabled = enabled && (browser && settingsStore ? settingsStore.get().playTrailersAutomatically : false);

    function extractYouTubeId(url: string): string {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : '';
    }    function selectRandomTrailer(): string {
        if (trailerData && trailerData.length > 0) {
            const randomIndex = Math.floor(Math.random() * trailerData.length);
            const selectedTrailer = trailerData[randomIndex];
            return extractYouTubeId(selectedTrailer.Url);
        }
        return '';
    }

    $: {
        if (trailerData && trailerData.length > 0) {
            selectedYtId = selectRandomTrailer();
        } else if (ytId) {
            selectedYtId = ytId;
        }
    }

    $: if (!backdrop) {
        console.warn('No backdrop provided, component will not render');
    }    $: if (selectedYtId !== currentYtId) {
        if (playerRef && playerRef.destroy) {
            playerRef.destroy();
            playerRef = null;
        }
        videoLoaded = false;
        videoEnded = false;
        currentYtId = selectedYtId;
    }

    onMount(() => {
        if (!backdrop) return;

        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            if (firstScriptTag && firstScriptTag.parentNode) {
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            }
        }

        if (containerRef) {
            observer = new IntersectionObserver(
                (entries) => {
                    const [entry] = entries;
                    isInViewport = entry.isIntersecting;
                },
                { threshold: 0.1 }
            );
            
            observer.observe(containerRef);
        }
    });    onDestroy(() => {
        if (observer && containerRef) {
            observer.unobserve(containerRef);
        }
        if (playerRef && playerRef.destroy) {
            playerRef.destroy();
            playerRef = null;
        }
    });

    function createPlayer() {
        if (!selectedYtId || playerRef || !iframeRef) return;
        
        const checkYTApiAndCreatePlayer = () => {
            if ((window as any).YT && (window as any).YT.Player) {
                playerRef = new (window as any).YT.Player(iframeRef, {
                    events: {
                        onStateChange: (event: any) => {
                            if (event.data === 0 && !loop) {
                                videoEnded = true;
                                videoLoaded = false;
                            }
                        }
                    }
                });
            } else {
                setTimeout(checkYTApiAndCreatePlayer, 100);
            }
        };
        
        checkYTApiAndCreatePlayer();
    }
</script>

{#if backdrop}
    <div 
        bind:this={containerRef}
        class="w-full h-full relative"
    >        <ImageComponent
            src={backdrop}
            alt="Backdrop"
            loading="eager"
            containerClass="absolute inset-0"
            imageClass={`transition-opacity duration-700 ${!videoLoaded || videoEnded || !isInViewport || !isTrailerEnabled ? 'opacity-100' : 'opacity-0'}`}
            borderRadius="rounded-none"
            showSkeleton={false}
        />          
        {#if selectedYtId && isTrailerEnabled && !videoEnded && isInViewport}
            <div 
                class={`absolute inset-0 w-full h-full transition-opacity duration-700 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
            >
                {#key selectedYtId}                        <iframe
                        bind:this={iframeRef}
                        class="w-full border-0"
                        style="height: calc(100% + 60px); margin-top: -64px;"
                        src={`https://www.youtube.com/embed/${selectedYtId}?enablejsapi=1&autoplay=1&mute=${mute ? 1 : 0}&controls=0&modestbranding=1&playsinline=1&rel=0&showinfo=0&fs=0&iv_load_policy=3&disablekb=1${loop ? `&loop=1&playlist=${selectedYtId}` : ''}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                        title="YouTube video player"
                        on:load={() => {
                            setTimeout(() => {
                                videoLoaded = true;
                                createPlayer();
                            }, 1000);
                        }}
                    >
                </iframe>
                {/key}
            </div>
        {/if}
    </div>
{/if}