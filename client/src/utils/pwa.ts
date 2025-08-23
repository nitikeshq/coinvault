// PWA utility functions for enhanced mobile experience

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Check if app is running in standalone mode (installed as PWA)
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone ||
    document.referrer.includes('android-app://')
  );
}

// Check if device is mobile
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Get device type
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const userAgent = navigator.userAgent;
  
  if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    return 'mobile';
  }
  
  if (/iPad|Android(?=.*Tablet)/i.test(userAgent)) {
    return 'tablet';
  }
  
  return 'desktop';
}

// Add to home screen functionality
export function addToHomeScreen(): Promise<string> {
  return new Promise((resolve, reject) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      resolve('ios-instructions');
    } else if (isAndroid) {
      resolve('android-instructions');
    } else {
      reject('unsupported');
    }
  });
}

// Vibrate for haptic feedback (mobile)
export function vibrate(pattern: number | number[] = 100): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

// Check if app is installable
export function isInstallable(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Handle orientation changes
export function handleOrientationChange(callback: (orientation: string) => void): () => void {
  const handleChange = () => {
    const orientation = screen.orientation?.type || 'unknown';
    callback(orientation);
  };

  screen.orientation?.addEventListener('change', handleChange);
  
  return () => {
    screen.orientation?.removeEventListener('change', handleChange);
  };
}

// Enable wake lock to prevent screen from sleeping
export async function enableWakeLock(): Promise<WakeLockSentinel | null> {
  if ('wakeLock' in navigator) {
    try {
      const wakeLock = await navigator.wakeLock.request('screen');
      return wakeLock;
    } catch (err) {
      console.error('Wake lock failed:', err);
    }
  }
  return null;
}

// Check network connectivity
export function getNetworkStatus(): {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
} {
  const online = navigator.onLine;
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  return {
    online,
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
  };
}

// Share API for mobile sharing
export async function shareContent(data: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (err) {
      console.error('Sharing failed:', err);
    }
  }
  return false;
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }
  
  // Fallback for older browsers
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  } catch (err) {
    console.error('Fallback copy failed:', err);
    return false;
  }
}

// Get battery status (if available)
export async function getBatteryStatus(): Promise<any> {
  if ('getBattery' in navigator) {
    try {
      return await (navigator as any).getBattery();
    } catch (err) {
      console.error('Battery API not available:', err);
    }
  }
  return null;
}