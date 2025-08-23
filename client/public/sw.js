const CACHE_NAME = 'cryptowallet-pro-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Return offline fallback for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/manifest.json',
      badge: '/manifest.json',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || 1
      },
      actions: [
        {
          action: 'explore',
          title: 'View Wallet',
          icon: '/manifest.json'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/manifest.json'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'CryptoWallet Pro', options)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app to wallet section
    event.waitUntil(
      clients.openWindow('/?section=wallet')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync event for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'crypto-sync') {
    event.waitUntil(
      // Sync crypto data when connection is restored
      syncCryptoData()
    );
  }
});

// Sync function for crypto data
async function syncCryptoData() {
  try {
    // This would sync pending transactions, price updates, etc.
    console.log('Syncing crypto data...');
    
    // In a real implementation, this would:
    // 1. Check for pending transactions
    // 2. Update token prices
    // 3. Sync user balance
    // 4. Update news feed
    
    return Promise.resolve();
  } catch (error) {
    console.error('Sync failed:', error);
    return Promise.reject(error);
  }
}

// Handle background fetch for large file downloads
self.addEventListener('backgroundfetch', (event) => {
  if (event.tag === 'crypto-data-update') {
    event.waitUntil(
      // Handle background data updates
      handleBackgroundFetch(event)
    );
  }
});

async function handleBackgroundFetch(event) {
  try {
    console.log('Background fetch completed:', event.tag);
    // Process the downloaded data
    return Promise.resolve();
  } catch (error) {
    console.error('Background fetch failed:', error);
    return Promise.reject(error);
  }
}
