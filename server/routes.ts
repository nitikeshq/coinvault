import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth, requireAdmin } from "./auth";
import { insertDepositRequestSchema, insertDepositSettingsSchema, insertNewsArticleSchema, insertSocialLinkSchema, insertTokenConfigSchema, insertWebsiteSettingsSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import { blockchainService } from "./blockchainService";
import OpenAI from "openai";
import { ImageManager } from "./imageManager";
import marketRoutes from "./marketRoutes";
import { createHash } from "crypto";

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

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
  
  // Mount marketplace routes (separate from existing APIs)
  app.use(marketRoutes);

  // Upload Routes - Now using local storage
  app.post('/api/objects/upload', requireAuth, async (req, res) => {
    res.json({ message: "Local storage upload - images saved to /uploads folder" });
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

  app.put('/api/user/profile', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { name, username, email, phone } = req.body;
      
      // Update user profile (excluding wallet address for security)
      const updatedUser = await storage.updateUser(userId, {
        name,
        username,
        email,
        phone,
      });
      
      res.json({ ...updatedUser, password: undefined });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
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
      const isPresaleActive = presaleConfig?.isActive && presaleConfig.endDate && new Date() < new Date(presaleConfig.endDate);
      
      if (isPresaleActive) {
        // During presale: Read from database
        const balance = await storage.getUserBalance(userId);
        const tokenConfig = await storage.getActiveTokenConfig();
        const tokenPrice = tokenConfig ? await storage.getLatestTokenPrice(tokenConfig.id) : null;
        
        if (balance && tokenPrice) {
          const usdValue = (parseFloat(balance.balance || '0') * parseFloat(tokenPrice.priceUsd || '0')).toString();
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
      
      // Extract form data - now receiving token amounts directly
      const data: any = {
        amount: req.body.tokenAmount, // This is now the token amount
        originalAmount: req.body.originalAmount, // Original INR/USD amount
        currency: req.body.currency, // INR or USD
        transactionHash: req.body.transactionHash,
        paymentMethod: req.body.paymentMethod,
      };
      
      console.log('💰 Deposit request (token-based):', data);
      
      if (req.file) {
        data.screenshot = req.file.path;
      }
      
      // Ensure token amount is provided
      if (!data.amount) {
        console.log('Token amount not provided, request body:', req.body);
        return res.status(400).json({ message: "Token amount is required" });
      }
      
      // Ensure original amount is provided for reference
      if (!data.originalAmount) {
        return res.status(400).json({ message: "Original deposit amount is required" });
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

  // Shared deposit approval logic
  const processDepositApproval = async (depositRequest: any, status: string, adminNotes?: string) => {
    await storage.updateDepositStatus(depositRequest.id, status, adminNotes);
    
    // If deposit is approved, trigger referral earnings and update user balance
    if (status === 'approved' && depositRequest.status !== 'approved') {
      const depositAmount = parseFloat(depositRequest.amount);
      
      // Credit user's token balance directly (amount is already in tokens)
      const tokensToAdd = parseFloat(depositRequest.amount); // Amount is now token amount
      
      // Get current balance and add new tokens
      const currentBalance = await storage.getUserBalance(depositRequest.userId);
      const currentTokens = parseFloat(currentBalance?.balance || '0');
      const newBalance = (currentTokens + tokensToAdd).toString();
      
      // Calculate USD value for the new balance
      const tokenConfig = await storage.getActiveTokenConfig();
      const tokenPrice = tokenConfig?.defaultPriceUsd ? parseFloat(tokenConfig.defaultPriceUsd.toString()) : 1;
      const newUsdValue = (parseFloat(newBalance) * tokenPrice).toString();
      
      await storage.updateUserBalance(depositRequest.userId, newBalance, newUsdValue);
      
      // Create transaction record for the deposit credit
      await storage.createTransaction({
        userId: depositRequest.userId,
        type: 'deposit',
        amount: tokensToAdd.toString(),
        description: `Deposit approved - ${depositRequest.paymentMethod} ${depositRequest.originalAmount} ${depositRequest.currency} → ${tokensToAdd} tokens`,
        status: 'completed',
        transactionHash: depositRequest.transactionHash,
        fromAddress: null,
        toAddress: null
      });
      
      console.log(`🎉 Credited ${tokensToAdd.toFixed(6)} tokens to user ${depositRequest.userId} (${depositRequest.originalAmount} ${depositRequest.currency})`);
      
      // Handle referral earnings based on original currency amount
      const user = await storage.getUser(depositRequest.userId);
      if (user?.referredBy && depositRequest.originalAmount) {
        const originalAmount = parseFloat(depositRequest.originalAmount);
        let usdEquivalent = originalAmount;
        
        // Convert to USD if needed for referral calculation
        if (depositRequest.currency === 'INR') {
          usdEquivalent = originalAmount / 83; // Convert INR to USD
        }
        
        const earningsAmount = usdEquivalent * 0.05; // 5% referral earnings
        
        await storage.recordReferralEarning({
          referrerId: user.referredBy,
          referredUserId: user.id,
          depositAmount: usdEquivalent,
          earningsAmount,
        });
        
        console.log(`💰 Recorded referral earning: $${earningsAmount.toFixed(2)} for referrer ${user.referredBy}`);
      }
    }
  };

  app.put('/api/admin/deposits/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      
      // Get deposit details before updating
      const allDeposits = await storage.getDepositRequests();
      const depositRequest = allDeposits.find(d => d.id === id);
      if (!depositRequest) {
        return res.status(404).json({ message: "Deposit request not found" });
      }
      
      await processDepositApproval(depositRequest, status, adminNotes);
      
      res.json({ message: "Deposit status updated successfully" });
    } catch (error) {
      console.error("Error updating deposit status:", error);
      res.status(500).json({ message: "Failed to update deposit status" });
    }
  });

  // Add missing endpoints that tests expect
  app.post('/api/admin/deposits/:id/approve', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      
      // Get deposit details before updating
      const allDeposits = await storage.getDepositRequests();
      const depositRequest = allDeposits.find(d => d.id === id);
      if (!depositRequest) {
        return res.status(404).json({ message: "Deposit request not found" });
      }
      
      await processDepositApproval(depositRequest, 'approved', adminNotes);
      
      // Return updated deposit
      const updatedDeposits = await storage.getDepositRequests();
      const updatedDeposit = updatedDeposits.find(d => d.id === id);
      res.json(updatedDeposit);
    } catch (error) {
      console.error("Error approving deposit:", error);
      res.status(500).json({ message: "Failed to approve deposit" });
    }
  });

  app.post('/api/admin/deposits/:id/reject', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { adminNotes } = req.body;
      
      // Get deposit details before updating
      const allDeposits = await storage.getDepositRequests();
      const depositRequest = allDeposits.find(d => d.id === id);
      if (!depositRequest) {
        return res.status(404).json({ message: "Deposit request not found" });
      }
      
      await processDepositApproval(depositRequest, 'rejected', adminNotes);
      
      // Return updated deposit
      const updatedDeposits = await storage.getDepositRequests();
      const updatedDeposit = updatedDeposits.find(d => d.id === id);
      res.json(updatedDeposit);
    } catch (error) {
      console.error("Error rejecting deposit:", error);
      res.status(500).json({ message: "Failed to reject deposit" });
    }
  });

  // Deposit settings routes
  app.get('/api/deposit-settings', async (req, res) => {
    try {
      const settings = await storage.getEnabledDepositSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching enabled deposit settings:", error);
      res.status(500).json({ message: "Failed to fetch deposit settings" });
    }
  });

  app.get('/api/admin/deposit-settings', requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getDepositSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching all deposit settings:", error);
      res.status(500).json({ message: "Failed to fetch deposit settings" });
    }
  });

  app.put('/api/admin/deposit-settings/:paymentMethod', requireAdmin, upload.single('qrCode'), async (req, res) => {
    try {
      const { paymentMethod } = req.params;
      const data = { ...req.body };
      
      if (req.file) {
        data.qrCodeUrl = req.file.path;
      }
      
      // Convert isEnabled to boolean
      if (data.isEnabled !== undefined) {
        data.isEnabled = data.isEnabled === 'true' || data.isEnabled === true;
      }
      
      const validatedData = insertDepositSettingsSchema.parse({
        paymentMethod,
        ...data
      });
      
      const settings = await storage.upsertDepositSettings(validatedData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating deposit settings:", error);
      res.status(500).json({ message: "Failed to update deposit settings" });
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

  // Auction cleanup endpoint
  app.post('/api/marketplace/auction/cleanup', async (req, res) => {
    try {
      const expiredAuctions = await storage.getExpiredAuctions();
      console.log(`Found ${expiredAuctions.length} expired auctions to process`);
      
      let processedCount = 0;
      
      for (const auction of expiredAuctions) {
        const { listing, nft, seller } = auction;
        
        // Check if there are any bids and get the highest one
        const bids = await storage.getNFTBids(listing.id);
        const hasWinningBid = bids && bids.length > 0 && parseFloat(listing.currentHighestBid || "0") > 0;
        
        if (hasWinningBid && listing.highestBidderId) {
          // Transfer NFT to highest bidder
          console.log(`Transferring NFT ${nft.name} to highest bidder ${listing.highestBidderId}`);
          await storage.transferNFTOwnership(
            nft.id, 
            seller.id, 
            listing.highestBidderId, 
            listing.id
          );
        } else {
          // No bids, just mark as inactive (NFT stays with owner)
          console.log(`No bids on NFT ${nft.name}, returning to owner ${seller.name}`);
          await storage.returnNFTToOwner(listing.id);
        }
        
        processedCount++;
      }
      
      res.json({ 
        message: `Processed ${processedCount} expired auctions`,
        processedCount,
        totalExpired: expiredAuctions.length 
      });
    } catch (error) {
      console.error("Error processing expired auctions:", error);
      res.status(500).json({ message: "Failed to process expired auctions" });
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

  // Admin route to set NFT character
  app.post('/api/admin/nft-character', requireAdmin, async (req, res) => {
    try {
      const { characterPrompt } = req.body;
      
      if (!characterPrompt || characterPrompt.trim().length === 0) {
        return res.status(400).json({ message: "Character prompt is required" });
      }
      
      await storage.updateWebsiteSettings({ nftCharacterPrompt: characterPrompt.trim() });
      
      res.json({ message: "NFT character set successfully", characterPrompt: characterPrompt.trim() });
    } catch (error) {
      console.error("Error setting NFT character:", error);
      res.status(500).json({ message: "Failed to set NFT character" });
    }
  });

  // Admin route to get current NFT character
  app.get('/api/admin/nft-character', requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getWebsiteSettings();
      res.json({ characterPrompt: settings?.nftCharacterPrompt || null });
    } catch (error) {
      console.error("Error fetching NFT character:", error);
      res.status(500).json({ message: "Failed to fetch NFT character" });
    }
  });

  // Admin route to set NFT collection limit
  app.post('/api/admin/nft-limit', requireAdmin, async (req, res) => {
    try {
      const { maxNfts } = req.body;
      
      if (!maxNfts || maxNfts < 1) {
        return res.status(400).json({ message: "NFT limit must be at least 1" });
      }
      
      await storage.updateWebsiteSettings({ maxNfts: parseInt(maxNfts) });
      
      res.json({ message: "NFT collection limit set successfully", maxNfts: parseInt(maxNfts) });
    } catch (error) {
      console.error("Error setting NFT limit:", error);
      res.status(500).json({ message: "Failed to set NFT limit" });
    }
  });

  // Admin route to get current NFT limit
  app.get('/api/admin/nft-limit', requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getWebsiteSettings();
      res.json({ maxNfts: settings?.maxNfts || 1000 });
    } catch (error) {
      console.error("Error fetching NFT limit:", error);
      res.status(500).json({ message: "Failed to fetch NFT limit" });
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
    // DISABLED: Frontend should use client-side calculations instead
    console.log('⚠️  DEPRECATED: /api/presale/timer called - frontend should use /api/presale/config + client calculations');
    res.status(410).json({ 
      message: 'This endpoint is deprecated. Use /api/presale/config and calculate client-side.',
      hint: 'Get endDate from /api/presale/config and use Date.now() to calculate remaining time' 
    });
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

      const initialLiquidity = parseFloat(config.initialLiquidity || '0');
      const totalRaised = initialLiquidity + fromDeposits;
      const targetAmount = parseFloat(config.targetAmount || '1000000');
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
      if (!config.endDate) {
        return res.json({ available: true, reason: 'Presale end date not configured' });
      }
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
      if (config && config.endDate) {
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


  app.post('/api/nfts/generate', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { theme, style } = req.body;
      
      if (!theme || theme.trim().length === 0) {
        return res.status(400).json({ message: 'Theme is required' });
      }

      // Check if NFT generation is enabled
      const nftMintSettings = await storage.getDappByName('nft_mint');
      if (!nftMintSettings || !nftMintSettings.isEnabled) {
        return res.status(403).json({ message: 'NFT generation is currently disabled' });
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

      // Get NFT character prompt from admin settings
      const websiteSettings = await storage.getWebsiteSettings();
      const characterPrompt = websiteSettings?.nftCharacterPrompt;
      
      if (!characterPrompt) {
        return res.status(400).json({ 
          message: "NFT generation not yet configured. Please wait for admin setup."
        });
      }

      // Generate rarity based on distribution: 50% Common, 30% Rare, 15% Epic, 5% Legendary
      const getRandomRarity = (): string => {
        const rand = Math.random() * 100;
        if (rand < 50) return "Common";
        if (rand < 80) return "Rare"; // 30% (50 + 30 = 80)
        if (rand < 95) return "Epic"; // 15% (80 + 15 = 95) - using "Epic" instead of "Unique"
        return "Legendary"; // 5% (95 + 5 = 100)
      }

      const generatedRarity = getRandomRarity();

      // Generate AI metadata first
      const metadataPrompt = `Create detailed metadata for a unique NFT with theme: "${theme.trim()}" ${style ? `and style: "${style}"` : ''} and rarity: "${generatedRarity}". 
      Include: name, description, and 3-5 special attributes (like power, element, style, background, etc.) that match the rarity level.
      Make it creative and engaging. For higher rarities, make the attributes more powerful/unique.
      Respond in JSON format:
      {
        "name": "Unique NFT Name",
        "description": "Engaging description under 200 words",
        "attributes": [
          {"trait_type": "Power", "value": "Fire Magic"},
          {"trait_type": "Background", "value": "Mystic Forest"},
          {"trait_type": "Rarity", "value": "${generatedRarity}"}
        ]
      }`;
      
      if (!openai) {
        throw new Error('OpenAI API key not configured');
      }
      
      const metadataResponse = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: metadataPrompt }],
        response_format: { type: "json_object" },
        max_tokens: 300,
      });

      const messageContent = metadataResponse.choices[0]?.message?.content;
      if (!messageContent) {
        throw new Error('No metadata response received');
      }
      const metadata = JSON.parse(messageContent);

      // Generate AI image using the character prompt + user theme
      const imageManager = new ImageManager();
      let imageUrl = null;
      try {
        imageUrl = await imageManager.generateAndSaveNFTImage({
          name: metadata.name,
          description: metadata.description,
          rarity: generatedRarity,
          attributes: metadata.attributes
        }, `${characterPrompt}, ${theme.trim()}${style ? `, ${style} style` : ''}`);
      } catch (imageError) {
        console.error('Failed to generate NFT image:', imageError);
        // Continue without image for now
      }

      // Create NFT for user
      const nft = await storage.createUserNFT({
        userId,
        name: metadata.name,
        description: metadata.description,
        imageUrl: imageUrl || undefined,
        rarity: generatedRarity,
        attributes: metadata.attributes,
        isUserGenerated: true
      });

      res.json({ 
        message: `NFT generated successfully with ${generatedRarity} rarity!`, 
        cost, 
        newBalance, 
        nft: {
          id: nft.id,
          name: metadata.name,
          description: metadata.description,
          imageUrl: imageUrl,
          rarity: generatedRarity
        }
      });
    } catch (error) {
      console.error("Error generating NFT:", error);
      res.status(500).json({ message: "Failed to generate NFT" });
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
      const { prompt, overlayText } = req.body;
      
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
      const meme = await storage.createMemeGeneration({
        userId,
        prompt: prompt.trim(),
        overlayText: overlayText ? overlayText.trim() : null,
        style: 'funny',
        cost: cost.toString(),
        status: 'processing'
      });
      
      // Generate real AI meme image
      setTimeout(async () => {
        try {
          const imageManager = new ImageManager();
          let imageUrl = null;
          let shouldRefund = false;
          let errorMessage = '';
          
          try {
            // Generate meme image with AI, including overlay text if provided
            const fullPrompt = overlayText ? 
              `${prompt.trim()}. Please include this text visibly in the image: "${overlayText.trim()}"` : 
              prompt.trim();
            imageUrl = await imageManager.generateAndSaveMemeImage(fullPrompt, 'funny');
          } catch (imageError: any) {
            console.error('Failed to generate meme image:', imageError);
            
            // Check if it's a safety system rejection or content policy violation
            if (imageError.type === 'OPENAI_SAFETY_REJECTION' || 
                imageError.type === 'CONTENT_POLICY_VIOLATION') {
              shouldRefund = true;
              errorMessage = imageError.message;
              
              // Refund tokens to user
              try {
                const currentBalance = await storage.getUserBalance(userId);
                const refundAmount = parseFloat(cost.toString());
                const newRefundedBalance = (parseFloat(currentBalance?.balance || '0') + refundAmount).toString();
                
                await storage.updateUserBalance(userId, newRefundedBalance, '0');
                await storage.adjustUserTokenBalance(userId, refundAmount, `Meme generation refund: ${errorMessage}`);
                
                console.log(`Refunded ${refundAmount} tokens to user ${userId} due to safety rejection`);
              } catch (refundError) {
                console.error('Failed to refund tokens:', refundError);
              }
            } else {
              // For other errors, set empty imageUrl and don't refund
              imageUrl = '';
              errorMessage = 'Image generation failed, please try again';
            }
          }

          // Update meme generation status
          if (shouldRefund) {
            await storage.updateMemeGeneration(meme.id, {
              status: 'failed',
              generatedDescription: errorMessage
            });
          } else {
            await storage.updateMemeGeneration(meme.id, {
              status: 'completed',
              imageUrl: imageUrl
            });
          }
        } catch (error) {
          console.error('Failed to update meme generation:', error);
          
          // Mark as failed and try to refund
          try {
            await storage.updateMemeGeneration(meme.id, {
              status: 'failed',
              generatedDescription: 'Generation failed due to technical issues'
            });
            
            // Refund tokens for technical failures
            const currentBalance = await storage.getUserBalance(userId);
            const refundAmount = parseFloat(cost.toString());
            const newRefundedBalance = (parseFloat(currentBalance?.balance || '0') + refundAmount).toString();
            
            await storage.updateUserBalance(userId, newRefundedBalance, '0');
            await storage.adjustUserTokenBalance(userId, refundAmount, 'Meme generation refund: Technical failure');
          } catch (refundError) {
            console.error('Failed to refund tokens after technical failure:', refundError);
          }
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
  // Check NFT traits uniqueness
  app.post('/api/admin/check-nft-uniqueness', requireAdmin, async (req, res) => {
    try {
      const { traits } = req.body;
      
      if (!traits) {
        return res.status(400).json({ message: "Traits are required" });
      }

      // Create traits hash for uniqueness check
      const traitsString = `${traits.expression}-${traits.mouth}-${traits.eyewear}-${traits.beard}-${traits.hairStyle}-${traits.background}`;
      const traitsHash = createHash('md5').update(traitsString).digest('hex');
      
      // Check if traits combination already exists
      const existingNFTs = await storage.checkTraitsCombinationExists(traitsHash, traitsString);
      
      res.json({
        isUnique: existingNFTs.length === 0,
        traitsHash,
        existingNFTs: existingNFTs.length > 0 ? existingNFTs : [],
        message: existingNFTs.length === 0 ? 
          'This trait combination is unique!' : 
          `Found ${existingNFTs.length} NFT(s) with similar traits`
      });
    } catch (error) {
      console.error("Error checking NFT uniqueness:", error);
      res.status(500).json({ message: "Failed to check uniqueness" });
    }
  });

  function generateTraitVariations(baseTraits: any, quantity: number) {
    const variations = [];
    const expressionOptions = ['Happy', 'Serious', 'Angry', 'Surprised', 'Bored', 'Excited', 'Confident'];
    const mouthOptions = ['Normal', 'Cigarette', 'Cigar', 'Pipe'];
    const eyewearOptions = ['Black sunglasses', 'Colored sunglasses', 'No glasses', 'Round glasses', 'Dollar eyes'];
    const beardOptions = ['Thick curled beard', 'Short beard', 'Goatee'];
    const hairOptions = ['Messy gray hair', 'Styled gray hair', 'Long gray hair', 'Wavy gray hair'];
    const backgroundOptions = ['Solid color', 'Gradient', 'Abstract', 'Cosmic', 'Neon city'];
    
    variations.push({ ...baseTraits }); // Include original
    
    for (let i = 1; i < quantity; i++) {
      const variation = { ...baseTraits };
      
      // Vary traits randomly to ensure uniqueness
      if (Math.random() < 0.4) variation.expression = expressionOptions[Math.floor(Math.random() * expressionOptions.length)];
      if (Math.random() < 0.3) variation.mouth = mouthOptions[Math.floor(Math.random() * mouthOptions.length)];
      if (Math.random() < 0.3) variation.eyewear = eyewearOptions[Math.floor(Math.random() * eyewearOptions.length)];
      if (Math.random() < 0.2) variation.beard = beardOptions[Math.floor(Math.random() * beardOptions.length)];
      if (Math.random() < 0.2) variation.hairStyle = hairOptions[Math.floor(Math.random() * hairOptions.length)];
      if (Math.random() < 0.3) variation.background = backgroundOptions[Math.floor(Math.random() * backgroundOptions.length)];
      
      variations.push(variation);
    }
    
    return variations;
  }

  app.post('/api/admin/mint-nft', requireAdmin, async (req, res) => {
    try {
      const { traits, rarity, quantity = 1, skipUniquenessCheck = false } = req.body;
      
      if (!traits) {
        return res.status(400).json({ message: "Traits are required" });
      }
      
      if (typeof traits !== 'object') {
        return res.status(400).json({ message: "Traits must be an object" });
      }
      
      // Validate required trait properties
      const requiredTraits = ['expression', 'mouth', 'eyewear', 'beard', 'hairStyle', 'background'];
      const missingTraits = requiredTraits.filter(trait => !traits[trait]);
      
      if (missingTraits.length > 0) {
        return res.status(400).json({ 
          message: `Missing required traits: ${missingTraits.join(', ')}`,
          receivedTraits: Object.keys(traits),
          requiredTraits: requiredTraits
        });
      }

      const results = [];

      // Generate NFTs one by one based on quantity
      for (let i = 0; i < quantity; i++) {
        console.log(`🎨 Generating NFT ${i + 1} of ${quantity}...`);
        
        // Step 1: Generate AI metadata using the traits
        const traitDescription = `
        Character Traits:
        - Expression: ${traits.expression}
        - Mouth/Extras: ${traits.mouth}
        - Eyewear: ${traits.eyewear}
        - Beard/Mustache: ${traits.beard}
        - Hair Style/Color: ${traits.hairStyle}
        - Background: ${traits.background}
        ${traits.accessories ? `- Accessories: ${traits.accessories}` : ''}
        ${traits.customTheme ? `- Custom Theme: ${traits.customTheme}` : ''}
        `;

        const metadataPrompt = `Create detailed metadata for a unique NFT with these specific character traits and rarity: "${rarity || 'Common'}". 
        ${traitDescription}
        
        Create a unique name and engaging description that incorporates these specific traits. Include these exact traits plus any additional special attributes.
        Respond in JSON format:
        {
          "name": "Unique NFT Name incorporating the traits",
          "description": "Engaging description under 200 words that mentions the specific character traits",
          "attributes": [
            {"trait_type": "Expression", "value": "${traits.expression}"},
            {"trait_type": "Mouth", "value": "${traits.mouth}"},
            {"trait_type": "Eyewear", "value": "${traits.eyewear}"},
            {"trait_type": "Beard", "value": "${traits.beard}"},
            {"trait_type": "Hair", "value": "${traits.hairStyle}"},
            {"trait_type": "Background", "value": "${traits.background}"},
            ${traits.accessories ? `{"trait_type": "Accessories", "value": "${traits.accessories}"},` : ''}
            {"trait_type": "Rarity", "value": "${rarity || 'Common'}"}
          ]
        }`;
        
        if (!openai) {
          throw new Error('OpenAI API key not configured');
        }
        
        console.log('🤖 Calling OpenAI for metadata generation...');
        const metadataResponse = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [{ role: "user", content: metadataPrompt }],
          response_format: { type: "json_object" },
          max_tokens: 300,
        });

        console.log('✅ OpenAI metadata response received');
        const messageContent = metadataResponse.choices[0]?.message?.content;
        if (!messageContent) {
          throw new Error('No metadata response received');
        }
        const metadata = JSON.parse(messageContent);
        console.log('📋 Metadata parsed:', metadata.name);
        
        // Step 2: Get NFT character setting from admin
        const websiteSettings = await storage.getWebsiteSettings();
        const characterPrompt = websiteSettings?.nftCharacterPrompt || "Cool man with messy gray hair, thick full beard with curled mustache";
        
        // Step 3: Generate AI image using the character prompt + traits
        const detailedImagePrompt = `${characterPrompt}. 
        Character has: ${traits.expression} expression, ${traits.mouth} mouth, ${traits.eyewear} eyewear, ${traits.beard} beard, ${traits.hairStyle} hair, on ${traits.background} background.
        ${traits.accessories ? `Additional accessories: ${traits.accessories}.` : ''}
        ${traits.customTheme ? `Theme style: ${traits.customTheme}.` : ''}
        High quality digital art, detailed, professional NFT artwork.`;
        
        console.log('🎨 Calling OpenAI DALL-E for image generation...');
        const imageResponse = await openai.images.generate({
          model: "dall-e-3",
          prompt: detailedImagePrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });

        const imageUrl = imageResponse.data?.[0]?.url;
        if (!imageUrl) {
          throw new Error('No image URL received from OpenAI');
        }
        console.log('🖼️ AI image generated successfully!');
        
        // Create traits hash for uniqueness tracking
        const traitsString = `${traits.expression}-${traits.mouth}-${traits.eyewear}-${traits.beard}-${traits.hairStyle}-${traits.background}`;
        const traitsHash = createHash('md5').update(traitsString).digest('hex');

        // Step 4: Create NFT in database with all generated content
        const nft = await storage.createNFTForCollection({
          name: metadata.name,
          description: metadata.description,
          rarity: rarity || 'Common',
          attributes: JSON.stringify(metadata.attributes),
          imageUrl,
          traitsHash,
          traitsString
        });
        
        console.log(`✅ NFT ${i + 1} created successfully: ${metadata.name}`);
        results.push({
          id: nft.id,
          name: metadata.name,
          description: metadata.description,
          rarity: rarity || 'Common',
          imageUrl,
          attributes: metadata.attributes
        });
      }

      return res.status(200).json({
        success: true,
        message: `🎉 Successfully created ${quantity} AI-generated NFT${quantity > 1 ? 's' : ''} with unique traits!`,
        nfts: results,
        totalGenerated: results.length
      });

    } catch (error) {
      console.error('❌ Mint NFT error:', error);
      const message = error instanceof Error ? error.message : "Failed to mint NFT";
      res.status(500).json({ message });
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
      
      if (!openai) {
        throw new Error('OpenAI API key not configured');
      }
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: memePrompt }],
        max_tokens: 150,
      });

      const generatedDescription = response.choices[0].message.content;

      // Generate and save actual meme image
      const imageManager = new ImageManager();
      const imageUrl = await imageManager.generateAndSaveMemeImage(prompt, style);

      // Deduct tokens
      await storage.adjustUserTokenBalance(userId, -cost, 'Meme generation');
      
      // Save meme generation with image URL
      const meme = await storage.createMemeGeneration({
        userId,
        prompt,
        style,
        generatedDescription,
        cost: cost.toString(),
        imageUrl,
      });

      res.json({ 
        message: "Meme generated successfully!", 
        meme: {
          ...meme,
          description: generatedDescription,
          imageUrl
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

  // Staking endpoints
  app.get('/api/user/stakings', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const stakings = await storage.getUserStakings(userId);
      res.json(stakings);
    } catch (error) {
      console.error("Error getting user stakings:", error);
      res.status(500).json({ message: "Failed to get stakings" });
    }
  });

  app.post('/api/staking/create', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { stakeType, tokenAmount, nftId, stakeDurationDays } = req.body;

      // Validate inputs
      if (!stakeType || !stakeDurationDays) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (stakeType === 'token' && (!tokenAmount || parseFloat(tokenAmount) <= 0)) {
        return res.status(400).json({ message: "Invalid token amount" });
      }

      if (stakeType === 'nft' && !nftId) {
        return res.status(400).json({ message: "NFT ID required for NFT staking" });
      }

      // Calculate reward rate based on duration (longer = higher rate)
      const rewardRates = {
        30: 0.05,   // 5% for 30 days
        60: 0.08,   // 8% for 60 days  
        90: 0.12,   // 12% for 90 days
        180: 0.18,  // 18% for 180 days
        365: 0.25   // 25% for 365 days
      };

      const rewardRate = rewardRates[stakeDurationDays as keyof typeof rewardRates] || 0.05;

      // For token staking, deduct tokens from user balance
      if (stakeType === 'token') {
        const balance = await storage.getUserBalance(userId);
        const currentBalance = parseFloat(balance?.balance || '0');
        
        if (currentBalance < parseFloat(tokenAmount)) {
          return res.status(400).json({ message: "Insufficient token balance" });
        }

        // Deduct tokens from user balance
        await storage.adjustUserTokenBalance(userId, -parseFloat(tokenAmount), `Staked ${tokenAmount} tokens for ${stakeDurationDays} days`);
      }

      // Create staking record
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + stakeDurationDays);

      const staking = await storage.createStaking({
        userId,
        stakeType,
        tokenAmount: stakeType === 'token' ? tokenAmount : undefined,
        nftId: stakeType === 'nft' ? nftId : undefined,
        stakeDurationDays,
        rewardRate: rewardRate.toString(),
        endDate,
        isActive: true,
        totalRewards: "0"
      });

      res.json({ message: "Staking created successfully", staking });
    } catch (error) {
      console.error("Error creating staking:", error);
      res.status(500).json({ message: "Failed to create staking" });
    }
  });

  app.post('/api/staking/unstake/:stakingId', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { stakingId } = req.params;

      const staking = await storage.unstakeStaking(stakingId, userId);
      res.json({ message: "Unstaked successfully", staking });
    } catch (error) {
      console.error("Error unstaking:", error);
      res.status(500).json({ message: "Failed to unstake" });
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
