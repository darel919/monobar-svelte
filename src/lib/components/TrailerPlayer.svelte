<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    
    export let ytId: string = '';
    export let mute: boolean = true;
    export let enabled: boolean = true;
    export let backdrop: string = '';
    export let loop: boolean = true;
    let videoLoaded = false;
    let videoEnded = false;
    let isInViewport = false;
    let iframeRef: HTMLIFrameElement;
    let playerRef: any = null;
    let containerRef: HTMLDivElement;
    let observer: IntersectionObserver;
    let currentYtId = '';

    $: if (!backdrop) {
        console.warn('No backdrop provided, component will not render');
    }

    $: if (ytId !== currentYtId) {
        resetPlayer();
        currentYtId = ytId;
    }

    function resetPlayer() {
        if (playerRef && playerRef.destroy) {
            playerRef.destroy();
            playerRef = null;
        }
        videoLoaded = false;
        videoEnded = false;
        
        if (ytId && enabled && isInViewport && iframeRef) {
            setTimeout(() => createPlayer(), 100);
        }
    }

    $: if (!backdrop) {
        console.warn('No backdrop provided, component will not render');
    }

    onMount(() => {
        if (!enabled || !backdrop) return;
        
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        window.onYouTubeIframeAPIReady = () => {};

        if (containerRef) {
            observer = new IntersectionObserver(
                (entries) => {
                    const [entry] = entries;
                    isInViewport = entry.isIntersecting;
                    
                    if (playerRef && playerRef.getPlayerState) {
                        if (entry.isIntersecting && !videoEnded) {
                            playerRef.playVideo();
                        } else {
                            playerRef.pauseVideo();
                        }
                    }
                },
                { threshold: 0.1 }
            );
            
            observer.observe(containerRef);
        }
    });    
    onDestroy(() => {
        if (observer && containerRef) {
            observer.unobserve(containerRef);
        }
        if (playerRef && playerRef.destroy) {
            playerRef.destroy();
            playerRef = null;
        }
        window.onYouTubeIframeAPIReady = null;
    });

    $: if (ytId && enabled && isInViewport && iframeRef && !playerRef && !videoEnded && ytId === currentYtId) {
        createPlayer();
    }

    function createPlayer() {
        if (!ytId || playerRef || !iframeRef) return;
        
        const checkYTApiAndCreatePlayer = () => {
            if (window.YT && window.YT.Player) {
                playerRef = new window.YT.Player(iframeRef, {
                    events: {
                        onReady: () => {
                            setTimeout(() => {
                                videoLoaded = true;
                            }, 500);
                        },
                        onStateChange: (event: any) => {
                            if (event.data === 0) {
                                if (loop) {
                                    playerRef.playVideo();
                                } else {
                                    videoEnded = true;
                                    videoLoaded = false;
                                }
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
    >
        <img
            src={backdrop}
            loading="eager"
            alt="Backdrop"
            class={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${!videoLoaded || videoEnded || !isInViewport || !enabled ? 'opacity-100' : 'opacity-0'}`}
        />
          {#if ytId && enabled && !videoEnded && isInViewport}
            <div 
                class={`absolute inset-0 w-full h-full transition-opacity duration-700 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
            >
                {#key ytId}
                    <iframe
                        bind:this={iframeRef}
                        class="w-full h-full border-0"
                        src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&autoplay=1&mute=${mute ? 1 : 0}&controls=0&modestbranding=1&playsinline=1&rel=0&showinfo=0&fs=0&iv_load_policy=3${loop ? `&loop=1&playlist=${ytId}` : ''}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                        title="YouTube video player"
                    ></iframe>
                {/key}
            </div>
        {/if}
    </div>
{/if}