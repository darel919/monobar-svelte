// Utilities for TV episode navigation and info
// Ported from episodeUtils.js (see NextJS version)

export interface Season {
  Id: string;
  IndexNumber: number;
  episodes: Episode[];
}

export interface Episode {
  Id: string;
  Name: string;
  IndexNumber: number;
  RunTimeTicks?: number;
  Overview?: string;
  PremiereDate?: string;
}

export interface SeriesData {
  Id: string;
  availableSeasons: Season[];
}

export function findNextEpisode(currentEpisodeId: string, seriesData: SeriesData): Episode | null {
  if (!seriesData?.availableSeasons || !currentEpisodeId) return null;
  for (const season of seriesData.availableSeasons) {
    const episodeIndex = season.episodes?.findIndex(ep => ep.Id === currentEpisodeId);
    if (episodeIndex !== -1 && episodeIndex !== undefined) {
      if (episodeIndex < season.episodes.length - 1) {
        return season.episodes[episodeIndex + 1];
      }
      const seasonIndex = seriesData.availableSeasons.indexOf(season);
      for (let i = seasonIndex + 1; i < seriesData.availableSeasons.length; i++) {
        const nextSeason = seriesData.availableSeasons[i];
        if (nextSeason.episodes?.length > 0) {
          return nextSeason.episodes[0];
        }
      }
      break;
    }
  }
  return null;
}

export function isAtAbsoluteEnd(currentEpisodeId: string, seriesData: SeriesData): boolean {
  if (!seriesData?.availableSeasons || !currentEpisodeId) return false;
  const lastSeasonWithEpisodes = [...seriesData.availableSeasons].reverse().find(season => season.episodes?.length > 0);
  if (!lastSeasonWithEpisodes) return false;
  const lastEpisode = lastSeasonWithEpisodes.episodes[lastSeasonWithEpisodes.episodes.length - 1];
  return lastEpisode.Id === currentEpisodeId;
}

export function getCurrentSeasonAndEpisodeNumbers(currentEpisodeId: string, seriesData: SeriesData) {
  if (!seriesData?.availableSeasons || !currentEpisodeId) return null;
  for (const season of seriesData.availableSeasons) {
    const episode = season.episodes?.find(ep => ep.Id === currentEpisodeId);
    if (episode) {
      return {
        seasonNumber: season.IndexNumber || 1,
        episodeNumber: episode.IndexNumber || 1,
        seasonId: season.Id,
        episodeId: episode.Id
      };
    }
  }
  return null;
}

export function getNextEpisodeInfo(nextEpisode: Episode, seriesData: SeriesData) {
  if (!nextEpisode || !seriesData?.availableSeasons) return null;
  for (const season of seriesData.availableSeasons) {
    const episode = season.episodes?.find(ep => ep.Id === nextEpisode.Id);
    if (episode) {
      return {
        id: episode.Id,
        title: episode.Name || `Episode ${episode.IndexNumber}`,
        seasonNumber: season.IndexNumber || 1,
        episodeNumber: episode.IndexNumber || 1,
        seriesId: seriesData.Id
      };
    }
  }
  return null;
}
