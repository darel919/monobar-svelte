export interface VersionInfo {
  version: string;
  buildDate: string;
  buildNumber: string;
}

export async function getVersionInfo(): Promise<VersionInfo> {
  try {
    const versionData = await import('./version-info.json');
    return versionData.default as VersionInfo;
  } catch (error) {
    console.warn('Failed to load version info:', error);
  }

  return {
    version: '0.0.1',
    buildDate: new Date().toISOString(),
    buildNumber: 'unknown'
  };
}
