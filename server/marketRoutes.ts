import { Router } from "express";
import { storage } from "./storage";
import { ImageManager } from "./imageManager";
import { requireAuth } from "./auth";
import type { Request, Response } from "express";

interface AuthRequest extends Request {
  user?: { id: string; email: string; name?: string };
  session?: any & {
    user?: { id: string; email: string; name?: string };
  };
}

const router = Router();
const imageManager = new ImageManager();

// NFT Marketplace Routes
router.post("/api/marketplace/nft/list", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { nftId, minPrice, auctionEndDate, listingFee } = req.body;
    const userId = req.user?.id;

    if (!userId || !nftId || !minPrice) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (auctionEndDate && new Date(auctionEndDate) <= new Date()) {
      return res.status(400).json({ error: "Auction end date must be in the future" });
    }

    // Check user's token balance for $1 listing fee
    const userBalance = await storage.getUserBalance(userId);
    const balance = parseFloat(userBalance?.balance || '0');
    const requiredFee = 1; // $1 worth of tokens
    
    if (balance < requiredFee) {
      return res.status(400).json({ 
        error: `Insufficient balance. You need at least $${requiredFee} worth of tokens to list this NFT.` 
      });
    }

    // Verify user owns the NFT and get the actual NFT collection ID
    const userNfts = await storage.getUserNfts(userId);
    
    // Find user NFT by user_nft.id and get the nft_collection.id
    const userNft = userNfts.find((userNft: any) => userNft.id === nftId);
    
    if (!userNft) {
      return res.status(403).json({ error: "You don't own this NFT" });
    }
    
    // Get the actual NFT collection ID
    const actualNftId = userNft.nftId;

    // Deduct listing fee from user's balance
    const newBalance = (balance - requiredFee).toString();
    const usdValue = (parseFloat(newBalance) * 1.0).toFixed(8); // Assuming 1:1 USD rate
    await storage.updateUserBalance(userId, newBalance, usdValue);

    // Create listing with auction timer using the actual NFT collection ID
    const listing = await storage.listNFTForSale(userId, actualNftId, minPrice, auctionEndDate);
    
    res.status(201).json({
      success: true,
      listing,
      message: `NFT listed successfully! $${requiredFee} listing fee deducted from your balance.`
    });
  } catch (error) {
    console.error("Error listing NFT:", error);
    res.status(500).json({ error: "Failed to list NFT" });
  }
});

router.post("/api/marketplace/nft/bid", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { listingId, bidAmount } = req.body;
    const userId = req.user?.id;
    const platformFeeAmount = "1"; // $1 worth of tokens

    if (!userId || !listingId || !bidAmount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Get listing to check if auction is still active
    const listings = await storage.getActiveNFTListings();
    const listing = listings.find((l: any) => l.listing.id === listingId);
    
    if (!listing) {
      return res.status(404).json({ error: "Listing not found or no longer active" });
    }

    // Check if auction has ended
    if (listing.listing.auctionEndDate && new Date(listing.listing.auctionEndDate) <= new Date()) {
      return res.status(400).json({ error: "Auction has already ended" });
    }

    // Check minimum bid amount
    const currentHighestBid = parseFloat(listing.listing.currentHighestBid || "0");
    const minPrice = parseFloat(listing.listing.minPrice);
    const requiredBid = Math.max(currentHighestBid + 0.01, minPrice);
    
    if (parseFloat(bidAmount) < requiredBid) {
      return res.status(400).json({ 
        error: `Bid must be at least $${requiredBid.toFixed(2)}`,
        minimumBid: requiredBid
      });
    }

    // Check user balance - they need bid amount + platform fee in tokens
    const userBalance = await storage.getUserBalance(userId);
    const balanceAmount = userBalance?.balance || "0";
    const usdAmount = userBalance?.usdValue || "0";
    const totalRequired = parseFloat(bidAmount) + parseFloat(platformFeeAmount);
    
    if (!userBalance || parseFloat(balanceAmount) < totalRequired) {
      return res.status(400).json({ 
        error: `Insufficient balance. You need $${totalRequired.toFixed(2)} (bid + $1 fee) but only have $${parseFloat(balanceAmount).toFixed(2)}`,
        required: totalRequired,
        current: parseFloat(balanceAmount)
      });
    }

    // Reserve the bid amount + fee (don't actually deduct until auction ends)
    await storage.placeBidOnNFT(listingId, userId, bidAmount, platformFeeAmount);
    
    res.json({
      success: true,
      message: "Bid placed successfully",
      platformFeePaid: platformFeeAmount,
      bidAmount: parseFloat(bidAmount)
    });
  } catch (error) {
    console.error("Error placing bid:", error);
    res.status(500).json({ error: "Failed to place bid" });
  }
});

router.get("/api/marketplace/nft/listings", async (req: Request, res: Response) => {
  try {
    const listings = await storage.getActiveNFTListings();
    res.json(listings);
  } catch (error) {
    console.error("Error fetching NFT listings:", error);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

// Get bids for a specific listing (sale detail page)
router.get("/api/marketplace/nft/listing/:listingId/bids", async (req: Request, res: Response) => {
  try {
    const { listingId } = req.params;
    
    if (!listingId) {
      return res.status(400).json({ error: "Listing ID is required" });
    }

    const bids = await storage.getListingBids(listingId);
    res.json(bids);
  } catch (error) {
    console.error("Error fetching listing bids:", error);
    res.status(500).json({ error: "Failed to fetch listing bids" });
  }
});

// Get sale details for a specific listing
router.get("/api/marketplace/nft/listing/:listingId", async (req: Request, res: Response) => {
  try {
    const { listingId } = req.params;
    
    if (!listingId) {
      return res.status(400).json({ error: "Listing ID is required" });
    }

    const listing = await storage.getListingDetails(listingId);
    
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    res.json(listing);
  } catch (error) {
    console.error("Error fetching listing details:", error);
    res.status(500).json({ error: "Failed to fetch listing details" });
  }
});

// Get platform NFTs (admin-created, limited)
router.get("/api/marketplace/nft/platform-listings", async (req: Request, res: Response) => {
  try {
    const listings = await storage.getPlatformNFTListings();
    res.json(listings);
  } catch (error) {
    console.error("Error fetching platform NFT listings:", error);
    res.status(500).json({ error: "Failed to fetch platform listings" });
  }
});

// Get user-generated NFTs (unlimited)
router.get("/api/marketplace/nft/user-generated-listings", async (req: Request, res: Response) => {
  try {
    const listings = await storage.getUserGeneratedNFTListings();
    res.json(listings);
  } catch (error) {
    console.error("Error fetching user-generated NFT listings:", error);
    res.status(500).json({ error: "Failed to fetch user-generated listings" });
  }
});

router.get("/api/marketplace/nft/my-listings", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const listings = await storage.getUserNFTListings(userId);
    res.json(listings);
  } catch (error) {
    console.error("Error fetching user NFT listings:", error);
    res.status(500).json({ error: "Failed to fetch user listings" });
  }
});

router.get("/api/marketplace/nft/:listingId/bids", async (req: Request, res: Response) => {
  try {
    const { listingId } = req.params;
    const bids = await storage.getNFTBids(listingId);
    res.json(bids);
  } catch (error) {
    console.error("Error fetching NFT bids:", error);
    res.status(500).json({ error: "Failed to fetch bids" });
  }
});

router.post("/api/marketplace/nft/:listingId/accept-bid", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { listingId } = req.params;
    const { bidId } = req.body;
    const userId = req.session?.user?.id;

    if (!userId || !bidId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await storage.acceptNFTBid(listingId, bidId);
    
    res.json({
      success: true,
      message: "NFT sold successfully"
    });
  } catch (error) {
    console.error("Error accepting bid:", error);
    res.status(500).json({ error: "Failed to accept bid" });
  }
});

// Meme Marketplace Routes
router.post("/api/marketplace/meme/:memeId/like", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { memeId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await storage.likeMeme(memeId, userId);
    const stats = await storage.getMemeStats(memeId);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("Error liking meme:", error);
    res.status(500).json({ error: "Failed to like meme" });
  }
});

router.post("/api/marketplace/meme/:memeId/dislike", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { memeId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await storage.dislikeMeme(memeId, userId);
    const stats = await storage.getMemeStats(memeId);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("Error disliking meme:", error);
    res.status(500).json({ error: "Failed to dislike meme" });
  }
});

router.delete("/api/marketplace/meme/:memeId/like", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { memeId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await storage.removeLike(memeId, userId);
    const stats = await storage.getMemeStats(memeId);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("Error removing like:", error);
    res.status(500).json({ error: "Failed to remove like" });
  }
});

router.delete("/api/marketplace/meme/:memeId/dislike", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { memeId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await storage.removeDislike(memeId, userId);
    const stats = await storage.getMemeStats(memeId);
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("Error removing dislike:", error);
    res.status(500).json({ error: "Failed to remove dislike" });
  }
});

router.get("/api/marketplace/meme/:memeId/stats", async (req: Request, res: Response) => {
  try {
    const { memeId } = req.params;
    const stats = await storage.getMemeStats(memeId);
    res.json(stats);
  } catch (error) {
    console.error("Error fetching meme stats:", error);
    res.status(500).json({ error: "Failed to fetch meme stats" });
  }
});

router.get("/api/marketplace/meme/leaderboard", async (req: Request, res: Response) => {
  try {
    const leaderboard = await storage.getMemeLeaderboard();
    res.json(leaderboard);
  } catch (error) {
    console.error("Error fetching meme leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

// Get paginated meme feed for marketplace with user info
router.get("/api/marketplace/meme/feed", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 6;
    const offset = (page - 1) * limit;
    
    const memes = await storage.getAllMemesWithUserInfo(limit, offset);
    res.json(memes);
  } catch (error) {
    console.error("Error fetching meme feed:", error);
    res.status(500).json({ error: "Failed to fetch meme feed" });
  }
});

// Get total count of public memes for pagination
router.get("/api/marketplace/meme/count", async (req: Request, res: Response) => {
  try {
    const count = await storage.getTotalMemesCount();
    res.json(count);
  } catch (error) {
    console.error("Error fetching meme count:", error);
    res.status(500).json({ error: "Failed to fetch meme count" });
  }
});

export default router;