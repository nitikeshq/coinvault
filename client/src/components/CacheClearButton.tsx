import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

export function CacheClearButton() {
  const [isClearing, setIsClearing] = useState(false);
  const { toast } = useToast();

  const clearAllCache = async () => {
    setIsClearing(true);
    
    try {
      // 1. Clear React Query cache
      queryClient.clear();
      
      // 2. Clear localStorage
      localStorage.clear();
      
      // 3. Clear sessionStorage
      sessionStorage.clear();
      
      // 4. Clear Service Worker cache
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      
      // 5. Clear browser caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      toast({
        title: "Cache Cleared! 🧹",
        description: "All app data cleared. Page will refresh in 2 seconds...",
      });
      
      // 6. Force complete page reload with stronger cache busting after 2 seconds
      setTimeout(() => {
        // Clear all possible browser caches more aggressively
        if ('caches' in window) {
          caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => caches.delete(cacheName));
          });
        }
        
        // Multiple cache-busting strategies
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        
        // Use location.replace to avoid back button issues
        window.location.replace(
          window.location.origin + 
          window.location.pathname + 
          '?cache_clear=' + timestamp + 
          '&bust=' + random + 
          '#cache_cleared'
        );
      }, 2000);
      
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: "Cache Clear Error",
        description: "Some cache couldn't be cleared. Try refreshing manually.",
        variant: "destructive",
      });
      setIsClearing(false);
    }
  };

  return (
    <Button
      onClick={clearAllCache}
      disabled={isClearing}
      variant="outline"
      size="sm"
      className="gap-2"
      data-testid="button-clear-cache"
    >
      {isClearing ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          Clearing Cache...
        </>
      ) : (
        <>
          <Trash2 className="h-4 w-4" />
          Clear Cache
        </>
      )}
    </Button>
  );
}