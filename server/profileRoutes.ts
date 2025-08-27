import { Router, Request, Response } from "express";
import { storage } from "./storage";
import { requireAuth, AuthRequest } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

// Configure multer for image uploads
const upload = multer({
  dest: 'uploads/profiles/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// ===== PROFILE ROUTES =====

// Get user profile
router.get("/api/user/:userId/profile", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = (req as any).user?.id;
    
    const profile = await storage.getUserProfile(userId);
    if (!profile) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if current user is following this user
    let isFollowing = false;
    if (currentUserId && currentUserId !== userId) {
      isFollowing = await storage.checkIsFollowing(currentUserId, userId);
    }

    res.json({
      ...profile,
      isFollowing,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Update own profile
router.put("/api/user/profile", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, bio } = req.body;

    await storage.updateUserProfile(userId, {
      name,
      bio,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Upload profile/banner image
router.post("/api/user/upload-image", requireAuth, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    const userId = req.user!.id;
    const { type } = req.body; // 'profile' or 'banner'
    
    if (!['profile', 'banner'].includes(type)) {
      return res.status(400).json({ error: "Invalid image type" });
    }

    // Generate unique filename
    const fileExtension = path.extname(req.file.originalname);
    const filename = `${userId}_${type}_${Date.now()}${fileExtension}`;
    const newPath = `uploads/profiles/${filename}`;

    // Move file to new location
    fs.renameSync(req.file.path, newPath);

    // Create public URL
    const imageUrl = `/uploads/profiles/${filename}`;

    // Update user profile with new image URL
    await storage.uploadUserImage(userId, imageUrl, type as 'profile' | 'banner');

    res.json({ 
      success: true, 
      imageUrl 
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
});

// Get user's videos
router.get("/api/user/:userId/videos", async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const videos = await storage.getUserVideos(userId);
    res.json(videos);
  } catch (error) {
    console.error("Error fetching user videos:", error);
    res.status(500).json({ error: "Failed to fetch user videos" });
  }
});

// Get user's NFTs (own profile only)
router.get("/api/user/:userId/nfts", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!.id;

    // Only allow users to see their own NFTs
    if (userId !== currentUserId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const nfts = await storage.getUserNFTs(userId);
    res.json(nfts);
  } catch (error) {
    console.error("Error fetching user NFTs:", error);
    res.status(500).json({ error: "Failed to fetch user NFTs" });
  }
});

// Get user's memes (own profile only)
router.get("/api/user/:userId/memes", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!.id;

    // Only allow users to see their own memes
    if (userId !== currentUserId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const memes = await storage.getUserMemes(userId);
    res.json(memes);
  } catch (error) {
    console.error("Error fetching user memes:", error);
    res.status(500).json({ error: "Failed to fetch user memes" });
  }
});

// Search users
router.get("/api/users/search", async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length < 2) {
      return res.json([]);
    }

    const searchTerm = q.trim().toLowerCase();
    
    // Simple search implementation - in production, you'd want full-text search
    const users = await storage.searchUsers(searchTerm);
    
    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Failed to search users" });
  }
});

// Follow user
router.post("/api/user/:userId/follow", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = req.params.userId;
    const followerId = req.user!.id;

    if (followerId === targetUserId) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    await storage.followUser(followerId, targetUserId);
    res.json({ success: true, message: "User followed successfully" });
  } catch (error) {
    console.error("Error following user:", error);
    res.status(500).json({ error: "Failed to follow user" });
  }
});

// Unfollow user
router.post("/api/user/:userId/unfollow", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = req.params.userId;
    const followerId = req.user!.id;

    await storage.unfollowUser(followerId, targetUserId);
    res.json({ success: true, message: "User unfollowed successfully" });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
});

export { router as profileRoutes };
