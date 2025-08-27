import { Router } from "express";
import { storage } from "./storage";
import { videoStorageService } from "./videoStorage";
import { requireAuth, requireAdmin } from "./auth";
import multer from "multer";
import type { Request, Response } from "express";

interface AuthRequest extends Request {
  user?: { id: string; email: string; name?: string; isAdmin?: boolean };
}

const router = Router();

// Configure multer for video uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB default limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// ===== FEED SETTINGS & ADMIN ROUTES =====

// Get feed settings (public - to check if feed is enabled)
router.get("/api/feed/settings", async (req: Request, res: Response) => {
  try {
    const settings = await storage.getFeedSettings();
    res.json(settings || { isEnabled: false });
  } catch (error) {
    console.error("Error fetching feed settings:", error);
    res.status(500).json({ error: "Failed to fetch feed settings" });
  }
});

// Update feed settings (admin only)
router.put("/api/admin/feed/settings", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const settings = await storage.updateFeedSettings(req.body);
    res.json(settings);
  } catch (error) {
    console.error("Error updating feed settings:", error);
    res.status(500).json({ error: "Failed to update feed settings" });
  }
});

// ===== STORIES ENDPOINTS =====

// Get stories (recent videos for stories display)
router.get("/api/feed/stories", async (req: Request, res: Response) => {
  try {
    // Get recent videos from last 24 hours for stories
    const stories = await storage.getRecentStories();
    res.json(stories);
  } catch (error) {
    console.error("Error fetching stories:", error);
    res.status(500).json({ error: "Failed to fetch stories" });
  }
});

// ===== GIFT TYPES MANAGEMENT (ADMIN) =====

router.get("/api/admin/gift-types", requireAdmin, async (req: Request, res: Response) => {
  try {
    const gifts = await storage.getAllGiftTypes();
    res.json(gifts);
  } catch (error) {
    console.error("Error fetching gift types:", error);
    res.status(500).json({ error: "Failed to fetch gift types" });
  }
});

router.post("/api/admin/gift-types", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const gift = await storage.createGiftType(req.body);
    res.json(gift);
  } catch (error) {
    console.error("Error creating gift type:", error);
    res.status(500).json({ error: "Failed to create gift type" });
  }
});

router.put("/api/admin/gift-types/:id", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await storage.updateGiftType(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating gift type:", error);
    res.status(500).json({ error: "Failed to update gift type" });
  }
});

router.delete("/api/admin/gift-types/:id", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await storage.deleteGiftType(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting gift type:", error);
    res.status(500).json({ error: "Failed to delete gift type" });
  }
});

// Get pending videos for admin approval
router.get("/api/admin/pending-videos", requireAdmin, async (req: Request, res: Response) => {
  try {
    const videos = await storage.getPendingVideos();
    res.json(videos);
  } catch (error) {
    console.error("Error fetching pending videos:", error);
    res.status(500).json({ error: "Failed to fetch pending videos" });
  }
});

// Approve/reject video
router.put("/api/admin/videos/:videoId/status", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { videoId } = req.params;
    const { isApproved } = req.body;
    
    await storage.updateVideoApprovalStatus(videoId, isApproved);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating video status:", error);
    res.status(500).json({ error: "Failed to update video status" });
  }
});

// ===== STORAGE SETTINGS (ADMIN) =====

router.get("/api/admin/storage-settings", requireAdmin, async (req: Request, res: Response) => {
  try {
    const settings = await storage.getStorageSettings();
    res.json(settings);
  } catch (error) {
    console.error("Error fetching storage settings:", error);
    res.status(500).json({ error: "Failed to fetch storage settings" });
  }
});

router.put("/api/admin/storage-settings", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // Test S3 connection if S3 is being configured
    if (req.body.storageType === 's3') {
      const AWS = await import('aws-sdk');
      const testS3 = new AWS.S3({
        accessKeyId: req.body.s3AccessKey,
        secretAccessKey: req.body.s3SecretKey,
        region: req.body.s3Region,
      });
      
      try {
        await testS3.headBucket({ Bucket: req.body.s3BucketName }).promise();
      } catch (error) {
        return res.status(400).json({ 
          error: 'Invalid S3 credentials or bucket not accessible' 
        });
      }
    }
    
    const settings = await storage.updateStorageSettings(req.body);
    res.json({ success: true, settings });
  } catch (error) {
    console.error("Error updating storage settings:", error);
    res.status(500).json({ error: "Failed to update storage settings" });
  }
});

// Test S3 connection
router.post("/api/admin/test-s3", requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { s3AccessKey, s3SecretKey, s3BucketName, s3Region } = req.body;
    
    const AWS = await import('aws-sdk');
    const s3 = new AWS.S3({
      accessKeyId: s3AccessKey,
      secretAccessKey: s3SecretKey,
      region: s3Region,
    });
    
    await s3.headBucket({ Bucket: s3BucketName }).promise();
    res.json({ success: true, message: 'S3 connection successful' });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: 'Failed to connect to S3. Please check your credentials.' 
    });
  }
});

// ===== PUBLIC GIFT TYPES =====

router.get("/api/feed/gift-types", async (req: Request, res: Response) => {
  try {
    const gifts = await storage.getActiveGiftTypes();
    res.json(gifts);
  } catch (error) {
    console.error("Error fetching gift types:", error);
    res.status(500).json({ error: "Failed to fetch gift types" });
  }
});

// ===== VIDEO OPERATIONS =====

// Upload video
router.post("/api/feed/upload", requireAuth, upload.single('video'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video file provided" });
    }

    const userId = req.user!.id;
    const { title, description } = req.body;

    // Check feed settings
    const feedSettings = await storage.getFeedSettings();
    if (!feedSettings?.isEnabled) {
      return res.status(403).json({ error: "Feed feature is currently disabled" });
    }

    // Upload video
    const videoUrl = await videoStorageService.uploadVideo(req.file, userId);
    const thumbnailUrl = await videoStorageService.generateThumbnail(videoUrl, userId);
    const duration = await videoStorageService.getVideoDuration(videoUrl);

    // Create video post
    const videoData = {
      userId,
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      isApproved: !feedSettings.requireApproval, // Auto-approve if moderation is off
    };

    const video = await storage.createVideoPost(videoData);
    res.json(video);
  } catch (error) {
    console.error("Error uploading video:", error);
    res.status(500).json({ error: "Failed to upload video" });
  }
});

// Get feed videos (infinite scroll)
router.get("/api/feed/videos", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const videos = await storage.getFeedVideos(page, limit);
    res.json(videos);
  } catch (error) {
    console.error("Error fetching feed videos:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// Get following videos
router.get("/api/feed/following", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;
    const userId = req.user!.id;
    
    const videos = await storage.getFollowingVideos(userId, page, limit);
    res.json(videos);
  } catch (error) {
    console.error("Error fetching following videos:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// Get user's videos
router.get("/api/feed/user/:userId/videos", async (req: Request, res: Response) => {
  try {
    const videos = await storage.getUserVideos(req.params.userId);
    res.json(videos);
  } catch (error) {
    console.error("Error fetching user videos:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

// Get single video
router.get("/api/feed/video/:videoId", async (req: Request, res: Response) => {
  try {
    const video = await storage.getVideoPost(req.params.videoId);
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }
    res.json(video);
  } catch (error) {
    console.error("Error fetching video:", error);
    res.status(500).json({ error: "Failed to fetch video" });
  }
});

// Increment video views
router.post("/api/feed/video/:videoId/view", async (req: Request, res: Response) => {
  try {
    await storage.incrementVideoViews(req.params.videoId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error incrementing video views:", error);
    res.status(500).json({ error: "Failed to update views" });
  }
});

// ===== VIDEO INTERACTIONS =====

// Like/unlike video
router.post("/api/feed/video/:videoId/like", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { videoId } = req.params;
    const userId = req.user!.id;
    const { action } = req.body; // 'like' or 'unlike'

    if (action === 'like') {
      await storage.likeVideo(videoId, userId);
    } else {
      await storage.unlikeVideo(videoId, userId);
    }

    const stats = await storage.getVideoStats(videoId);
    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error liking video:", error);
    res.status(500).json({ error: "Failed to update like" });
  }
});

// Send gift
router.post("/api/feed/video/:videoId/gift", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { videoId } = req.params;
    const { giftTypeId, message } = req.body;
    const senderId = req.user!.id;

    // Get video details to find receiver
    const video = await storage.getVideoPost(videoId);
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    // Get gift type to get token cost
    const giftTypes = await storage.getActiveGiftTypes();
    const giftType = giftTypes.find(g => g.id === giftTypeId);
    if (!giftType) {
      return res.status(404).json({ error: "Gift type not found" });
    }

    // Check sender's balance
    const senderBalance = await storage.getUserBalance(senderId);
    const balance = parseFloat(senderBalance?.balance || '0');
    const giftCost = parseFloat(giftType.tokenCost);

    if (balance < giftCost) {
      return res.status(400).json({ 
        error: `Insufficient balance. You need ${giftCost} tokens to send this gift.` 
      });
    }

    // Deduct from sender
    const newSenderBalance = (balance - giftCost).toString();
    const senderUsdValue = (parseFloat(newSenderBalance) * 1.0).toString();
    await storage.updateUserBalance(senderId, newSenderBalance, senderUsdValue);

    // Add to receiver (optional - depending on your economy design)
    const receiverId = video.user.id;
    const receiverBalance = await storage.getUserBalance(receiverId);
    const receiverNewBalance = (parseFloat(receiverBalance?.balance || '0') + giftCost).toString();
    const receiverUsdValue = (parseFloat(receiverNewBalance) * 1.0).toString();
    await storage.updateUserBalance(receiverId, receiverNewBalance, receiverUsdValue);

    // Record the gift
    const giftData = {
      videoId,
      senderId,
      receiverId,
      giftTypeId,
      tokenAmount: giftCost.toString(),
      message,
    };

    const gift = await storage.sendVideoGift(giftData);
    res.json({ success: true, gift });
  } catch (error) {
    console.error("Error sending gift:", error);
    res.status(500).json({ error: "Failed to send gift" });
  }
});

// Add comment
router.post("/api/feed/video/:videoId/comment", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { videoId } = req.params;
    const { comment, parentId } = req.body;
    const userId = req.user!.id;

    const commentData = {
      videoId,
      userId,
      comment,
      parentId: parentId || null,
    };

    const newComment = await storage.addVideoComment(commentData);
    res.json(newComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// Get video comments
router.get("/api/feed/video/:videoId/comments", async (req: Request, res: Response) => {
  try {
    const comments = await storage.getVideoComments(req.params.videoId);
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// ===== SOCIAL FEATURES =====

// Follow/unfollow user
router.post("/api/feed/user/:userId/follow", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { userId: targetUserId } = req.params;
    const { action } = req.body; // 'follow' or 'unfollow'
    const followerId = req.user!.id;

    if (action === 'follow') {
      await storage.followUser(followerId, targetUserId);
    } else {
      await storage.unfollowUser(followerId, targetUserId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error following user:", error);
    res.status(500).json({ error: "Failed to update follow status" });
  }
});

// Get user followers
router.get("/api/feed/user/:userId/followers", async (req: Request, res: Response) => {
  try {
    const followers = await storage.getUserFollowers(req.params.userId);
    res.json(followers);
  } catch (error) {
    console.error("Error fetching followers:", error);
    res.status(500).json({ error: "Failed to fetch followers" });
  }
});

// Get user following
router.get("/api/feed/user/:userId/following", async (req: Request, res: Response) => {
  try {
    const following = await storage.getUserFollowing(req.params.userId);
    res.json(following);
  } catch (error) {
    console.error("Error fetching following:", error);
    res.status(500).json({ error: "Failed to fetch following" });
  }
});

// Check if user is following another user
router.get("/api/feed/user/:userId/is-following", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const isFollowing = await storage.isUserFollowing(req.user!.id, req.params.userId);
    res.json({ isFollowing });
  } catch (error) {
    console.error("Error checking follow status:", error);
    res.status(500).json({ error: "Failed to check follow status" });
  }
});

export default router;
