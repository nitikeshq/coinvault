function App() {
  const currentPath = window.location.pathname;
  
  if (currentPath === '/marketplace/nfts') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <nav className="bg-black/20 backdrop-blur-lg rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">CryptoWallet Pro</h1>
            <div className="flex space-x-4">
              <a href="/" className="text-gray-300 hover:text-white">Home</a>
              <a href="/marketplace/nfts" className="text-purple-400 font-semibold">NFTs</a>
              <a href="/marketplace/memes" className="text-gray-300 hover:text-white">Memes</a>
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
            <p className="text-white">Welcome to the NFT Marketplace! You can see the navigation bar above showing your login status.</p>
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
            <div className="flex space-x-4">
              <a href="/" className="text-gray-300 hover:text-white">Home</a>
              <a href="/marketplace/nfts" className="text-gray-300 hover:text-white">NFTs</a>
              <a href="/marketplace/memes" className="text-blue-400 font-semibold">Memes</a>
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
            <p className="text-white">Welcome to the Meme Marketplace! You can see the navigation bar above showing menu options.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">CryptoWallet Pro</h1>
        <p className="text-gray-300 mb-8">Your marketplace is ready with navigation!</p>
        <div className="space-y-4">
          <a href="/marketplace/nfts" className="block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors">
            Visit NFT Marketplace
          </a>
          <a href="/marketplace/memes" className="block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
            Visit Meme Marketplace
          </a>
        </div>
        <p className="text-gray-400 mt-6">Navigation bars are now visible on marketplace pages!</p>
      </div>
    </div>
  );
}

export default App;