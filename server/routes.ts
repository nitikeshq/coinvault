import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireAdmin } from "./auth";
import { insertDepositRequestSchema, insertNewsArticleSchema, insertSocialLinkSchema, insertTokenConfigSchema, insertWebsiteSettingsSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import { blockchainService } from "./blockchainService";
import OpenAI from "openai";
import { ObjectStorageService } from "./objectStorage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

  // Object Storage Routes
  app.post('/api/objects/upload', requireAuth, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // User routes
  app.get('/api/me', requireAuth, async (req: any, res) => {
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
      
      if (!blockchainService.isValidAddress(contractAddress)) {
        return res.status(400).json({ message: "Invalid contract address" });
      }

      const tokenInfo = await blockchainService.getTokenInfo(contractAddress);
      res.json(tokenInfo);
    } catch (error) {
      console.error("Error fetching token info from blockchain:", error);
      res.status(500).json({ message: "Failed to fetch token information from blockchain" });
    }
  });

  // Get token balance for user (during presale, read from database; post-presale, read from blockchain)
  app.get('/api/user/token/balance', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Check if presale is active
      const presaleConfig = await storage.getPresaleConfig();
      const isPresaleActive = presaleConfig?.isActive && new Date() < new Date(presaleConfig.endDate);
      
      if (isPresaleActive) {
        // During presale: Read from database
        const balance = await storage.getUserBalance(userId);
        const tokenConfig = await storage.getActiveTokenConfig();
        const tokenPrice = tokenConfig ? await storage.getLatestTokenPrice(tokenConfig.id) : null;
        
        if (balance && tokenPrice) {
          const usdValue = (parseFloat(balance.balance) * parseFloat(tokenPrice.priceUsd)).toString();
          res.json({ 
            balance: balance.balance || '0', 
            usdValue: usdValue || '0' 
          });
        } else {
          res.json({ balance: '0', usdValue: '0' });
        }
      } else {
        // Post-presale: Read from blockchain
        const wallet = await storage.getUserWallet(userId);
        const tokenConfig = await storage.getActiveTokenConfig();
        
        if (!wallet?.address || !tokenConfig) {
          return res.json({ balance: '0', usdValue: '0' });
        }

        const tokenBalance = await blockchainService.getTokenBalance(tokenConfig.contractAddress, wallet.address);
        
        // Get current price to calculate USD value
        const priceData = await blockchainService.getTokenPrice(tokenConfig.contractAddress);
        const usdValue = (parseFloat(tokenBalance) * parseFloat(priceData.priceUsd)).toString();
        
        // Update user balance in database
        await storage.updateUserBalance(userId, tokenBalance, usdValue);
        
        res.json({ balance: tokenBalance, usdValue });
      }
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
      
      console.log('Deposit request data:', data); // Debug log
      
      if (req.file) {
        data.screenshot = req.file.path;
      }
      
      // Ensure amount is provided
      if (!data.amount) {
        return res.status(400).json({ message: "Deposit amount is required" });
      }
      
      // Convert INR to USD for UPI deposits (approximately 83 INR = 1 USD)
      if (data.paymentMethod === 'upi' && data.amount) {
        const inrAmount = parseFloat(data.amount);
        const usdAmount = inrAmount / 83; // Convert INR to USD
        data.amount = usdAmount.toString();
        data.originalAmount = inrAmount.toString(); // Store original INR amount
        data.currency = 'INR'; // Mark original currency
      } else {
        data.currency = 'USD'; // BSC deposits are in USD
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
      
      // Just use the admin-configured default price directly
      const price = {
        priceUsd: config.defaultPriceUsd || "0.001",
        priceChange24h: "0.00",
        high24h: config.defaultPriceUsd || "0.001",
        low24h: config.defaultPriceUsd || "0.001",
        volume24h: "0",
        marketCap: "0"
      };
      
      res.json(price);
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

  // Presale endpoints
  app.get('/api/presale/config', async (req, res) => {
    try {
      const config = await storage.getPresaleConfig();
      if (!config) {
        return res.status(404).json({ message: 'Presale config not found' });
      }
      res.json(config);
    } catch (error) {
      console.error('Error fetching presale config:', error);
      res.status(500).json({ message: 'Failed to fetch presale config' });
    }
  });

  app.get('/api/presale/timer', async (req, res) => {
    try {
      const config = await storage.getPresaleConfig();
      if (!config) {
        return res.status(404).json({ message: 'Presale config not found' });
      }

      const now = new Date();
      const endDate = new Date(config.endDate);
      const timeRemaining = Math.max(0, endDate.getTime() - now.getTime());
      
      const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

      res.json({
        timeRemaining,
        days,
        hours,
        minutes,
        seconds,
        isEnded: timeRemaining === 0,
        endDate: config.endDate
      });
    } catch (error) {
      console.error('Error calculating presale timer:', error);
      res.status(500).json({ message: 'Failed to calculate timer' });
    }
  });

  app.get('/api/presale/progress', async (req, res) => {
    try {
      const config = await storage.getPresaleConfig();
      if (!config) {
        return res.status(404).json({ message: 'Presale config not found' });
      }

      // Calculate total raised from approved deposits
      const approvedDeposits = await storage.getApprovedDeposits();
      const fromDeposits = approvedDeposits.reduce((total, deposit) => 
        total + parseFloat(deposit.amount), 0
      );

      const initialLiquidity = parseFloat(config.initialLiquidity);
      const totalRaised = initialLiquidity + fromDeposits;
      const targetAmount = parseFloat(config.targetAmount);
      const progressPercentage = (totalRaised / targetAmount) * 100;

      res.json({
        totalRaised: totalRaised.toString(),
        targetAmount: config.targetAmount,
        initialLiquidity: config.initialLiquidity,
        fromDeposits: fromDeposits.toString(),
        progressPercentage: Math.min(100, progressPercentage)
      });
    } catch (error) {
      console.error('Error calculating presale progress:', error);
      res.status(500).json({ message: 'Failed to calculate progress' });
    }
  });

  app.put('/api/admin/presale/config', requireAdmin, async (req, res) => {
    try {
      const config = await storage.updatePresaleConfig(req.body);
      res.json(config);
    } catch (error) {
      console.error('Error updating presale config:', error);
      res.status(500).json({ message: 'Failed to update presale config' });
    }
  });

  app.post('/api/admin/presale/liquidity', requireAdmin, async (req, res) => {
    try {
      const { currentAmount } = req.body;
      const config = await storage.updatePresaleLiquidity(currentAmount);
      res.json(config);
    } catch (error) {
      console.error('Error updating presale liquidity:', error);
      res.status(500).json({ message: 'Failed to update liquidity' });
    }
  });

  // Withdrawal restriction during presale
  app.get('/api/withdraw/status', requireAuth, async (req, res) => {
    try {
      const config = await storage.getPresaleConfig();
      if (!config) {
        return res.json({ available: false, reason: 'Presale config not found' });
      }

      const now = new Date();
      const endDate = new Date(config.endDate);
      const presaleActive = now < endDate && config.isActive;

      res.json({
        available: !presaleActive,
        reason: presaleActive ? 'Withdrawals are disabled during the presale period' : null,
        presaleEndDate: config.endDate
      });
    } catch (error) {
      res.json({ available: false, reason: 'Unable to check withdrawal status' });
    }
  });

  app.post('/api/withdraw', requireAuth, async (req, res) => {
    try {
      const config = await storage.getPresaleConfig();
      if (config) {
        const now = new Date();
        const endDate = new Date(config.endDate);
        if (now < endDate && config.isActive) {
          return res.status(403).json({ 
            message: 'Withdrawals are disabled during the presale period' 
          });
        }
      }
      
      // Normal withdrawal logic would go here
      res.status(503).json({ message: 'Withdrawal functionality coming soon' });
    } catch (error) {
      res.status(500).json({ message: 'Withdrawal failed' });
    }
  });

  // Dapps routes
  app.get('/api/dapps/settings', async (req, res) => {
    try {
      const settings = await storage.getDappSettings();
      const enabledSettings = settings.filter(s => s.isEnabled);
      res.json(enabledSettings);
    } catch (error) {
      console.error("Error fetching dapp settings:", error);
      res.status(500).json({ message: "Failed to fetch dapp settings" });
    }
  });

  // Admin Dapps routes
  app.get('/api/admin/dapps', requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getDappSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching dapp settings:", error);
      res.status(500).json({ message: "Failed to fetch dapp settings" });
    }
  });

  app.put('/api/admin/dapps/:appName', requireAdmin, async (req, res) => {
    try {
      const { appName } = req.params;
      const { isEnabled } = req.body;
      
      const updated = await storage.updateDappSetting(appName, isEnabled);
      res.json(updated);
    } catch (error) {
      console.error("Error updating dapp setting:", error);
      res.status(500).json({ message: "Failed to update dapp setting" });
    }
  });

  app.put('/api/admin/dapps/:appName/cost', requireAdmin, async (req, res) => {
    try {
      const { appName } = req.params;
      const { cost } = req.body;
      
      // Validate cost is a positive number
      if (typeof cost !== 'number' || cost < 0) {
        return res.status(400).json({ message: "Cost must be a positive number" });
      }
      
      const updated = await storage.updateDappCost(appName, cost);
      res.json(updated);
    } catch (error) {
      console.error("Error updating dapp cost:", error);
      res.status(500).json({ message: "Failed to update dapp cost" });
    }
  });

  // NFT routes
  app.get('/api/nfts/available', requireAuth, async (req, res) => {
    try {
      const nfts = await storage.getAvailableNfts();
      res.json(nfts);
    } catch (error) {
      console.error("Error fetching available NFTs:", error);
      res.status(500).json({ message: "Failed to fetch available NFTs" });
    }
  });

  app.get('/api/nfts/stats', requireAuth, async (req, res) => {
    try {
      const stats = await storage.getNftCollectionStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching NFT stats:", error);
      res.status(500).json({ message: "Failed to fetch NFT stats" });
    }
  });

  app.get('/api/user/nfts', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const nfts = await storage.getUserNfts(userId);
      res.json(nfts);
    } catch (error) {
      console.error("Error fetching user NFTs:", error);
      res.status(500).json({ message: "Failed to fetch user NFTs" });
    }
  });

  // Admin NFT minting endpoint
  app.post('/api/admin/mint-nft', requireAdmin, async (req, res) => {
    try {
      const { theme, rarity, quantity } = req.body;
      
      if (!theme || !rarity || !quantity || quantity < 1) {
        return res.status(400).json({ message: 'Invalid input parameters' });
      }
      
      const mintedNfts = [];
      
      for (let i = 0; i < quantity; i++) {
        // Generate AI description based on theme and rarity
        const description = `A ${rarity.toLowerCase()} ${theme.toLowerCase()} NFT with unique characteristics and mystical properties. This digital collectible represents the essence of ${theme} with ${rarity.toLowerCase()} traits that make it truly special.`;
        
        const nft = await storage.createNFTForCollection({
          description,
          rarity,
          attributes: { theme, rarity }
        });
        mintedNfts.push(nft);
      }
      
      res.json({ 
        message: `Successfully created ${quantity} NFT(s)`,
        nfts: mintedNfts
      });
    } catch (error) {
      console.error("Error creating NFTs:", error);
      res.status(500).json({ message: "Failed to create NFTs" });
    }
  });

  app.post('/api/nfts/buy', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { nftId } = req.body;
      
      // Check if NFT purchase is enabled
      const nftMintSettings = await storage.getDappByName('nft_mint');
      if (!nftMintSettings || !nftMintSettings.isEnabled) {
        return res.status(403).json({ message: 'NFT purchasing is currently disabled' });
      }

      // Check user balance
      const balance = await storage.getUserBalance(userId);
      const cost = parseFloat(nftMintSettings.cost);
      const userBalance = parseFloat(balance?.balance || '0');

      if (userBalance < cost) {
        return res.status(400).json({ 
          message: 'Insufficient token balance',
          required: cost,
          current: userBalance
        });
      }

      // Deduct cost from user balance
      const newBalance = (userBalance - cost).toString();
      await storage.updateUserBalance(userId, newBalance, '0');

      // Buy/Purchase NFT (assign to user)
      await storage.mintNft(userId, nftId);
      
      res.json({ message: 'NFT purchased successfully', cost, newBalance });
    } catch (error) {
      console.error("Error purchasing NFT:", error);
      res.status(500).json({ message: "Failed to purchase NFT" });
    }
  });

  // Meme generation routes
  app.get('/api/user/memes', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const memes = await storage.getUserMemes(userId);
      res.json(memes);
    } catch (error) {
      console.error("Error fetching user memes:", error);
      res.status(500).json({ message: "Failed to fetch user memes" });
    }
  });

  app.post('/api/memes/generate', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { prompt } = req.body;
      
      if (!prompt || prompt.trim().length === 0) {
        return res.status(400).json({ message: 'Prompt is required' });
      }

      // Check if meme generator is enabled
      const memeSettings = await storage.getDappByName('meme_generator');
      if (!memeSettings || !memeSettings.isEnabled) {
        return res.status(403).json({ message: 'Meme generation is currently disabled' });
      }

      // Check user balance
      const balance = await storage.getUserBalance(userId);
      const cost = parseFloat(memeSettings.cost);
      const userBalance = parseFloat(balance?.balance || '0');

      if (userBalance < cost) {
        return res.status(400).json({ 
          message: 'Insufficient token balance',
          required: cost,
          current: userBalance
        });
      }

      // Deduct cost from user balance
      const newBalance = (userBalance - cost).toString();
      await storage.updateUserBalance(userId, newBalance, '0');

      // Create meme generation record
      const meme = await storage.createMemeGeneration(userId, prompt.trim());
      
      // Simulate AI meme generation (in real implementation, use actual AI service)
      setTimeout(async () => {
        try {
          await storage.updateMemeGeneration(meme.id, {
            status: 'completed',
            imageUrl: `https://via.placeholder.com/512x512.png?text=${encodeURIComponent(prompt.trim().substring(0, 20))}`
          });
        } catch (error) {
          console.error('Failed to update meme generation:', error);
        }
      }, 3000);
      
      res.json({ message: 'Meme generation started', cost, newBalance, memeId: meme.id });
    } catch (error) {
      console.error("Error generating meme:", error);
      res.status(500).json({ message: "Failed to generate meme" });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static('uploads'));

  // Admin User Management Routes
  app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsersForAdmin();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/admin/users/:userId/tokens/send', requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { amount, reason } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      await storage.adjustUserTokenBalance(userId, amount, `Admin sent tokens: ${reason || 'No reason provided'}`);
      res.json({ message: "Tokens sent successfully" });
    } catch (error) {
      console.error("Error sending tokens:", error);
      res.status(500).json({ message: "Failed to send tokens" });
    }
  });

  app.post('/api/admin/users/:userId/tokens/deduct', requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { amount, reason } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const userBalance = await storage.getUserBalance(userId);
      if (!userBalance) {
        return res.status(404).json({ message: "User balance not found" });
      }

      const currentBalance = parseFloat(userBalance.balance || '0');
      if (currentBalance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      await storage.adjustUserTokenBalance(userId, -amount, `Admin deducted tokens: ${reason || 'No reason provided'}`);
      res.json({ message: "Tokens deducted successfully" });
    } catch (error) {
      console.error("Error deducting tokens:", error);
      res.status(500).json({ message: "Failed to deduct tokens" });
    }
  });

  // Admin NFT Minting Route
  app.post('/api/admin/mint-nft', requireAdmin, async (req, res) => {
    try {
      const { theme, rarity, quantity = 1, referenceImageUrl } = req.body;
      
      if (!theme) {
        return res.status(400).json({ message: "Theme is required" });
      }

      const results = [];
      
      for (let i = 0; i < quantity; i++) {
        // Step 1: Generate AI metadata first
        const metadataPrompt = `Create detailed metadata for a unique NFT with theme: "${theme}" and rarity: "${rarity || 'Common'}". 
        Include: name, description, and 3-5 special attributes (like power, element, style, background, etc.).
        Respond in JSON format:
        {
          "name": "Unique NFT Name",
          "description": "Engaging description under 200 words",
          "attributes": [
            {"trait_type": "Power", "value": "Fire Magic"},
            {"trait_type": "Background", "value": "Mystic Forest"},
            {"trait_type": "Rarity", "value": "${rarity || 'Common'}"}
          ]
        }`;
        
        const metadataResponse = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [{ role: "user", content: metadataPrompt }],
          response_format: { type: "json_object" },
          max_tokens: 300,
        });

        const metadata = JSON.parse(metadataResponse.choices[0].message.content);
        
        // Step 2: Generate AI image based on metadata and reference
        let imagePrompt = `Create a high-quality, squared (1:1 aspect ratio) NFT artwork for: "${metadata.name}". 
        Theme: ${theme}, Rarity: ${rarity || 'Common'}. 
        Description: ${metadata.description}. 
        Style: Digital art, vibrant colors, detailed, professional NFT quality.`;
        
        if (referenceImageUrl) {
          imagePrompt += ` Use this reference image style and elements as inspiration.`;
        }
        
        let imageUrl = null;
        try {
          const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: imagePrompt,
            n: 1,
            size: "1024x1024",
            quality: "hd",
          });
          imageUrl = imageResponse.data[0].url;
        } catch (imageError) {
          console.error("Error generating AI image:", imageError);
          // Fallback to placeholder if image generation fails
          imageUrl = `https://via.placeholder.com/512x512/1a1a2e/ffffff?text=${encodeURIComponent(metadata.name)}`;
        }
        
        // Step 3: Create NFT in database with all generated content
        const nft = await storage.createNFTForCollection({
          name: metadata.name,
          theme,
          description: metadata.description,
          rarity: rarity || 'Common',
          attributes: JSON.stringify({
            ...metadata.attributes,
            theme,
            rarity: rarity || 'Common',
            createdBy: 'admin',
            hasReferenceImage: !!referenceImageUrl
          }),
          imageUrl,
          referenceImageUrl
        });
        
        results.push(nft);
      }

      res.json({ message: `Successfully created ${quantity} high-quality NFT(s) with AI-generated images and metadata`, nfts: results });
    } catch (error) {
      console.error("Error minting NFT:", error);
      res.status(500).json({ message: "Failed to mint NFT" });
    }
  });

  // Meme Generation Route
  app.post('/api/dapps/meme-generator/generate', requireAuth, async (req, res) => {
    try {
      const { prompt, style = 'funny' } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      if (!prompt) {
        return res.status(400).json({ message: "Meme prompt is required" });
      }

      // Check user balance
      const userBalance = await storage.getUserBalance(userId);
      const balance = parseFloat(userBalance?.balance || '0');
      const cost = 100000; // 100k tokens
      
      if (balance < cost) {
        return res.status(400).json({ message: "Insufficient balance. Need 100,000 tokens." });
      }

      // Generate meme description with AI
      const memePrompt = `Create a ${style} meme concept based on: "${prompt}". Describe the visual elements, text, and style. Make it engaging and shareable. Keep it under 150 words.`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: memePrompt }],
        max_tokens: 150,
      });

      const generatedDescription = response.choices[0].message.content;

      // Deduct tokens
      await storage.adjustUserTokenBalance(userId, -cost, 'Meme generation');
      
      // Save meme generation
      const meme = await storage.createMemeGeneration({
        userId,
        prompt,
        style,
        generatedDescription,
        cost: cost.toString(),
      });

      res.json({ 
        message: "Meme generated successfully!", 
        meme: {
          ...meme,
          description: generatedDescription
        }
      });
    } catch (error) {
      console.error("Error generating meme:", error);
      res.status(500).json({ message: "Failed to generate meme" });
    }
  });

  // Referral system endpoints
  app.get('/api/user/referral-code', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user?.referralCode) {
        // Generate referral code if not exists
        const referralCode = await storage.generateReferralCode(userId);
        return res.json({ referralCode });
      }
      
      res.json({ referralCode: user.referralCode });
    } catch (error) {
      console.error("Error getting referral code:", error);
      res.status(500).json({ message: "Failed to get referral code" });
    }
  });

  app.get('/api/user/referral-earnings', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const earnings = await storage.getUserReferralEarnings(userId);
      res.json(earnings);
    } catch (error) {
      console.error("Error getting referral earnings:", error);
      res.status(500).json({ message: "Failed to get referral earnings" });
    }
  });

  app.post('/api/user/set-referrer', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { referralCode } = req.body;
      
      if (!referralCode) {
        return res.status(400).json({ message: "Referral code is required" });
      }

      // Check if user already has a referrer
      const user = await storage.getUser(userId);
      if (user?.referredBy) {
        return res.status(400).json({ message: "User already has a referrer" });
      }

      // Find referrer by code
      const referrer = await storage.getUserByReferralCode(referralCode);
      if (!referrer) {
        return res.status(404).json({ message: "Invalid referral code" });
      }

      if (referrer.id === userId) {
        return res.status(400).json({ message: "Cannot refer yourself" });
      }

      // Update user with referrer
      await storage.updateUser(userId, { referredBy: referrer.id });
      
      res.json({ 
        message: "Referrer set successfully",
        referrer: { name: referrer.name, email: referrer.email }
      });
    } catch (error) {
      console.error("Error setting referrer:", error);
      res.status(500).json({ message: "Failed to set referrer" });
    }
  });

  // Leaderboard endpoints
  app.get('/api/leaderboard/investors', async (req, res) => {
    try {
      const topInvestors = await storage.getTopInvestors(10);
      res.json(topInvestors);
    } catch (error) {
      console.error("Error getting top investors:", error);
      res.status(500).json({ message: "Failed to get top investors" });
    }
  });

  app.get('/api/leaderboard/referrers', async (req, res) => {
    try {
      const topReferrers = await storage.getTopReferrers(10);
      res.json(topReferrers);
    } catch (error) {
      console.error("Error getting top referrers:", error);
      res.status(500).json({ message: "Failed to get top referrers" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
