export interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
  platform: string;
}

export const getDeviceInfo = (): DeviceInfo => {
  if (typeof window === 'undefined' || !navigator) {
    return {
      browser: 'Unknown',
      os: 'Unknown',
      device: 'Desktop',
      platform: 'Web',
    };
  }

  const ua = navigator.userAgent;

  // Browser Detection
  let browser = 'Chrome/Other';
  if (ua.indexOf('Firefox') > -1) {
    browser = 'Firefox';
  } else if (ua.indexOf('SamsungBrowser') > -1) {
    browser = 'Samsung Internet';
  } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
    browser = 'Opera';
  } else if (ua.indexOf('Trident') > -1) {
    browser = 'Internet Explorer';
  } else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg/') > -1) {
    browser = 'Microsoft Edge';
  } else if (ua.indexOf('Chrome') > -1) {
    browser = 'Chrome';
  } else if (ua.indexOf('Safari') > -1) {
    browser = 'Safari';
  }

  // OS Detection
  let os = 'Unknown OS';
  if (ua.indexOf('Win') > -1) os = 'Windows';
  else if (ua.indexOf('Mac') > -1) os = 'macOS';
  else if (ua.indexOf('Linux') > -1) os = 'Linux';
  else if (ua.indexOf('Android') > -1) os = 'Android';
  else if (ua.indexOf('like Mac') > -1 || ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';

  // Device Classification
  let device = 'Desktop';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch)))/i.test(ua);

  if (isTablet) {
    device = 'Tablet';
  } else if (isMobile) {
    device = 'Mobile';
  }

  return {
    browser,
    os,
    device,
    platform: `${device} (${os})`,
  };
};
