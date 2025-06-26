import { browser } from '$app/environment';
import { getVersionInfo } from '$lib/generated/version';

function getBrowserInfo() {
  if (!browser) {
    return {
      name: 'Server',
      version: '1.0.0',
      os: 'Server'
    };
  }
  
  const userAgent = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = '1.0.0';
  let osName = 'Unknown';
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browserName = 'Chrome';
    const match = userAgent.match(/Chrome\/([0-9.]+)/);
    if (match) browserVersion = match[1].split('.')[0];
  } else if (userAgent.includes('Firefox')) {
    browserName = 'Firefox';
    const match = userAgent.match(/Firefox\/([0-9.]+)/);
    if (match) browserVersion = match[1].split('.')[0];
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browserName = 'Safari';
    const match = userAgent.match(/Version\/([0-9.]+)/);
    if (match) browserVersion = match[1].split('.')[0];
  } else if (userAgent.includes('Edg')) {
    browserName = 'Edge';
    const match = userAgent.match(/Edg\/([0-9.]+)/);
    if (match) browserVersion = match[1].split('.')[0];
  }
  
  if (userAgent.includes('Windows NT 10.0')) {
    osName = 'Windows 10';
  } else if (userAgent.includes('Windows NT 6.3')) {
    osName = 'Windows 8.1';
  } else if (userAgent.includes('Windows NT 6.1')) {
    osName = 'Windows 7';
  } else if (userAgent.includes('Windows')) {
    osName = 'Windows';
  } else if (userAgent.includes('Mac OS X')) {
    const match = userAgent.match(/Mac OS X ([0-9_]+)/);
    if (match) {
      const version = match[1].replace(/_/g, '.');
      osName = `macOS ${version}`;
    } else {
      osName = 'macOS';
    }
  } else if (userAgent.includes('Linux')) {
    osName = 'Linux';
  } else if (userAgent.includes('Android')) {
    const match = userAgent.match(/Android ([0-9.]+)/);
    if (match) {
      osName = `Android ${match[1]}`;
    } else {
      osName = 'Android';
    }
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    const match = userAgent.match(/OS ([0-9_]+)/);
    if (match) {
      const version = match[1].replace(/_/g, '.');
      osName = `iOS ${version}`;
    } else {
      osName = 'iOS';
    }
  }
  
  return { name: browserName, version: browserVersion, os: osName };
}

export async function getDeviceProfileHeader(): Promise<string> {
  if (!browser) return 'Client: Server, Device: Server, ClientVersion: Server';
  
  try {
    const browserInfo = getBrowserInfo();
    const versionInfo = await getVersionInfo();
    return `Client: ${browserInfo.name} ${browserInfo.version}, Device: ${browserInfo.os}, ClientVersion: ${versionInfo.version}`;
  } catch (error) {
    console.error('Failed to get device info:', error);
    return 'Client: Unknown, Device: Unknown, ClientVersion: Unknown';
  }
}

export function getDeviceIdentification(): { name: string; id: string } {
  const browserInfo = getBrowserInfo();
  return {
    name: `Monobar (${browserInfo.name})`,
    id: `monobar-${Math.random().toString(36).substr(2, 9)}`
  };
}
