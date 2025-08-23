import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertDepositRequestSchema, insertNewsArticleSchema, insertSocialLinkSchema, insertTokenConfigSchema } from "@shared/schema";
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.walletAddress) {
        // Generate wallet address if not exists
        const walletAddress = await storage.generateWalletAddress(userId);
        const updatedUser = await storage.getUser(userId);
        return res.json(updatedUser);
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Token configuration routes
  app.get('/api/token/config', async (req, res) => {
    try {
      const config = await storage.getActiveTokenConfig();
      if (!config) {
        return res.status(404).json({ message: "No active token configuration found" });
      }
      res.json(config);
    } catch (error) {
      console.error("Error fetching token config:", error);
      res.status(500).json({ message: "Failed to fetch token configuration" });
    }
  });

  app.put('/api/admin/token/config', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTokenConfigSchema.parse(req.body);
      const config = await storage.updateTokenConfig(validatedData);
      res.json(config);
    } catch (error) {
      console.error("Error updating token config:", error);
      res.status(500).json({ message: "Failed to update token configuration" });
    }
  });

  // User balance routes
  app.get('/api/user/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const balance = await storage.getUserBalance(userId);
      res.json(balance || { balance: "0", usdValue: "0" });
    } catch (error) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  // Deposit routes
  app.post('/api/deposits', isAuthenticated, upload.single('screenshot'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = { ...req.body };
      
      if (req.file) {
        data.screenshot = req.file.path;
      }
      
      const validatedData = insertDepositRequestSchema.parse(data);
      const depositRequest = await storage.createDepositRequest(userId, validatedData);
      res.json(depositRequest);
    } catch (error) {
      console.error("Error creating deposit request:", error);
      res.status(500).json({ message: "Failed to create deposit request" });
    }
  });

  app.get('/api/deposits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deposits = await storage.getDepositRequests(userId);
      res.json(deposits);
    } catch (error) {
      console.error("Error fetching deposits:", error);
      res.status(500).json({ message: "Failed to fetch deposits" });
    }
  });

  app.get('/api/admin/deposits', isAuthenticated, async (req, res) => {
    try {
      const deposits = await storage.getDepositRequests();
      res.json(deposits);
    } catch (error) {
      console.error("Error fetching all deposits:", error);
      res.status(500).json({ message: "Failed to fetch deposits" });
    }
  });

  app.put('/api/admin/deposits/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      await storage.updateDepositStatus(id, status, adminNotes);
      res.json({ message: "Deposit status updated successfully" });
    } catch (error) {
      console.error("Error updating deposit status:", error);
      res.status(500).json({ message: "Failed to update deposit status" });
    }
  });

  // News routes
  app.get('/api/news', async (req, res) => {
    try {
      const news = await storage.getPublishedNews();
      res.json(news);
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  app.get('/api/admin/news', isAuthenticated, async (req, res) => {
    try {
      const news = await storage.getAllNews();
      res.json(news);
    } catch (error) {
      console.error("Error fetching all news:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  app.post('/api/admin/news', isAuthenticated, upload.single('image'), async (req, res) => {
    try {
      const data = { ...req.body };
      
      if (req.file) {
        data.imageUrl = req.file.path;
      }
      
      const validatedData = insertNewsArticleSchema.parse(data);
      const article = await storage.createNewsArticle(validatedData);
      res.json(article);
    } catch (error) {
      console.error("Error creating news article:", error);
      res.status(500).json({ message: "Failed to create news article" });
    }
  });

  app.put('/api/admin/news/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertNewsArticleSchema.partial().parse(req.body);
      await storage.updateNewsArticle(id, validatedData);
      res.json({ message: "News article updated successfully" });
    } catch (error) {
      console.error("Error updating news article:", error);
      res.status(500).json({ message: "Failed to update news article" });
    }
  });

  app.delete('/api/admin/news/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNewsArticle(id);
      res.json({ message: "News article deleted successfully" });
    } catch (error) {
      console.error("Error deleting news article:", error);
      res.status(500).json({ message: "Failed to delete news article" });
    }
  });

  // Social links routes
  app.get('/api/social-links', async (req, res) => {
    try {
      const links = await storage.getActiveSocialLinks();
      res.json(links);
    } catch (error) {
      console.error("Error fetching social links:", error);
      res.status(500).json({ message: "Failed to fetch social links" });
    }
  });

  app.get('/api/admin/social-links', isAuthenticated, async (req, res) => {
    try {
      const links = await storage.getAllSocialLinks();
      res.json(links);
    } catch (error) {
      console.error("Error fetching all social links:", error);
      res.status(500).json({ message: "Failed to fetch social links" });
    }
  });

  app.post('/api/admin/social-links', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertSocialLinkSchema.parse(req.body);
      const link = await storage.upsertSocialLink(validatedData);
      res.json(link);
    } catch (error) {
      console.error("Error creating/updating social link:", error);
      res.status(500).json({ message: "Failed to save social link" });
    }
  });

  app.delete('/api/admin/social-links/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSocialLink(id);
      res.json({ message: "Social link deleted successfully" });
    } catch (error) {
      console.error("Error deleting social link:", error);
      res.status(500).json({ message: "Failed to delete social link" });
    }
  });

  // Token price routes
  app.get('/api/token/price', async (req, res) => {
    try {
      const config = await storage.getActiveTokenConfig();
      if (!config) {
        return res.status(404).json({ message: "No active token configuration found" });
      }
      
      const price = await storage.getLatestTokenPrice(config.id);
      res.json(price || { priceUsd: "0", priceChange24h: "0" });
    } catch (error) {
      console.error("Error fetching token price:", error);
      res.status(500).json({ message: "Failed to fetch token price" });
    }
  });

  // Transaction routes
  app.get('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}
