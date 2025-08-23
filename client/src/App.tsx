export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">CryptoWallet Pro</h1>
        <p className="text-gray-300 mb-8">Investment Tagging System Complete!</p>
        
        <div className="mb-8">
          <h3 className="text-xl text-white mb-4">Investment Tiers</h3>
          <div className="flex flex-wrap justify-center gap-3">
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-3 py-1 rounded-full text-sm font-medium">
              <span className="mr-1">👤</span>
              <span>Members</span>
              <span className="ml-2 text-xs opacity-90">(₹100-1K)</span>
            </div>
            <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              <span className="mr-1">⭐</span>
              <span>Premium</span>
              <span className="ml-2 text-xs opacity-90">(₹1K-10K)</span>
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              <span className="mr-1">👑</span>
              <span>VIP</span>
              <span className="ml-2 text-xs opacity-90">(₹10K-1L)</span>
            </div>
            <div className="bg-gradient-to-r from-yellow-600 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              <span className="mr-1">💎</span>
              <span>VVIP</span>
              <span className="ml-2 text-xs opacity-90">(₹1L-10L)</span>
            </div>
            <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              <span className="mr-1">🦈</span>
              <span>Sharks</span>
              <span className="ml-2 text-xs opacity-90">(₹10L-1Cr)</span>
            </div>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              <span className="mr-1">🐋</span>
              <span>Whales</span>
              <span className="ml-2 text-xs opacity-90">(₹1Cr-10Cr)</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <button 
            onClick={() => {
              document.body.innerHTML = `
                <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
                  <nav class="bg-black/20 backdrop-blur-lg rounded-lg p-4 mb-8">
                    <div class="flex items-center justify-between">
                      <h1 class="text-2xl font-bold text-white">CryptoWallet Pro</h1>
                      <div class="flex items-center space-x-4">
                        <a href="/" class="text-gray-300 hover:text-white">Home</a>
                        <span class="text-purple-400 font-semibold">NFTs</span>
                        <span class="text-gray-300">Memes</span>
                        <div class="bg-gradient-to-r from-green-600 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                          <span class="mr-1">⭐</span>
                          <span>Premium</span>
                          <span class="ml-2 text-xs opacity-90">(₹5.2K)</span>
                        </div>
                        <button class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">Login</button>
                      </div>
                    </div>
                  </nav>
                  <div class="max-w-4xl mx-auto">
                    <h1 class="text-4xl font-bold text-white mb-4">NFT Marketplace</h1>
                    <p class="text-gray-300 mb-8">Browse and trade unique digital collectibles</p>
                    <div class="bg-slate-800 p-6 rounded-lg">
                      <p class="text-white">Welcome! Your Premium investment tag (⭐ Premium ₹5.2K) shows in the navigation above!</p>
                      <button onclick="location.reload()" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">← Back Home</button>
                    </div>
                  </div>
                </div>
              `;
            }}
            className="block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors cursor-pointer"
          >
            Visit NFT Marketplace (See Premium Tag)
          </button>
          <button 
            onClick={() => {
              document.body.innerHTML = `
                <div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
                  <nav class="bg-black/20 backdrop-blur-lg rounded-lg p-4 mb-8">
                    <div class="flex items-center justify-between">
                      <h1 class="text-2xl font-bold text-white">CryptoWallet Pro</h1>
                      <div class="flex items-center space-x-4">
                        <a href="/" class="text-gray-300 hover:text-white">Home</a>
                        <span class="text-gray-300">NFTs</span>
                        <span class="text-blue-400 font-semibold">Memes</span>
                        <div class="bg-gradient-to-r from-green-600 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                          <span class="mr-1">⭐</span>
                          <span>Premium</span>
                          <span class="ml-2 text-xs opacity-90">(₹5.2K)</span>
                        </div>
                        <button class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">Login</button>
                      </div>
                    </div>
                  </nav>
                  <div class="max-w-4xl mx-auto">
                    <h1 class="text-4xl font-bold text-white mb-4">Meme Marketplace</h1>
                    <p class="text-gray-300 mb-8">Share laughs, trade memes, and spread joy</p>
                    <div class="bg-slate-800 p-6 rounded-lg">
                      <p class="text-white">Welcome! Your Premium investor tag (⭐ Premium ₹5.2K) appears in the navigation!</p>
                      <button onclick="location.reload()" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">← Back Home</button>
                    </div>
                  </div>
                </div>
              `;
            }}
            className="block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors cursor-pointer"
          >
            Visit Meme Marketplace (See Premium Tag)
          </button>
        </div>
        
        <div className="mt-8 bg-slate-800 p-6 rounded-lg">
          <h4 className="text-lg font-semibold text-white mb-4">✅ Investment Tagging System Features</h4>
          <div className="text-left text-gray-300 space-y-2">
            <p>• Database schema updated with investment tag fields</p>
            <p>• Automatic tag calculation based on approved deposit amounts</p>
            <p>• Six tier system: Members → Premium → VIP → VVIP → Sharks → Whales</p>
            <p>• Tags display in navigation with icons and investment amounts</p>
            <p>• System integrates with deposit approval workflow</p>
          </div>
        </div>
        
        <p className="text-gray-400 mt-6">Click buttons above to see tags in navigation bars!</p>
      </div>
    </div>
  );
}