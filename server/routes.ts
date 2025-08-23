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

  // Admin NFT minting endpoint
  app.post("/api/admin/mint-nft", requireAdmin, async (req: any, res) => {
    try {
      const { theme, rarity, quantity = 1, referenceImageUrl } = req.body;
      
      if (!theme || !rarity) {
        return res.status(400).json({ message: "Theme and rarity are required" });
      }

      const results = [];
      
      for (let i = 0; i < quantity; i++) {
        // Generate AI description using OpenAI
        let description = `A unique ${rarity.toLowerCase()} NFT with ${theme} theme`;
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system", 
                content: "You are an NFT description generator. Create engaging, unique descriptions for NFTs."
              },
              {
                role: "user",
                content: `Create a detailed, engaging description for a ${rarity} rarity NFT with the theme: ${theme}`
              }
            ],
            max_tokens: 150
          });
          description = completion.choices[0]?.message?.content || description;
        } catch (error) {
          console.log("AI description generation failed, using default");
        }

        // Create NFT in collection
        const nft = await storage.createNFTForCollection({
          name: `${theme} NFT`,
          description,
          rarity,
          referenceImageUrl,
          attributes: { theme, generated: true }
        });
        
        results.push(nft);
      }

      res.json({ 
        message: `Successfully created ${quantity} NFT(s)`,
        nfts: results 
      });
    } catch (error) {
      console.error("Admin NFT minting failed:", error);
      res.status(500).json({ message: "Failed to mint NFT" });
    }
  });

  // Meme generation endpoint
  app.post("/api/memes/generate", requireAuth, async (req: any, res) => {
    try {
      const { prompt } = req.body;
      const userId = req.user?.id;
      
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Check if user has enough balance
      const balance = await storage.getUserBalance(userId);
      const dappSettings = await storage.getDappSettings();
      const memeGeneratorSettings = dappSettings.find(d => d.appName === 'meme_generator');
      const cost = parseFloat(memeGeneratorSettings?.cost || '10');
      
      if (parseFloat(balance?.balance || '0') < cost) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Generate AI description for the meme
      let generatedDescription = `A funny meme about: ${prompt}`;
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a meme description generator. Create funny, engaging descriptions for memes."
            },
            {
              role: "user", 
              content: `Create a funny, engaging description for a meme with the prompt: ${prompt}`
            }
          ],
          max_tokens: 100
        });
        generatedDescription = completion.choices[0]?.message?.content || generatedDescription;
      } catch (error) {
        console.log("AI description generation failed, using default");
      }

      // Create meme generation record
      const meme = await storage.createMemeGeneration({
        userId,
        prompt: prompt.trim(),
        style: 'funny',
        generatedDescription,
        cost,
        status: 'processing'
      });

      // Deduct cost from user balance
      await storage.updateUserBalance(userId, -cost);

      // Simulate processing and mark as completed (in real app, this would be async)
      setTimeout(async () => {
        try {
          await storage.updateMemeGeneration(meme.id, {
            status: 'completed',
            imageUrl: `https://via.placeholder.com/512x512.png?text=Meme+${meme.id}`
          });
        } catch (error) {
          console.error("Failed to update meme status:", error);
        }
      }, 2000);

      res.json({ 
        message: "Meme generation started", 
        meme 
      });
    } catch (error) {
      console.error("Meme generation failed:", error);
      res.status(500).json({ message: "Failed to generate meme" });
    }
  });

  // NFT purchase endpoint
  app.post("/api/nfts/buy", requireAuth, async (req: any, res) => {
    try {
      const { nftId } = req.body;
      const userId = req.user?.id;
      
      if (!nftId) {
        return res.status(400).json({ message: "NFT ID is required" });
      }

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Check if NFT exists and is available
      const nft = await storage.getNftById(nftId);
      if (!nft || nft.isMinted) {
        return res.status(400).json({ message: "NFT not available" });
      }

      // Check if user has enough balance
      const balance = await storage.getUserBalance(userId);
      const dappSettings = await storage.getDappSettings();
      const nftMintSettings = dappSettings.find(d => d.appName === 'nft_mint');
      const cost = parseFloat(nftMintSettings?.cost || '50');
      
      if (parseFloat(balance?.balance || '0') < cost) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Mint NFT to user
      await storage.mintNft(userId, nftId);
      
      // Deduct cost from user balance  
      await storage.updateUserBalance(userId, -cost);

      res.json({ 
        message: "NFT purchased successfully",
        nft 
      });
    } catch (error) {
      console.error("NFT purchase failed:", error);
      res.status(500).json({ message: "Failed to purchase NFT" });
    }
  });

  // Get available NFTs for purchase
  app.get("/api/nfts/available", async (req, res) => {
    try {
      const nfts = await storage.getAvailableNfts();
      res.json(nfts);
    } catch (error) {
      console.error("Failed to fetch available NFTs:", error);
      res.status(500).json({ message: "Failed to fetch NFTs" });
    }
  });

  // Get user's NFTs
  app.get("/api/user/nfts", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const nfts = await storage.getUserNfts(userId);
      res.json(nfts);
    } catch (error) {
      console.error("Failed to fetch user NFTs:", error);
      res.status(500).json({ message: "Failed to fetch user NFTs" });
    }
  });

  // Get user's memes
  app.get("/api/user/memes", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const memes = await storage.getUserMemes(userId);
      res.json(memes);
    } catch (error) {
      console.error("Failed to fetch user memes:", error);
      res.status(500).json({ message: "Failed to fetch user memes" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}