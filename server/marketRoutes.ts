import { Router } from "express";
import { storage } from "./storage";
import { ImageManager } from "./imageManager";
import { requireAuth } from "./auth";
import type { Request, Response } from "express";

interface AuthRequest extends Request {
  session: {
    user?: { id: string; email: string };
  } & any;
}

const router = Router();
const imageManager = new ImageManager();

// NFT Marketplace Routes
router.post("/api/marketplace/nft/list", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { nftId, minPrice } = req.body;
    const userId = req.session?.user?.id;

    if (!userId || !nftId || !minPrice) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Verify user owns the NFT
    const userNfts = await storage.getUserNfts(userId);
    const ownsNFT = userNfts.some(nft => nft.nft.id === nftId);
    
    if (!ownsNFT) {
      return res.status(403).json({ error: "You don't own this NFT" });
    }

    const listing = await storage.listNFTForSale(userId, nftId, minPrice);
    
    res.status(201).json({
      success: true,
      listing
    });
  } catch (error) {
    console.error("Error listing NFT:", error);
    res.status(500).json({ error: "Failed to list NFT" });
  }
});

router.post("/api/marketplace/nft/bid", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { listingId, bidAmount } = req.body;
    const userId = req.session?.user?.id;
    const platformFeeAmount = "1"; // $1 worth of tokens

    if (!userId || !listingId || !bidAmount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check user balance (simplified - in real app check if they have enough tokens)
    const userBalance = await storage.getUserBalance(userId);
    const balanceAmount = userBalance?.balance || "0";
    const usdAmount = userBalance?.usdValue || "0";
    
    if (!userBalance || parseFloat(balanceAmount) < parseFloat(bidAmount) + parseFloat(platformFeeAmount)) {
      return res.status(400).json({ error: "Insufficient balance for bid and platform fee" });
    }

    // Deduct platform fee from user balance
    const newBalance = (parseFloat(balanceAmount) - parseFloat(platformFeeAmount)).toString();
    await storage.updateUserBalance(userId, newBalance, usdAmount);

    await storage.placeBidOnNFT(listingId, userId, bidAmount, platformFeeAmount);
    
    res.json({
      success: true,
      message: "Bid placed successfully",
      platformFeePaid: platformFeeAmount
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
    const userId = req.session?.user?.id;
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
    const userId = req.session?.user?.id;

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
    const userId = req.session?.user?.id;

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
    const userId = req.session?.user?.id;

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
    const userId = req.session?.user?.id;

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

export default router;