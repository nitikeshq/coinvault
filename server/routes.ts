import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireAdmin } from "./auth";
import { insertDepositRequestSchema, insertNewsArticleSchema, insertSocialLinkSchema, insertTokenConfigSchema, insertWebsiteSettingsSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import Web3 from "web3";

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
  setupAuth(app);

  // User routes
  app.get('/api/user', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.walletAddress) {
        // Generate wallet address if not exists
        await storage.generateWalletAddress(userId);
        const updatedUser = await storage.getUser(userId);
        return res.json({ ...updatedUser, password: undefined });
      }
      
      res.json({ ...user, password: undefined });
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

  // Real blockchain token info endpoint
  app.get('/api/token/info/:contractAddress', async (req, res) => {
    try {
      const { contractAddress } = req.params;
      
      if (!contractAddress || !contractAddress.startsWith('0x') || contractAddress.length !== 42) {
        return res.status(400).json({ message: "Invalid contract address" });
      }

      const web3 = new Web3('https://bsc-dataseed1.binance.org/');
      
      // ERC-20 function selectors
      const nameSelector = '0x06fdde03'; // name()
      const symbolSelector = '0x95d89b41'; // symbol()
      const decimalsSelector = '0x313ce567'; // decimals()

      // Make RPC calls to get token info
      const [nameResponse, symbolResponse, decimalsResponse] = await Promise.all([
        web3.eth.call({ to: contractAddress, data: nameSelector }),
        web3.eth.call({ to: contractAddress, data: symbolSelector }),
        web3.eth.call({ to: contractAddress, data: decimalsSelector })
      ]);

      // Decode hex strings
      const decodeName = (hex: string) => {
        if (hex === '0x') return '';
        const hex2 = hex.slice(2);
        const length = parseInt(hex2.slice(64, 128), 16);
        const nameHex = hex2.slice(128, 128 + length * 2);
        return nameHex ? Buffer.from(nameHex, 'hex').toString('utf8') : '';
      };

      const decodeSymbol = (hex: string) => {
        if (hex === '0x') return '';
        const hex2 = hex.slice(2);
        const length = parseInt(hex2.slice(64, 128), 16);
        const symbolHex = hex2.slice(128, 128 + length * 2);
        return symbolHex ? Buffer.from(symbolHex, 'hex').toString('utf8') : '';
      };

      const tokenName = decodeName(nameResponse);
      const tokenSymbol = decodeSymbol(symbolResponse);
      const decimals = parseInt(decimalsResponse, 16);

      res.json({
        name: tokenName,
        symbol: tokenSymbol,
        decimals,
        contractAddress
      });
    } catch (error) {
      console.error("Error fetching token info from blockchain:", error);
      res.status(500).json({ message: "Failed to fetch token information from blockchain" });
    }
  });

  // Get token balance for user
  app.get('/api/user/token/balance', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const wallet = await storage.getUserWallet(userId);
      const tokenConfig = await storage.getActiveTokenConfig();
      
      if (!wallet?.address || !tokenConfig) {
        return res.json({ balance: '0', usdValue: '0' });
      }

      const web3 = new Web3('https://bsc-dataseed1.binance.org/');
      
      // Get token balance
      const balanceSelector = '0x70a08231'; // balanceOf(address)
      const addressParam = wallet.address.slice(2).padStart(64, '0');
      
      const balanceResponse = await web3.eth.call({
        to: tokenConfig.contractAddress,
        data: balanceSelector + addressParam
      });

      const balance = parseInt(balanceResponse, 16);
      const tokenBalance = (balance / Math.pow(10, tokenConfig.decimals)).toString();
      
      // Update user balance in database
      await storage.updateUserBalance(userId, tokenBalance, '0'); // USD value would come from price API
      
      res.json({ balance: tokenBalance, usdValue: '0' });
    } catch (error) {
      console.error("Error fetching user token balance:", error);
      res.status(500).json({ message: "Failed to fetch token balance" });
    }
  });

  app.put('/api/admin/token/config', requireAdmin, async (req, res) => {
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
  app.get('/api/user/balance', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const balance = await storage.getUserBalance(userId);
      res.json(balance || { balance: "0", usdValue: "0" });
    } catch (error) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  // Deposit routes
  app.post('/api/deposits', requireAuth, upload.single('screenshot'), async (req: any, res) => {
    try {
      const userId = req.user.id;
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

  app.get('/api/deposits', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const deposits = await storage.getDepositRequests(userId);
      res.json(deposits);
    } catch (error) {
      console.error("Error fetching deposits:", error);
      res.status(500).json({ message: "Failed to fetch deposits" });
    }
  });

  app.get('/api/admin/deposits', requireAdmin, async (req, res) => {
    try {
      const deposits = await storage.getDepositRequests();
      res.json(deposits);
    } catch (error) {
      console.error("Error fetching all deposits:", error);
      res.status(500).json({ message: "Failed to fetch deposits" });
    }
  });

  app.put('/api/admin/deposits/:id', requireAdmin, async (req, res) => {
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

  app.get('/api/admin/news', requireAdmin, async (req, res) => {
    try {
      const news = await storage.getAllNews();
      res.json(news);
    } catch (error) {
      console.error("Error fetching all news:", error);
      res.status(500).json({ message: "Failed to fetch news" });
    }
  });

  app.post('/api/admin/news', requireAdmin, upload.single('image'), async (req, res) => {
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

  app.put('/api/admin/news/:id', requireAdmin, async (req, res) => {
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

  app.delete('/api/admin/news/:id', requireAdmin, async (req, res) => {
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

  app.get('/api/admin/social-links', requireAdmin, async (req, res) => {
    try {
      const links = await storage.getAllSocialLinks();
      res.json(links);
    } catch (error) {
      console.error("Error fetching all social links:", error);
      res.status(500).json({ message: "Failed to fetch social links" });
    }
  });

  app.post('/api/admin/social-links', requireAdmin, async (req, res) => {
    try {
      const validatedData = insertSocialLinkSchema.parse(req.body);
      const link = await storage.upsertSocialLink(validatedData);
      res.json(link);
    } catch (error) {
      console.error("Error creating/updating social link:", error);
      res.status(500).json({ message: "Failed to save social link" });
    }
  });

  app.delete('/api/admin/social-links/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteSocialLink(id);
      res.json({ message: "Social link deleted successfully" });
    } catch (error) {
      console.error("Error deleting social link:", error);
      res.status(500).json({ message: "Failed to delete social link" });
    }
  });

  // Website settings routes
  app.get('/api/website/settings', async (req, res) => {
    try {
      const settings = await storage.getWebsiteSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching website settings:", error);
      res.status(500).json({ message: "Failed to fetch website settings" });
    }
  });

  app.put('/api/admin/website/settings', requireAdmin, async (req, res) => {
    try {
      const validatedData = insertWebsiteSettingsSchema.parse(req.body);
      const settings = await storage.updateWebsiteSettings(validatedData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating website settings:", error);
      res.status(500).json({ message: "Failed to update website settings" });
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
  app.get('/api/transactions', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
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
