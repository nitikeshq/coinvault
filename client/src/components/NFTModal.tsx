import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2, Copy } from "lucide-react";

interface NFTModalProps {
  nft: any;
  isOpen: boolean;
  onClose: () => void;
  onShare: (platform: string, nft: any) => void;
  onCopy: (text: string) => void;
}

export function NFTModal({ nft, isOpen, onClose, onShare, onCopy }: NFTModalProps) {
  const [imageLoading, setImageLoading] = useState(true);

  const handleShare = (platform: string) => {
    onShare(platform, nft);
    onClose();
  };

  const handleCopyNFT = () => {
    const nftInfo = `Check out my NFT: ${nft.name}\nRarity: ${nft.rarity}\nDescription: ${nft.description}`;
    onCopy(nftInfo);
  };

  const rarityColors = {
    Common: "bg-gray-500",
    Rare: "bg-blue-500", 
    Epic: "bg-purple-500",
    Legendary: "bg-yellow-500"
  };

  const getRarityColor = (rarity: string) => {
    return rarityColors[rarity as keyof typeof rarityColors] || "bg-gray-500";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-crypto-dark border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center justify-between">
            <span>{nft.name}</span>
            <Badge className={`${getRarityColor(nft.rarity)} text-white`}>
              {nft.rarity}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* NFT Image */}
          <div className="space-y-4">
            <div className="relative">
              {imageLoading && (
                <div className="w-full h-80 bg-gray-700 animate-pulse rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">Loading image...</span>
                </div>
              )}
              <img
                src={nft.imageUrl}
                alt={nft.name}
                className={`w-full h-80 object-cover rounded-lg border border-white/20 ${
                  imageLoading ? 'hidden' : 'block'
                }`}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => handleShare('telegram', nft)}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                data-testid="button-share-telegram"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Telegram
              </Button>
              <Button
                onClick={() => handleShare('twitter', nft)}
                className="flex-1 bg-black hover:bg-gray-800"
                data-testid="button-share-twitter"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Twitter
              </Button>
              <Button
                onClick={handleCopyNFT}
                variant="outline"
                className="border-white/20 hover:bg-white/10"
                data-testid="button-copy-nft"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* NFT Details */}
          <div className="space-y-4 text-white">
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {nft.description}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Attributes</h3>
              <div className="space-y-2">
                {nft.attributes && typeof nft.attributes === 'string' && (
                  (() => {
                    try {
                      const attrs = JSON.parse(nft.attributes);
                      if (Array.isArray(attrs)) {
                        return attrs.map((attr: any, index: number) => (
                          <div key={index} className="flex justify-between items-center bg-crypto-gray rounded p-2">
                            <span className="text-gray-400 text-sm">{attr.trait_type || 'Attribute'}</span>
                            <span className="text-white text-sm font-medium">{attr.value}</span>
                          </div>
                        ));
                      } else if (typeof attrs === 'object') {
                        return Object.entries(attrs).map(([key, value], index) => (
                          <div key={index} className="flex justify-between items-center bg-crypto-gray rounded p-2">
                            <span className="text-gray-400 text-sm">{key}</span>
                            <span className="text-white text-sm font-medium">{String(value)}</span>
                          </div>
                        ));
                      }
                    } catch (e) {
                      console.error("Error parsing attributes:", e);
                    }
                    return null;
                  })()
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">NFT Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Token ID</span>
                  <span className="text-white text-sm font-medium">#{nft.tokenId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Rarity</span>
                  <Badge className={`${getRarityColor(nft.rarity)} text-white text-xs`}>
                    {nft.rarity}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Purchase Date</span>
                  <span className="text-white text-sm font-medium">
                    {new Date(nft.mintedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}