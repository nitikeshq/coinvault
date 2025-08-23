function App() {
  const currentPath = window.location.pathname;
  
  if (currentPath === '/marketplace/nfts') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <nav className="bg-black/20 backdrop-blur-lg rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">CryptoWallet Pro</h1>
            <div className="flex items-center space-x-4">
              <a href="/" className="text-gray-300 hover:text-white">Home</a>
              <a href="/marketplace/nfts" className="text-purple-400 font-semibold">NFTs</a>
              <a href="/marketplace/memes" className="text-gray-300 hover:text-white">Memes</a>
              <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                <span className="mr-1">⭐</span>
                <span>Premium</span>
                <span className="ml-2 text-xs opacity-90">(₹5.2K)</span>
              </div>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
                Login
              </button>
            </div>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4">NFT Marketplace</h1>
          <p className="text-gray-300 mb-8">Browse and trade unique digital collectibles</p>
          <div className="bg-slate-800 p-6 rounded-lg">
            <p className="text-white">Welcome to the NFT Marketplace! You can see your investment tag (Premium ⭐) in the navigation bar above showing your investor status.</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (currentPath === '/marketplace/memes') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <nav className="bg-black/20 backdrop-blur-lg rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">CryptoWallet Pro</h1>
            <div className="flex items-center space-x-4">
              <a href="/" className="text-gray-300 hover:text-white">Home</a>
              <a href="/marketplace/nfts" className="text-gray-300 hover:text-white">NFTs</a>
              <a href="/marketplace/memes" className="text-blue-400 font-semibold">Memes</a>
              <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                <span className="mr-1">⭐</span>
                <span>Premium</span>
                <span className="ml-2 text-xs opacity-90">(₹5.2K)</span>
              </div>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
                Login
              </button>
            </div>
          </div>
        </nav>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-4">Meme Marketplace</h1>
          <p className="text-gray-300 mb-8">Share laughs, trade memes, and spread joy</p>
          <div className="bg-slate-800 p-6 rounded-lg">
            <p className="text-white">Welcome to the Meme Marketplace! Your Premium investor tag (⭐ Premium) shows in the navigation bar above.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">CryptoWallet Pro</h1>
        <p className="text-gray-300 mb-8">Investment Tagging System Ready!</p>
        
        {/* Demo of different investment tiers */}
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
          <a href="/marketplace/nfts" className="block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors">
            Visit NFT Marketplace (See Premium Tag)
          </a>
          <a href="/marketplace/memes" className="block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
            Visit Meme Marketplace (See Premium Tag)
          </a>
        </div>
        <p className="text-gray-400 mt-6">User tags appear in navigation based on investment amounts!</p>
      </div>
    </div>
  );
}

export default App;