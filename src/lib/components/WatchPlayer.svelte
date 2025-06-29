<!--
@component
WatchPlayer – Svelte video player component using Artplayer and HLS.js

Props:
- poster: string | null – Poster image URL for the video (optional)
- fullData: object – Media source and metadata (must include `src` and optionally `Chapters`)
- id: string – Unique identifier for the media
- type: string – Media type (e.g., 'movie', 'episode')
- seriesData: SeriesData | null – Series metadata (optional)

Usage:
```svelte
<script>
  import WatchPlayer from '$lib/components/WatchPlayer.svelte';
  let media = { src: 'https://example.com/stream.m3u8', Chapters: [] };
</script>
<WatchPlayer
  poster="/assets/poster.jpg"
  fullData={media}
  id="123"
  type="movie"
  seriesData={null}
/>
```
-->

<script lang="ts">

import { onMount, unmount } from 'svelte';
import Hls from "hls.js";
import Artplayer from 'artplayer';
import artplayerPluginHlsControl from 'artplayer-plugin-hls-control';
import artplayerPluginChapter from 'artplayer-plugin-chapter';
import { goto } from '$app/navigation';
import { getBaseEnvironment } from '$lib/utils/environment.js';
import { getCookie } from '$lib/utils/cookieUtils.js';
  import { getAuthorizationHeader, getSessionId } from '$lib/utils/authUtils';
  import { BASE_API_PATH } from '$lib/config/api';

const isDev = import.meta.env && import.meta.env.DEV;

export let poster: string | null = null;
export let fullData: any = null;
export let id: string;
export let type: string;
export let seriesData: SeriesData | null = null;

let artRef: HTMLDivElement | null = null;
let art: Artplayer | null = null;
let showSettings = false;
let unsubscribe: () => void;
let playbackReportInterval: ReturnType<typeof setInterval> | null = null;

function openSettings() {
    showSettings = true;
}
function closeSettings() {
    showSettings = false;
}

function setupPlayer() {
    if (artRef && fullData?.playbackUrl) {
        if (art) art.destroy();
        art = new Artplayer({
            container: artRef,
            url: fullData.playbackUrl,
            poster: poster || '',
            autoplay: true,
            isLive: false,
            autoSize: true,
            autoMini: true,
            setting: true,
            playbackRate: false,
            aspectRatio: false,
            fullscreen: true,
            fullscreenWeb: false,
            miniProgressBar: true,
            mutex: true,
            fastForward: true,
            subtitleOffset: true,
            lang: navigator.language.toLowerCase(),
            backdrop: true,
            autoPlayback: true,
            hotkey: true,
            pip: true,
            airplay: true,
            theme: '#ff0000',
            type: 'm3u8',            
            contextmenu: [],
            plugins: [
                artplayerPluginHlsControl({
                    quality: {
                        control: true,
                        setting: true,
                        getName: (level) => level.height + 'P',
                        title: 'Quality',
                        auto: 'Auto',
                    },
                    audio: {
                        control: true,
                        setting: true,
                        getName: (track) => track.name,
                        title: 'Audio',
                        auto: 'Auto',
                    }
                }),
                artplayerPluginChapter({
                    chapters: fullData?.Chapters || [],
                }),
            ],
            customType: {
                m3u8: function playM3u8(video, url, art) {
                    if (Hls.isSupported()) {
                        if (art.hls) art.hls.destroy();
                        const hls = new Hls({
                            // debug: isDev,
                            debug:false,
                            autoStartLoad: true,
                            lowLatencyMode: true,
                            maxBufferLength: 120,
                            maxMaxBufferLength: 180,                            
                            xhrSetup: xhr => {
                                const environment = getBaseEnvironment(new URL(url, window.location.origin));
                                xhr.setRequestHeader('X-Environment', environment);

                                try {
                                    const jellyAccessToken = getCookie('jellyAccessToken');
                                    const jellyUserId = getCookie('jellyUserId');
                                    if (jellyAccessToken && jellyUserId) {
                                        xhr.setRequestHeader('Authorization', `monobar_user=${jellyUserId},monobar_token=${jellyAccessToken}`);
                                    }                                
                                } catch (error) {
                                    if (isDev) console.warn('Could not access auth cookies for HLS request:', error);
                                }
                            }
                        });
                          hls.on(Hls.Events.ERROR, function (event, data) {
                            if (isDev) console.error('HLS Error:', event, data);
                            
                            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                                if (data.response && data.response.code === 401) {
                                    alert('Server reported you are not authorized to access media fragments. Playback will be interrupted.');
                                    goto('/', { replaceState: true });
                                    return;
                                }
                            }
                            
                            if (data.fatal) {
                                handlePlayerError(data);
                            }
                        });
                        hls.loadSource(url);
                        hls.attachMedia(video);
                        art.hls = hls;
                        art.on('destroy', () => hls.destroy());
                    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = url;
                    } else {
                        alert("Your browser doesn't support HLS playback.");
                        art.notice.show = 'Unsupported playback format: m3u8';
                    }
                }
            },
        });
    }
}

function reportPlaybackStatus(intent: string) {
    if (!art || !fullData?.playbackUrl) return;
    const status = getStatusData();
    if (!status) return;
    const deviceId = getSessionId && getSessionId();
    if (!deviceId) return;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Session-Id': deviceId
    };
    const authHeader = getAuthorizationHeader && getAuthorizationHeader();
    if (authHeader) headers['Authorization'] = authHeader;
    fetch(`${BASE_API_PATH}/status`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            intent,
            ...status,
            playbackUrl: fullData.playbackUrl,
            type,
            playSessionId: deviceId
        })
    }).catch(err => {
        if (import.meta.env && import.meta.env.DEV) {
            console.warn('Error reporting playback status:', err);
        }
    });
}

onMount(() => {
    setupPlayer();
    playbackReportInterval = setInterval(() => reportPlaybackStatus('timeupdate'), 10000);
    return () => {
        if (art) art.destroy();
        if (playbackReportInterval) clearInterval(playbackReportInterval);
    };
});

unmount(() => {
    reportPlaybackStatus('stop');
    if (art) art.destroy();
    if (playbackReportInterval) clearInterval(playbackReportInterval);
});

function getStatusData(preservedCurrentTime = null) {
    if(!art || !art.video) {
        console.error("getStatusData called before/without player element mounted. Ignoring request.");
        return null;
    }
    const actualCurrentTime = preservedCurrentTime !== null ? preservedCurrentTime : art.currentTime;
    const currentTimeMs = actualCurrentTime * 1000;
    const positionTicks = Math.round(currentTimeMs * 10000);
    
    const bufferedRanges = [];
    if (art.video && art.video.buffered && art.video.buffered.length > 0) {
        for (let i = 0; i < art.video.buffered.length; i++) {
            bufferedRanges.push({
                start: art.video.buffered.start(i) * 10000000,
                end: art.video.buffered.end(i) * 10000000
            });
        }
    }

    return {
        VolumeLevel: Math.round((art.volume || 1) * 100),
        IsMuted: art.muted || false,
        IsPaused: art.paused || false,
        RepeatMode: "RepeatNone",
        ShuffleMode: "Sorted",
        MaxStreamingBitrate: art.hls?.levels?.[art.hls.currentLevel]?.bitrate || 0,
        PositionTicks: positionTicks,
        PlaybackStartTimeTicks: Date.now() * 10000,
        PlaybackRate: art.playbackRate || 1,
        SubtitleStreamIndex: art.subtitle ? (art.subtitle.currentIndex || -1) : -1,
        SecondarySubtitleStreamIndex: -1,
        AudioStreamIndex: art.hls ? (art.hls.audioTrack || 0) : 0,
        BufferedRanges: bufferedRanges,
        PlaylistItemId: `playlistItem0`,
        MediaSourceId: fullData?.MediaSourceId || fullData?.Id,
        CanSeek: art.video ? art.video.seekable.length > 0 : true,                
        ItemId: fullData?.Id,
        currentTime: actualCurrentTime,
        bufferedRange: art.video && art.video.buffered && art.video.buffered.length > 0 ? {
            start: art.video.buffered.start(0),
            end: art.video.buffered.end(0)
        } : null,
        seekableRange: art.video && art.video.seekable && art.video.seekable.length > 0 ? {
            start: art.video.seekable.start(0),
            end: art.video.seekable.end(0)
        } : null,
        currentSubtitleIndex: art.subtitle && art.subtitle.currentIndex,
        currentAudioIndex: art.hls && art.hls.audioTrack,
        mediaSourceId: fullData?.MediaSourceId,
        itemId: fullData?.Id,        
    };
}

function handlePlayerError(data) {
    if (isDev) console.error('Player error:', data);
    if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        art.notice.show = 'Media error occurred. Please try again later.';
    } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        art.notice.show = 'Network error occurred. Please check your connection.';
    } else {
        art.notice.show = 'An unexpected error occurred. Please try again.';
    }
}
</script>

<div bind:this={artRef} class="absolute w-full h-full left-0 right-0 top-0 bottom-0">
</div>
