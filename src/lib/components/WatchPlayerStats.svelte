<script lang="ts">
import { onDestroy } from 'svelte';
import { writable } from 'svelte/store';

export let visible: boolean = false;
export let art: any = null;
export let onClose: (() => void) | undefined;

const stats = writable({
    resolution: '',
    currentTime: '',
    duration: '',
    bufferHealth: '',
    quality: '',
    audioCodec: '',
    audioChannel: '',
    videoCodec: '',
    bitrate: '',
    streamUrl: '',
    bandwidth: ''
});

let intervalRef: any = null;

function parseCodecFromUrl(url: string, key: string): string {
    if (!url) return '';
    const match = url.match(new RegExp(key + '=([^&]+)'));
    return match ? decodeURIComponent(match[1]) : '';
}

function parseAudioChannelFromUrl(url: string): string {
    if (!url) return '';
    const match = url.match(/AudioChannels=(\d+)/i);
    return match ? `${match[1]}ch` : '';
}

function getAudioChannelCount(video: HTMLVideoElement): string {
    // Try to use browser's audioTracks API if available
    if (video.audioTracks && video.audioTracks.length > 0) {
        // Most browsers only expose one track, but check for channelCount
        const track = video.audioTracks[0];
        // @ts-ignore
        if (track && typeof track.channelCount === 'number') {
            return `${track.channelCount}ch`;
        }
    }
    // Fallback: try webkitAudioDecodedByteCount (not channel count, but can indicate stereo/mono)
    // Not reliable, but if nothing else, fallback to 2ch for stereo
    return '';
}

function parseBitrateFromUrl(url: string): string {
    if (!url) return '';
    const videoMatch = url.match(/VideoBitrate=(\d+)/i);
    const audioMatch = url.match(/AudioBitrate=(\d+)/i);
    let total = 0;
    if (videoMatch) total += parseInt(videoMatch[1], 10);
    if (audioMatch) total += parseInt(audioMatch[1], 10);
    return total > 0 ? `${(total / 1000).toFixed(0)} kbps` : '';
}

function updateStats() {
    // Defensive: always use the latest art reference
    const artInstance = art;
    if (!artInstance || !artInstance.video) return;
    let bufferHealth = 0;
    const video = artInstance.video;
    if (video.buffered && video.buffered.length > 0) {
        bufferHealth = Math.max(0, video.buffered.end(video.buffered.length - 1) - video.currentTime);
    }

    let audioCodec = '', videoCodec = '', audioChannel = '', bitrate = '', streamUrl = '', quality = '', bandwidth = '';
    let resolution = '';
    if (video.videoWidth && video.videoHeight) {
        resolution = `${video.videoWidth}x${video.videoHeight}`;
    }
    let hlsLevelHeight = null;
    if (artInstance.hls && artInstance.hls.levels && typeof artInstance.hls.currentLevel === 'number' && artInstance.hls.currentLevel >= 0) {
        const level = artInstance.hls.levels[artInstance.hls.currentLevel];
        if (level) {
            if (level.codecs) {
                const codecs = level.codecs.split(',');
                codecs.forEach(c => {
                    if (c.trim().startsWith('avc1') || c.trim().startsWith('hev1') || c.trim().startsWith('vp9') || c.trim().startsWith('av01')) {
                        videoCodec = c.trim();
                    } else if (c.trim().startsWith('mp4a') || c.trim().startsWith('ac-3') || c.trim().startsWith('ec-3') || c.trim().startsWith('opus')) {
                        audioCodec = c.trim();
                    }
                });
                if (!videoCodec && !audioCodec) {
                    videoCodec = level.codecs;
                }
            }
            if (!videoCodec && level.videoCodec) videoCodec = level.videoCodec;
            if (!audioCodec && level.audioCodec) audioCodec = level.audioCodec;
            if (level.audioChannels) {
                audioChannel = `${level.audioChannels}ch`;
            }
            bitrate = level.bitrate ? `${(level.bitrate / 1000).toFixed(0)} kbps` : '';
            if (level.url && level.url.length > 0) {
                streamUrl = level.url[0];
            }
            if (level.height) {
                hlsLevelHeight = level.height;
            }
        }
    }
    if ((!videoCodec || !audioCodec) && artInstance.hls && artInstance.hls.media) {
        if (artInstance.hls.media.codecs) {
            const codecs = artInstance.hls.media.codecs.split(',');
            codecs.forEach(c => {
                if (!videoCodec && (c.trim().startsWith('avc1') || c.trim().startsWith('hev1') || c.trim().startsWith('vp9') || c.trim().startsWith('av01'))) {
                    videoCodec = c.trim();
                } else if (!audioCodec && (c.trim().startsWith('mp4a') || c.trim().startsWith('ac-3') || c.trim().startsWith('ec-3') || c.trim().startsWith('opus'))) {
                    audioCodec = c.trim();
                }
            });
        }
    }
    // Fallback: parse from streamUrl if still missing
    if ((!videoCodec || !audioCodec || !audioChannel) && streamUrl) {
        if (!videoCodec) videoCodec = parseCodecFromUrl(streamUrl, 'VideoCodec');
        if (!audioCodec) audioCodec = parseCodecFromUrl(streamUrl, 'AudioCodec');
        if (!audioChannel) audioChannel = parseAudioChannelFromUrl(streamUrl);
    }
    // Fallback: parse bitrate from streamUrl if not available
    if (!bitrate && streamUrl) {
        bitrate = parseBitrateFromUrl(streamUrl);
    }
    // Bandwidth: prefer artInstance.hls.bandwidth, fallback to hls.stats.bandwidthEstimate
    if (artInstance.hls) {
        // let bw = undefined;
        const bw = art.hls.bandwidthEstimate;
        if (bw >= 1000000) {
            bandwidth = (bw / 1000000).toFixed(2) + ' Mbps';
        } else if (bw >= 1000) {
            bandwidth = (bw / 1000).toFixed(0) + ' kbps';
        } else {
            bandwidth = bw + ' bps';
        }
        if (bw) {
            bandwidth = bw >= 1_000_000 ? `${(bw / 1_000_000).toFixed(2)} Mbps` : `${(bw / 1000).toFixed(0)} kbps`;
        }
    }
    // Quality: prefer the greater of video.videoHeight or HLS level height
    if (video.videoHeight && (!hlsLevelHeight || video.videoHeight >= hlsLevelHeight)) {
        quality = `${video.videoHeight}P`;
    } else if (hlsLevelHeight) {
        quality = `${hlsLevelHeight}P`;
    }
    // fallback for audio channel: use browser info if available
    if (!audioChannel || audioChannel === '0ch' || audioChannel === '1ch' || audioChannel === '6ch') {
        audioChannel = getAudioChannelCount(video);
    }
    // fallback for duration
    let duration = '';
    if (video.duration && !isNaN(video.duration)) {
        duration = video.duration.toFixed(1);
    }
    // fallback for currentTime
    let currentTime = '';
    if (video.currentTime !== undefined && !isNaN(video.currentTime)) {
        currentTime = video.currentTime.toFixed(1);
    }
    // force update by setting a new object
    stats.set({
        resolution,
        currentTime,
        duration,
        bufferHealth: bufferHealth ? bufferHealth.toFixed(2) : '',
        quality,
        audioCodec,
        audioChannel,
        videoCodec,
        bitrate,
        streamUrl,
        bandwidth
    });
}

// Svelte store subscription for template reactivity
$: $stats = stats;

// Reactively watch art and visible, always update and restart interval
$: if (visible && art) {
    updateStats();
    if (intervalRef) clearInterval(intervalRef);
    intervalRef = setInterval(updateStats, 500);
} else {
    if (intervalRef) {
        clearInterval(intervalRef);
        intervalRef = null;
    }
    stats.set({
        resolution: '',
        currentTime: '',
        duration: '',
        bufferHealth: '',
        quality: '',
        audioCodec: '',
        audioChannel: '',
        videoCodec: '',
        bitrate: '',
        streamUrl: '',
        bandwidth: ''
    });
}

onDestroy(() => {
    if (intervalRef) {
        clearInterval(intervalRef);
        intervalRef = null;
    }
});
</script>

{#if visible}
<div class="absolute top-4 left-4 z-50 bg-black bg-opacity-90 rounded-lg shadow-lg p-6 text-white min-w-[420px] max-w-[520px]">
    <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold text-lg">Stats for Nerds</h3>
        <button class="btn btn-sm btn-circle btn-ghost text-white" on:click={onClose}>✕</button>
    </div>
    <div class="text-sm">
        <div><b>Resolution:</b> {$stats.resolution}</div>
        <!-- <div><b>Current Time:</b> {$stats.currentTime}</div> -->
        <!-- <div><b>Duration:</b> {$stats.duration}</div> -->
        <div><b>Buffer Health:</b> {$stats.bufferHealth}</div>
        <div class="col-span-2">
            <div class="w-full h-2 bg-gray-700 rounded overflow-hidden mt-1 mb-2">
                <div class="h-full bg-green-500" style="width: {Math.min(100, Math.max(0, (parseFloat($stats.bufferHealth) / 120) * 100))}%"></div>
            </div>
        </div>
        <div><b>Bandwidth:</b> {$stats.bandwidth}</div>
        <div><b>Quality:</b> {$stats.quality}</div>
        <div><b>Audio Codec:</b> {$stats.audioCodec}</div>
        <div><b>Audio Channel:</b> {$stats.audioChannel}</div>
        <div><b>Video Codec:</b> {$stats.videoCodec}</div>
        <div><b>Bitrate:</b> {$stats.bitrate}</div>
    </div>
    <div class="flex justify-end mt-4">
        <button class="btn btn-sm" on:click={onClose}>Close</button>
    </div>
</div>
{/if}
