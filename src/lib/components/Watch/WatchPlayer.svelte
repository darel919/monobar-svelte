<!--
@component
WatchPlayer – Svelte video player component using Artplayer and HLS.js

Props:
- poster: string | null – Poster image URL for the video (optional)
- fullData: object – Media source and metadata (must include `src` and optionally `Chapters`)
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
import { onMount, onDestroy } from 'svelte';
import { writable } from 'svelte/store';
import { goto } from '$app/navigation';
import { getBaseEnvironment } from '$lib/utils/environment.js';
import { getCookie } from '$lib/utils/cookieUtils.js';
import { getAuthorizationHeader, getSessionId } from '$lib/utils/authUtils';
import { BASE_API_PATH } from '$lib/config/api';
import WatchPlayerStats from './WatchPlayerStats.svelte';
import Settings from '../Settings.svelte';
import PlayNext from './WatchPlayNext.svelte';
import { browser } from '$app/environment';
import { useSettingsStore } from '$lib/stores/settings';
import { findNextEpisode, getNextEpisodeInfo, type SeriesData } from '$lib/utils/episodeUtils';
import Hls from 'hls.js';

const isDev = import.meta.env && import.meta.env.DEV;

export let poster: string | null = null;
export let fullData: any = null;
export let type: string;
export let id: string | null = null;
export let seriesData: SeriesData | null = null;

let art: any; // ensure art is declared and accessible
let artRef: HTMLDivElement | null = null;
export const artStore = writable<any>(null);
let showSettings = false;
let playbackReportInterval: ReturnType<typeof setInterval> | null = null;
let isPlaying = false;
let userSubtitleSize: string = 'medium';
let settingsStore = useSettingsStore();
let settingsUnsubscribe: (() => void) | null = null;
let selectedSubtitle: any = null;
let wasInFullscreen = false;
let userQualitySelected = false;
let showStatsModal = false;
let showPlayerSettingsModal = false;
let lastPlayerId: string | null = null;
let isMounted = false;

// Play Next functionality
let showPlayNext = false;
let nextEpisodeInfo: any = null;
let timeUpdateInterval: ReturnType<typeof setInterval> | null = null;
let secondsRemaining = 0;
let wasFullscreenBeforePlayNext = false;
let playNextDismissedForEpisode = false;

function startPlaybackReporting() {
    if (playbackReportInterval) clearInterval(playbackReportInterval);
    playbackReportInterval = setInterval(() => reportPlaybackStatus('timeupdate'), 7000);
}

function stopPlaybackReporting() {
    if (playbackReportInterval) {
        clearInterval(playbackReportInterval);
        playbackReportInterval = null;
    }
}

function startTimeTracking() {
    if (timeUpdateInterval) clearInterval(timeUpdateInterval);
    timeUpdateInterval = setInterval(() => {
        checkPlayNextTiming();
    }, 1000);
}

function stopTimeTracking() {
    if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval);
        timeUpdateInterval = null;
    }
}

function checkPlayNextTiming() {
    if (!art || !art.video || !seriesData || type !== 'Episode') return;
    
    const settings = settingsStore.get();
    if (!settings.playNextEnabled) return;

    const currentTime = art.currentTime;
    const duration = art.duration;
    secondsRemaining = duration - currentTime;

    // Only proceed if we have valid timing data
    if (!duration || duration <= 0 || secondsRemaining <= 0) return;

    // Get next episode if we haven't already
    if (!nextEpisodeInfo && id) {
        const nextEpisode = findNextEpisode(id, seriesData);
        if (nextEpisode) {
            nextEpisodeInfo = getNextEpisodeInfo(nextEpisode, seriesData);
        }
    }

    // Show Play Next prompt if within threshold and we have next episode
    if (nextEpisodeInfo && secondsRemaining <= settings.playNextShowThreshold && !showPlayNext && !playNextDismissedForEpisode) {
        // Exit fullscreen to show PlayNext component
        if (art && art.fullscreen) {
            wasFullscreenBeforePlayNext = true;
            art.fullscreen = false;
        } else {
            wasFullscreenBeforePlayNext = false;
        }
        showPlayNext = true;
    }
}

function handlePlayNext() {
    if (nextEpisodeInfo) {
        const watchUrl = `/watch?id=${nextEpisodeInfo.id}&type=Episode&seriesId=${nextEpisodeInfo.seriesId}`;
        
        // Store fullscreen preference for next episode
        if (wasFullscreenBeforePlayNext) {
            sessionStorage.setItem('restoreFullscreen', 'true');
        }
        
        goto(watchUrl);
    }
    showPlayNext = false;
}

function handleCancelPlayNext() {
    showPlayNext = false;
    playNextDismissedForEpisode = true;
    
    // Restore fullscreen if user cancels
    if (wasFullscreenBeforePlayNext && art) {
        art.fullscreen = true;
        wasFullscreenBeforePlayNext = false;
    }
}

function handleArtEvents() {
    if (!art) return;
    art.on('play', () => {
        isPlaying = true;
        stopPlaybackReporting(); // Ensure no duplicate intervals
        startPlaybackReporting();
        startTimeTracking(); // Start tracking for Play Next
    });
    art.on('pause', () => {
        isPlaying = false;
        stopPlaybackReporting();
        reportPlaybackStatus('pause');
        stopTimeTracking(); // Stop tracking when paused
    });
    art.on('destroy', () => {
        stopPlaybackReporting();
        stopTimeTracking();
        reportPlaybackStatus('stop');
    });
    // Re-apply subtitle style on subtitle switch
    art.on('subtitleSwitch', () => {
        setTimeout(() => {
            applySubtitleStyle(userSubtitleSize);
        }, 100);
    });
    // Start reporting if already playing (autoplay)
    if (!art.paused) {
        isPlaying = true;
        stopPlaybackReporting();
        startPlaybackReporting();
        startTimeTracking(); // Start tracking for autoplay
    }
}



function getUserPreference(key: string, fallback: any) {
    try {
        return localStorage.getItem(key) || fallback;
    } catch {
        return fallback;
    }
}
function setUserPreference(key: string, value: any) {
    try {
        localStorage.setItem(key, value);
    } catch {}
}

// --- TypeScript type fixes for all arrow functions and object keys ---
const getSubtitleFontSize = (sizePreference: string): string => {
    const sizeMap: Record<string, string> = {
        'small': '18px',
        'medium': '24px',
        'large': '32px',
        'x-large': '40px'
    };
    return sizeMap[sizePreference] || sizeMap['medium'];
};
const adaptSubtitleFormat = () => {
    if (!fullData?.subtitles?.length) return [];
    try {
        const nameCount: Record<string, number> = {};
        return fullData.subtitles.map((subitem: any, index: number) => {
            let name = subitem.name || subitem.html || `Subtitle ${index+1}`;
            if (nameCount[name]) {
                nameCount[name] += 1;
                name = `${name} (${nameCount[name]})`;
            } else {
                nameCount[name] = 1;
            }
            // Rewrite absolute URL to relative path for proxying
            let url = subitem.url;
            if (url && url.startsWith('http://api.server.drl') && isDev) {
                const u = new URL(url);
                url = u.pathname + u.search;
            }
            return {
                ...subitem,
                url,
                name,
                html: name,
                default: index === 0
            };
        });
    } catch (error) {
        return [];
    }
};    

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

async function initializePlayer() {
    if (!browser || !artRef || !fullData?.playbackUrl) return;
    const { default: Artplayer } = await import('artplayer');
    const Hls = (await import('hls.js')).default;
    const artplayerPluginHlsControl = (await import('artplayer-plugin-hls-control')).default;
    const artplayerPluginChapter = (await import('artplayer-plugin-chapter')).default;
    const subtitles = adaptSubtitleFormat();
    // --- Subtitle preference logic ---
    const subtitlePref = getUserPreference('subtitlePref', null);
    if (subtitles.length > 0) {
        if (subtitlePref) {
            selectedSubtitle = subtitles.find((s: any) => s.name === subtitlePref) || subtitles[0];
        } else {
            selectedSubtitle = subtitles.find((s: any) => s.default) || subtitles[0];
        }
    } else {
        selectedSubtitle = null;
    }
    // --- End subtitle preference logic ---
    
    const currentSubtitleSizePref = settingsStore.get().subtitleSize;
    userSubtitleSize = currentSubtitleSizePref;
    Artplayer.AUTO_PLAYBACK_TIMEOUT = 15000;
    Artplayer.RECONNECT_SLEEP_TIME  = 3000;
    Artplayer.RECONNECT_TIME_MAX  = 7;
    art = new Artplayer({
        container: artRef,
        url: fullData.playbackUrl,
        poster: poster || '',
        setting: true,
        autoplay: true,
        fullscreen: true,
        mutex: true,
        subtitleOffset: true,
        lang: navigator.language.toLowerCase(),
        backdrop: true,
        autoPlayback: true,
        hotkey: true,
        pip: true,
        airplay: true,
        theme: '#ff0000',
        type: 'm3u8',
        autoMini: true,
        contextmenu: [],
        subtitle: selectedSubtitle ? {
            url: selectedSubtitle.url,
            type: 'vtt',
            escape: true,
            encoding: 'utf-8',
        } : {},
        settings: [
            ...(subtitles.length > 0 ? [{
                width: 250,
                html: 'Subtitle',
                tooltip: selectedSubtitle?.name,
                selector: subtitles,                    
                onSelect: function (item: any) {
                    art.subtitle.switch(item.url, {
                        name: item.html,
                        escape: true,
                    });
                    setUserPreference('subtitlePref', item.name);
                    setTimeout(() => {
                        const currentSubtitleSizePref = getUserPreference('subtitleSize', 'medium');
                        const fontSize = getSubtitleFontSize(currentSubtitleSizePref);
                        art.subtitle.style({
                            fontSize: fontSize,
                            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                            fontWeight: 'bold'
                        });
                    }, 100);
                    return item.html;
                },                  
            }] : []),
            {
                html: 'Stats for Nerds',
                tooltip: 'Show playback stats',
                onClick: function () {
                    if (art && art.fullscreen) {
                        wasInFullscreen = true;
                        art.fullscreen = false;
                    } else {
                        wasInFullscreen = false;
                    }
                    openStats();
                    return '';
                }
            },
            {
                html: 'Player Settings',
                tooltip: 'Adjust player settings',
                onClick: function () {
                    if (art && art.fullscreen) {
                        wasInFullscreen = true;
                        art.fullscreen = false;
                    } else {
                        wasInFullscreen = false;
                    }
                    openPlayerSettings();
                    return '';
                }
            },
        ],
        plugins: [
            artplayerPluginHlsControl({
                 quality: {
                    control: true,
                    setting: true,
                    getName: (level: any) => level.height + 'P',
                    title: 'Quality',
                    auto: 'Auto',
                },
                audio: {
                    control: true,
                    setting: true,
                    getName: (track: any) => (track && typeof track.name === 'string' ? track.name : 'Track'),
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
                        debug: false,
                        autoStartLoad: true,
                        lowLatencyMode: true,
                        maxBufferLength: 120,
                        maxMaxBufferLength: 180,
                        xhrSetup: (xhr) => {
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
                    hls.on(Hls.Events.MANIFEST_PARSED, function () {
                        if (hls.levels && hls.levels.length > 0 && !userQualitySelected) {
                            const qualityPref = getUserPreference('qualityPref', null);
                            let initialLevel = hls.levels.length - 1;
                            if (qualityPref) {
                                const idx = hls.levels.findIndex((l) => l.height + 'P' === qualityPref);
                                if (idx !== -1) initialLevel = idx;
                            }
                            hls.currentLevel = initialLevel;
                                if (art.setting && Array.isArray(art.setting)) {
                                    const qualitySetting = art.setting.find((s: any) => s.html === 'Quality');
                                if (qualitySetting) {
                                    qualitySetting.tooltip = hls.levels[initialLevel].height + 'P';
                                }
                            }
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
    artStore.set(art);
    handleArtEvents();
    // Immediately apply subtitle style after Artplayer is initialized
    applySubtitleStyle(userSubtitleSize);
    
    // Restore fullscreen if coming from PlayNext navigation
    if (browser && sessionStorage.getItem('restoreFullscreen') === 'true') {
        sessionStorage.removeItem('restoreFullscreen');
        // Wait a bit for the player to be fully initialized
        setTimeout(() => {
            if (art && art.video) {
                art.fullscreen = true;
            }
        }, 1000);
    }
}

// Watch for id changes to destroy and re-init player
$: if (browser && typeof id !== 'undefined' && id && id !== lastPlayerId && isMounted) {
    if (art) {
        stopPlaybackReporting();
        stopTimeTracking();
        reportPlaybackStatus('stop');
        art.destroy();
        art = null;
    }
    // Reset Play Next state when changing episodes
    showPlayNext = false;
    nextEpisodeInfo = null;
    playNextDismissedForEpisode = false;
    lastPlayerId = id;
    initializePlayer();
}

onMount(() => {
    isMounted = true;
    settingsUnsubscribe = settingsStore.subscribe((settings: any) => {
        if (settings.subtitleSize !== userSubtitleSize) {
            userSubtitleSize = settings.subtitleSize;
            applySubtitleStyle(userSubtitleSize);
        }
    });
    if (typeof id !== 'undefined' && id) {
        lastPlayerId = id;
        initializePlayer();
    }
    return () => {
        isMounted = false;
        stopPlaybackReporting();
        stopTimeTracking();
        reportPlaybackStatus('stop');
        if (art) {
            art.destroy();
            art = null;
        }
        if (settingsUnsubscribe) settingsUnsubscribe();
    };
});

onDestroy(() => {
    isMounted = false;
    stopPlaybackReporting();
    stopTimeTracking();
    reportPlaybackStatus('stop');
    if (art) {
        art.destroy();
        art = null;
    }
});

function getStatusData(preservedCurrentTime = null) {
    if(!art || !art.video) {
        console.error("getStatusData called before/without player element mounted. Ignoring request.");
        return null;
    }
    const actualCurrentTime = preservedCurrentTime !== null ? preservedCurrentTime : art.currentTime;
    const currentTimeMs = actualCurrentTime * 1000;
    const positionTicks = Math.round(currentTimeMs * 10000);
    
    const bufferedRanges: {start: number, end: number}[] = [];
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

function handlePlayerError(data: any) {
    if (isDev) console.error('Player error:', data);
    if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
        art.notice.show = 'Media error occurred. Please try again later.';
    } else if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
        art.notice.show = 'Network error occurred. Please check your connection.';
    } else {
        art.notice.show = 'An unexpected error occurred. Please try again.';
    }
}

function openStats() {
    showStatsModal = true;
}
function closeStats() {
    showStatsModal = false;
}

function openPlayerSettings() {
    showPlayerSettingsModal = true;
}
function closePlayerSettings() {
    showPlayerSettingsModal = false;
}

function applySubtitleStyle(size: string) {
    if (art && art.subtitle) {
        const fontSize = getSubtitleFontSize(size);
        art.subtitle.style({
            fontSize,
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
            fontWeight: 'bold'
        });
    }
}

// Reactively update subtitle font size when userSubtitleSize changes and art is initialized
$: if (art && userSubtitleSize) {
    applySubtitleStyle(userSubtitleSize);
}
</script>

<!-- Player container -->
<div bind:this={artRef} class="absolute w-full h-full left-0 right-0 top-0 bottom-0"></div>

{#if showPlayerSettingsModal}
    <div class="modal modal-open">
        <div class="modal-box max-w-2xl max-h-[90vh] overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h3 class="font-bold text-lg">Player Settings</h3>
                <button class="btn btn-sm btn-circle btn-ghost" on:click={closePlayerSettings}>✕</button>
            </div>
            <Settings showBackButton={false} context="player" />
            <div class="modal-action">
                <button class="btn" on:click={closePlayerSettings}>Close</button>
            </div>
        </div>
    </div>
{/if}

{#if showStatsModal}
    <WatchPlayerStats visible={showStatsModal} art={$artStore} onClose={closeStats} />
{/if}

{#if showPlayNext && nextEpisodeInfo}
    <PlayNext 
        visible={showPlayNext}
        {secondsRemaining}
        {nextEpisodeInfo}
        on:playNext={handlePlayNext}
        on:cancel={handleCancelPlayNext}
    />
{/if}

