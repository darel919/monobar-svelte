// Utility functions for subtitle processing in WatchPlayer

export function getSubtitleFontSize(sizePreference: string | undefined): string {
    switch (sizePreference) {
        case 'small':
            return '18px';
        case 'large':
            return '32px';
        case 'medium':
        default:
            return '24px';
    }
}

export function adaptSubtitleFormat(subtitles: any[]): any[] {
    if (!Array.isArray(subtitles)) return [];
    return subtitles.map((track, idx) => ({
        name: track.DisplayTitle || track.Language || `Subtitle ${idx + 1}`,
        url: track.Url || track.url,
        type: track.Format || track.type || 'vtt',
        default: !!track.IsDefault,
    }));
}
