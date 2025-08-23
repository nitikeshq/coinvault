import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed (standalone mode)
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                              (window.navigator as any).standalone ||
                              document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show install prompt after 3 seconds if not in standalone mode
      if (!isStandalone) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed, dismissed this session, or no prompt available
  if (isStandalone || 
      !showInstallPrompt || 
      !deferredPrompt || 
      sessionStorage.getItem('pwa-install-dismissed')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">
                  Install CryptoWallet Pro
                </h3>
                <p className="text-xs text-blue-100 mt-1">
                  Add to your home screen for quick access and better performance
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-white hover:bg-white/20 h-6 w-6 p-0"
              data-testid="button-dismiss-install"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex space-x-2 mt-3">
            <Button
              size="sm"
              onClick={handleInstallClick}
              className="bg-white text-purple-600 hover:bg-gray-100 flex-1"
              data-testid="button-install-app"
            >
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-white hover:bg-white/20"
              data-testid="button-not-now"
            >
              Not now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}