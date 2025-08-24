import {
  users,
  tokenConfig,
  userBalances,
  depositRequests,
  newsArticles,
  socialLinks,
  tokenPrices,
  transactions,
  websiteSettings,
  presaleConfig,
  dappSettings,
  nftCollection,
  userNfts,
  memeGenerations,
  referralEarnings,
  nftListings,
  nftBids,
  memeLikes,
  memeDislikes,
  type User,
  type InsertUser,
  type RegisterUser,
  type TokenConfig,
  type InsertTokenConfig,
  type UserBalance,
  type DepositRequest,
  type InsertDepositRequest,
  type NewsArticle,
  type InsertNewsArticle,
  type SocialLink,
  type InsertSocialLink,
  type TokenPrice,
  type Transaction,
  type WebsiteSettings,
  type InsertWebsiteSettings,
  type PresaleConfig,
  type InsertPresaleConfig,
  type ReferralEarnings,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, lt } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: Partial<InsertUser>): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  
  // Wallet operations
  generateWalletAddress(userId: string): Promise<string>;
  getUserWallet(userId: string): Promise<{address: string, privateKey?: string} | undefined>;
  getUserBalance(userId: string): Promise<UserBalance | undefined>;
  updateUserBalance(userId: string, balance: string, usdValue: string): Promise<void>;
  
  // Token configuration
  getActiveTokenConfig(): Promise<TokenConfig | undefined>;
  updateTokenConfig(config: InsertTokenConfig): Promise<TokenConfig>;
  getAllTokenConfigs(): Promise<TokenConfig[]>;
  
  // Deposit operations
  createDepositRequest(userId: string, request: InsertDepositRequest): Promise<DepositRequest>;
  getDepositRequests(userId?: string): Promise<DepositRequest[]>;
  updateDepositStatus(id: string, status: string, adminNotes?: string): Promise<void>;
  
  // News operations
  getPublishedNews(): Promise<NewsArticle[]>;
  getAllNews(): Promise<NewsArticle[]>;
  createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle>;
  updateNewsArticle(id: string, article: Partial<InsertNewsArticle>): Promise<void>;
  deleteNewsArticle(id: string): Promise<void>;
  
  // Social links
  getActiveSocialLinks(): Promise<SocialLink[]>;
  getAllSocialLinks(): Promise<SocialLink[]>;
  upsertSocialLink(link: InsertSocialLink): Promise<SocialLink>;
  deleteSocialLink(id: string): Promise<void>;
  
  // Token prices
  getLatestTokenPrice(tokenConfigId: string): Promise<TokenPrice | undefined>;
  updateTokenPrice(tokenConfigId: string, priceData: Partial<TokenPrice>): Promise<void>;
  
  // Transactions
  getUserTransactions(userId: string): Promise<Transaction[]>;
  createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction>;
  
  // Website settings
  getWebsiteSettings(): Promise<WebsiteSettings | undefined>;
  updateWebsiteSettings(settings: InsertWebsiteSettings): Promise<WebsiteSettings>;
  
  // Marketplace operations (NFT)
  listNFTForSale(sellerId: string, nftId: string, minPrice: string): Promise<any>;
  placeBidOnNFT(listingId: string, bidderId: string, bidAmount: string, platformFeeAmount: string): Promise<any>;
  getActiveNFTListings(): Promise<any[]>;
  getUserNFTListings(userId: string): Promise<any[]>;
  getNFTBids(listingId: string): Promise<any[]>;
  acceptNFTBid(listingId: string, bidId: string): Promise<void>;
  
  // Marketplace operations (Memes)
  likeMeme(memeId: string, userId: string): Promise<void>;
  dislikeMeme(memeId: string, userId: string): Promise<void>;
  removeLike(memeId: string, userId: string): Promise<void>;
  removeDislike(memeId: string, userId: string): Promise<void>;
  getMemeStats(memeId: string): Promise<{likes: number, dislikes: number}>;
  getMemeLeaderboard(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData as any)
      .returning() as User[];
    
    // Generate wallet address for new user
    if (user.id) {
      await this.generateWalletAddress(user.id);
    }
    
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async generateWalletAddress(userId: string): Promise<string> {
    // Generate a real BEP-20 wallet address using Web3
    const { Web3 } = await import('web3');
    const web3 = new Web3();
    
    // Generate a new account with real private key
    const account = web3.eth.accounts.create();
    
    await db
      .update(users)
      .set({ 
        walletAddress: account.address,
        walletPrivateKey: account.privateKey, // In production, encrypt this
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
    
    // Create initial balance record
    const activeConfig = await this.getActiveTokenConfig();
    if (activeConfig) {
      await db.insert(userBalances).values({
        userId,
        tokenConfigId: activeConfig.id,
        balance: "0",
        usdValue: "0",
      });
    }
    
    return account.address;
  }

  async getUserWallet(userId: string): Promise<{address: string, privateKey?: string} | undefined> {
    const [user] = await db
      .select({ walletAddress: users.walletAddress, walletPrivateKey: users.walletPrivateKey })
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user?.walletAddress) {
      return undefined;
    }
    
    return {
      address: user.walletAddress,
      privateKey: user.walletPrivateKey || undefined
    };
  }

  async getUserBalance(userId: string): Promise<UserBalance | undefined> {
    const [balance] = await db
      .select()
      .from(userBalances)
      .where(eq(userBalances.userId, userId));
    return balance;
  }

  async updateUserBalance(userId: string, balance: string, usdValue: string): Promise<void> {
    await db
      .update(userBalances)
      .set({ balance, usdValue, updatedAt: new Date() })
      .where(eq(userBalances.userId, userId));
  }

  async getActiveTokenConfig(): Promise<TokenConfig | undefined> {
    const [config] = await db
      .select()
      .from(tokenConfig)
      .where(eq(tokenConfig.isActive, true));
    return config;
  }

  async updateTokenConfig(config: InsertTokenConfig): Promise<TokenConfig> {
    // Deactivate all existing configs
    await db.update(tokenConfig).set({ isActive: false });
    
    // Insert new active config
    const [newConfig] = await db
      .insert(tokenConfig)
      .values({ ...config, isActive: true })
      .returning();
    return newConfig;
  }

  async getAllTokenConfigs(): Promise<TokenConfig[]> {
    return await db.select().from(tokenConfig).orderBy(desc(tokenConfig.createdAt));
  }

  async createDepositRequest(userId: string, request: InsertDepositRequest): Promise<DepositRequest> {
    const [depositRequest] = await db
      .insert(depositRequests)
      .values({ ...request, userId })
      .returning();
    return depositRequest;
  }

  async getDepositRequests(userId?: string): Promise<DepositRequest[]> {
    if (userId) {
      return await db
        .select()
        .from(depositRequests)
        .where(eq(depositRequests.userId, userId))
        .orderBy(desc(depositRequests.createdAt));
    }
    return await db
      .select()
      .from(depositRequests)
      .orderBy(desc(depositRequests.createdAt));
  }

  async updateDepositStatus(id: string, status: string, adminNotes?: string): Promise<void> {
    await db
      .update(depositRequests)
      .set({ status, adminNotes, updatedAt: new Date() })
      .where(eq(depositRequests.id, id));
  }

  async getPublishedNews(): Promise<NewsArticle[]> {
    return await db
      .select()
      .from(newsArticles)
      .where(eq(newsArticles.isPublished, true))
      .orderBy(desc(newsArticles.createdAt));
  }

  async getAllNews(): Promise<NewsArticle[]> {
    return await db
      .select()
      .from(newsArticles)
      .orderBy(desc(newsArticles.createdAt));
  }

  async createNewsArticle(article: InsertNewsArticle): Promise<NewsArticle> {
    const [newsArticle] = await db
      .insert(newsArticles)
      .values(article)
      .returning();
    return newsArticle;
  }

  async updateNewsArticle(id: string, article: Partial<InsertNewsArticle>): Promise<void> {
    await db
      .update(newsArticles)
      .set({ ...article, updatedAt: new Date() })
      .where(eq(newsArticles.id, id));
  }

  async deleteNewsArticle(id: string): Promise<void> {
    await db.delete(newsArticles).where(eq(newsArticles.id, id));
  }

  async getActiveSocialLinks(): Promise<SocialLink[]> {
    return await db
      .select()
      .from(socialLinks)
      .where(eq(socialLinks.isActive, true));
  }

  async getAllSocialLinks(): Promise<SocialLink[]> {
    return await db.select().from(socialLinks);
  }

  async upsertSocialLink(link: InsertSocialLink): Promise<SocialLink> {
    const [socialLink] = await db
      .insert(socialLinks)
      .values(link)
      .onConflictDoUpdate({
        target: socialLinks.platform,
        set: { url: link.url, isActive: link.isActive, updatedAt: new Date() },
      })
      .returning();
    return socialLink;
  }

  async deleteSocialLink(id: string): Promise<void> {
    await db.delete(socialLinks).where(eq(socialLinks.id, id));
  }

  async getLatestTokenPrice(tokenConfigId: string): Promise<TokenPrice | undefined> {
    const [price] = await db
      .select()
      .from(tokenPrices)
      .where(eq(tokenPrices.tokenConfigId, tokenConfigId))
      .orderBy(desc(tokenPrices.updatedAt));
    return price;
  }

  async updateTokenPrice(tokenConfigId: string, priceData: Partial<TokenPrice>): Promise<void> {
    // Check if a price entry already exists for this token
    const existingPrice = await db
      .select()
      .from(tokenPrices)
      .where(eq(tokenPrices.tokenConfigId, tokenConfigId))
      .limit(1);

    if (existingPrice.length > 0) {
      // Update existing price entry
      await db
        .update(tokenPrices)
        .set({ ...priceData, updatedAt: new Date() })
        .where(eq(tokenPrices.tokenConfigId, tokenConfigId));
    } else {
      // Insert new price entry
      await db
        .insert(tokenPrices)
        .values({ tokenConfigId, ...priceData } as any);
    }
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getWebsiteSettings(): Promise<WebsiteSettings | undefined> {
    try {
      const [settings] = await db
        .select()
        .from(websiteSettings)
        .orderBy(desc(websiteSettings.createdAt));
      return settings;
    } catch (error) {
      console.error("Error in getWebsiteSettings:", error);
      // Return a default settings object if the table doesn't exist or has missing columns
      return {
        id: 'default',
        siteName: "",
        logoUrl: null,
        faviconUrl: null,
        description: null,
        primaryColor: "#6366f1",
        secondaryColor: "#8b5cf6",
        auditReportUrl: null,
        whitepaperUrl: null,
        nftCharacterPrompt: null,
        maxNfts: 1000,
        seoTitle: null,
        seoDescription: null,
        seoKeywords: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as WebsiteSettings;
    }
  }

  async updateWebsiteSettings(settings: InsertWebsiteSettings): Promise<WebsiteSettings> {
    // Check if settings exist
    const existing = await this.getWebsiteSettings();
    
    if (existing) {
      // Update existing settings
      const [updated] = await db
        .update(websiteSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(websiteSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      // Create new settings
      const [newSettings] = await db
        .insert(websiteSettings)
        .values(settings)
        .returning();
      return newSettings;
    }
  }

  async getApprovedDeposits(): Promise<DepositRequest[]> {
    return await db
      .select()
      .from(depositRequests)
      .where(eq(depositRequests.status, 'approved'));
  }

  // Presale operations
  async getPresaleConfig(): Promise<PresaleConfig | undefined> {
    const [config] = await db.select().from(presaleConfig).limit(1);
    return config;
  }

  async updatePresaleConfig(config: InsertPresaleConfig): Promise<PresaleConfig> {
    // Check if config exists
    const existing = await this.getPresaleConfig();
    
    if (existing) {
      const [updated] = await db
        .update(presaleConfig)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(presaleConfig.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(presaleConfig)
        .values(config)
        .returning();
      return created;
    }
  }

  async updatePresaleLiquidity(amount: string): Promise<PresaleConfig> {
    const config = await this.getPresaleConfig();
    if (!config) {
      throw new Error('Presale config not found');
    }

    const [updated] = await db
      .update(presaleConfig)
      .set({ 
        currentAmount: amount,
        updatedAt: new Date() 
      })
      .where(eq(presaleConfig.id, config.id))
      .returning();
    return updated;
  }

  // Dapps methods
  async getDappSettings(): Promise<any[]> {
    return await db.select().from(dappSettings).orderBy(dappSettings.appName);
  }

  async updateDappSetting(appName: string, enabled: boolean): Promise<any> {
    const [updated] = await db.update(dappSettings)
      .set({ isEnabled: enabled, updatedAt: new Date() })
      .where(eq(dappSettings.appName, appName))
      .returning();
    return updated;
  }

  async updateDappCost(appName: string, cost: number): Promise<any> {
    const [updated] = await db.update(dappSettings)
      .set({ cost: cost.toString(), updatedAt: new Date() })
      .where(eq(dappSettings.appName, appName))
      .returning();
    return updated;
  }

  async getDappByName(appName: string): Promise<any> {
    const [dapp] = await db.select().from(dappSettings)
      .where(eq(dappSettings.appName, appName));
    return dapp;
  }

  // NFT methods
  async getAvailableNfts(): Promise<any[]> {
    return await db.select().from(nftCollection)
      .where(eq(nftCollection.isMinted, false))
      .orderBy(nftCollection.tokenId)
      .limit(100);
  }

  async mintNft(userId: string, nftId: string, transactionHash?: string): Promise<any> {
    await db.transaction(async (tx) => {
      // Mark NFT as minted
      await tx.update(nftCollection)
        .set({ isMinted: true })
        .where(eq(nftCollection.id, nftId));
      
      // Create user NFT record
      await tx.insert(userNfts).values({
        userId,
        nftId,
        transactionHash
      });
    });
  }

  async getUserNfts(userId: string): Promise<any[]> {
    return await db.select({
      id: userNfts.id,
      nftId: userNfts.nftId, // Add the missing nftId field for marketplace listing
      tokenId: nftCollection.tokenId,
      name: nftCollection.name,
      description: nftCollection.description,
      imageUrl: nftCollection.imageUrl,
      rarity: nftCollection.rarity,
      mintedAt: userNfts.mintedAt,
      transactionHash: userNfts.transactionHash,
      isUserGenerated: nftCollection.isUserGenerated
    })
    .from(userNfts)
    .innerJoin(nftCollection, eq(userNfts.nftId, nftCollection.id))
    .where(eq(userNfts.userId, userId))
    .orderBy(userNfts.mintedAt);
  }

  async createUserNFT(data: {
    userId: string;
    name: string;
    description: string;
    imageUrl?: string;
    rarity: string;
    attributes: any[];
    isUserGenerated: boolean;
  }): Promise<any> {
    return await db.transaction(async (tx) => {
      // Get next token ID
      const [lastNft] = await tx.select({ tokenId: nftCollection.tokenId })
        .from(nftCollection)
        .orderBy(sql`${nftCollection.tokenId} DESC`)
        .limit(1);
      
      const nextTokenId = (lastNft?.tokenId || 0) + 1;

      // Create the NFT in collection
      const [createdNft] = await tx.insert(nftCollection).values({
        tokenId: nextTokenId,
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        rarity: data.rarity,
        attributes: data.attributes,
        isMinted: true, // User-generated NFTs are immediately "minted"
        isUserGenerated: data.isUserGenerated
      }).returning();

      // Link NFT to user
      await tx.insert(userNfts).values({
        userId: data.userId,
        nftId: createdNft.id,
        transactionHash: `user-generated-${Date.now()}` // Placeholder transaction hash
      });

      return createdNft;
    });
  }

  // Meme generation methods (original method removed for new signature)

  async updateMemeGeneration(id: string, data: any): Promise<any> {
    const [updated] = await db.update(memeGenerations)
      .set(data)
      .where(eq(memeGenerations.id, id))
      .returning();
    return updated;
  }

  async getUserMemes(userId: string): Promise<any[]> {
    try {
      return await db.select({
        id: memeGenerations.id,
        prompt: memeGenerations.prompt,
        overlayText: memeGenerations.overlayText,
        imageUrl: memeGenerations.imageUrl,
        status: memeGenerations.status,
        generatedAt: memeGenerations.generatedAt,
        userId: memeGenerations.userId,
        errorMessage: memeGenerations.generatedDescription // Use generatedDescription for error messages
      }).from(memeGenerations)
        .where(eq(memeGenerations.userId, userId))
        .orderBy(desc(memeGenerations.generatedAt));
    } catch (error) {
      console.log('Meme table columns not found, returning empty array:', error);
      return [];
    }
  }

  async getNftCollectionStats(): Promise<any> {
    // Get admin-set NFT limit
    const settings = await this.getWebsiteSettings();
    const totalNfts = settings?.maxNfts || 1000;
    
    // Get actual minted count from database
    const [stats] = await db.select({
      mintedNfts: sql<number>`sum(case when is_minted = true then 1 else 0 end)`,
      availableInDb: sql<number>`sum(case when is_minted = false then 1 else 0 end)`
    }).from(nftCollection);
    
    const mintedCount = stats?.mintedNfts || 0;
    const availableInDb = stats?.availableInDb || 0;
    const totalCreated = mintedCount + availableInDb;
    
    // Calculate how many can still be created
    const availableNfts = Math.max(0, totalNfts - mintedCount);
    
    return {
      totalNfts,
      mintedNfts: mintedCount,
      availableNfts,
      totalCreated
    };
  }

  // Admin user management methods
  async getAllUsersForAdmin(): Promise<any[]> {
    const result = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      tokenBalance: userBalances.balance,
      withdrawalAddress: users.withdrawalAddress,
      createdAt: users.createdAt,
      isAdmin: users.isAdmin
    }).from(users)
    .leftJoin(userBalances, eq(users.id, userBalances.userId))
    .orderBy(users.createdAt);
    
    return result.map(user => ({
      ...user,
      tokenBalance: user.tokenBalance || '0'
    }));
  }

  async adjustUserTokenBalance(userId: string, amount: number, reason: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Get active token config
      const [activeTokenConfig] = await tx.select()
        .from(tokenConfig)
        .where(eq(tokenConfig.isActive, true))
        .limit(1);

      if (!activeTokenConfig) {
        throw new Error('No active token configuration found');
      }

      // Get current balance or create if doesn't exist
      const [currentBalance] = await tx.select()
        .from(userBalances)
        .where(eq(userBalances.userId, userId));

      const currentAmount = parseFloat(currentBalance?.balance || '0');
      const newAmount = (currentAmount + amount).toString();

      if (currentBalance) {
        // Update existing balance
        await tx.update(userBalances)
          .set({ 
            balance: newAmount, 
            updatedAt: new Date() 
          })
          .where(eq(userBalances.userId, userId));
      } else {
        // Create new balance record with required token_config_id
        await tx.insert(userBalances)
          .values({
            userId,
            tokenConfigId: activeTokenConfig.id,
            balance: newAmount,
            usdValue: '0'
          });
      }

      // Log the transaction
      await tx.insert(transactions)
        .values({
          userId,
          type: amount > 0 ? 'credit' : 'debit',
          amount: Math.abs(amount).toString(),
          description: reason,
          status: 'completed'
        });
    });
  }

  async createNFTForCollection(nftData: any): Promise<any> {
    // Get the next token ID
    const [maxToken] = await db.select({
      maxId: sql<number>`max(token_id)`
    }).from(nftCollection);
    
    const nextTokenId = (maxToken.maxId || 0) + 1;
    
    const [nft] = await db.insert(nftCollection)
      .values({
        tokenId: nextTokenId,
        name: nftData.name || `NFT #${nextTokenId}`,
        description: nftData.description,
        imageUrl: nftData.imageUrl || `https://via.placeholder.com/512x512.png?text=NFT+${nextTokenId}`,
        rarity: nftData.rarity || 'Common',
        attributes: nftData.attributes,
        referenceImageUrl: nftData.referenceImageUrl,
        isMinted: false
      })
      .returning();
      
    return nft;
  }

  async checkTraitsCombinationExists(traitsHash: string, traitsString: string): Promise<any[]> {
    // For now, skip the complex LIKE query and return empty array 
    // This will effectively skip uniqueness checking until we can implement it properly
    console.log('⚠️  Skipping traits combination check for now to avoid SQL syntax error');
    console.log('   traitsHash:', traitsHash);
    console.log('   traitsString:', traitsString);
    console.log('✅ checkTraitsCombinationExists returning empty array');
    return [];
  }

  // Update createMemeGeneration to match the new signature
  async createMemeGeneration(data: any): Promise<any> {
    const [meme] = await db.insert(memeGenerations)
      .values({
        userId: data.userId,
        prompt: data.prompt,
        overlayText: data.overlayText || null, // Add overlay text field
        style: data.style || 'funny',
        generatedDescription: data.generatedDescription,
        cost: data.cost,
        imageUrl: data.imageUrl, // Add missing imageUrl field
        status: data.status || 'completed'
      })
      .returning();
    return meme;
  }

  // Referral system methods
  async generateReferralCode(userId: string): Promise<string> {
    const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    await db.update(users)
      .set({ referralCode })
      .where(eq(users.id, userId));
    return referralCode;
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const [user] = await db.select()
      .from(users)
      .where(eq(users.referralCode, referralCode));
    return user;
  }

  async recordReferralEarning(data: {
    referrerId: string;
    referredUserId: string;
    depositAmount: number;
    earningsAmount: number;
  }): Promise<ReferralEarnings> {
    const [earning] = await db.insert(referralEarnings)
      .values({
        referrerId: data.referrerId,
        referredUserId: data.referredUserId,
        depositAmount: data.depositAmount.toString(),
        earningsAmount: data.earningsAmount.toString(),
      })
      .returning();
    return earning;
  }

  async getUserReferralEarnings(userId: string): Promise<ReferralEarnings[]> {
    return await db.select()
      .from(referralEarnings)
      .where(eq(referralEarnings.referrerId, userId))
      .orderBy(desc(referralEarnings.createdAt));
  }

  async getTopInvestors(limit: number = 10): Promise<Array<{
    user: User;
    totalInvested: string;
    rank: number;
  }>> {
    const results = await db.select({
      userId: depositRequests.userId,
      totalInvested: sql<string>`SUM(${depositRequests.amount})::text`,
      user: users
    })
    .from(depositRequests)
    .innerJoin(users, eq(depositRequests.userId, users.id))
    .where(eq(depositRequests.status, 'approved'))
    .groupBy(depositRequests.userId, users.id)
    .orderBy(desc(sql`SUM(${depositRequests.amount})`))
    .limit(limit);

    return results.map((result, index) => ({
      user: result.user,
      totalInvested: result.totalInvested,
      rank: index + 1
    }));
  }

  async getTopReferrers(limit: number = 10): Promise<Array<{
    user: User;
    totalEarnings: string;
    referralCount: number;
    rank: number;
  }>> {
    const results = await db.select({
      referrerId: referralEarnings.referrerId,
      totalEarnings: sql<string>`SUM(${referralEarnings.earningsAmount})::text`,
      referralCount: sql<number>`COUNT(DISTINCT ${referralEarnings.referredUserId})`,
      user: users
    })
    .from(referralEarnings)
    .innerJoin(users, eq(referralEarnings.referrerId, users.id))
    .groupBy(referralEarnings.referrerId, users.id)
    .orderBy(desc(sql`SUM(${referralEarnings.earningsAmount})`))
    .limit(limit);

    return results.map((result, index) => ({
      user: result.user,
      totalEarnings: result.totalEarnings,
      referralCount: result.referralCount,
      rank: index + 1
    }));
  }

  // Marketplace methods (NFT)
  async listNFTForSale(sellerId: string, nftId: string, minPrice: string, auctionEndDate?: string) {
    const [listing] = await db
      .insert(nftListings)
      .values({
        nftId,
        sellerId,
        minPrice,
        auctionEndDate: auctionEndDate ? new Date(auctionEndDate) : undefined,
        isActive: true,
      })
      .returning();
    return listing;
  }

  async placeBidOnNFT(listingId: string, bidderId: string, bidAmount: string, platformFeeAmount: string) {
    await db.transaction(async (tx) => {
      // Deactivate previous bids for this listing
      await tx
        .update(nftBids)
        .set({ isActive: false })
        .where(eq(nftBids.listingId, listingId));

      // Insert new bid
      await tx
        .insert(nftBids)
        .values({
          listingId,
          bidderId,
          bidAmount,
          platformFeeAmount,
          platformFeePaid: true,
          isActive: true,
        });

      // Update listing with highest bid
      await tx
        .update(nftListings)
        .set({
          currentHighestBid: bidAmount,
          highestBidderId: bidderId,
          updatedAt: new Date(),
        })
        .where(eq(nftListings.id, listingId));
    });
  }

  async getListingBids(listingId: string) {
    const bids = await db
      .select({
        bid: nftBids,
        bidder: users
      })
      .from(nftBids)
      .innerJoin(users, eq(nftBids.bidderId, users.id))
      .where(eq(nftBids.listingId, listingId))
      .orderBy(desc(nftBids.bidAmount), desc(nftBids.createdAt));

    return bids;
  }

  async getListingDetails(listingId: string) {
    const [listing] = await db
      .select({
        listing: nftListings,
        nft: nftCollection,
        seller: users
      })
      .from(nftListings)
      .innerJoin(nftCollection, eq(nftListings.nftId, nftCollection.id))
      .innerJoin(users, eq(nftListings.sellerId, users.id))
      .where(eq(nftListings.id, listingId))
      .limit(1);

    return listing;
  }

  async getActiveNFTListings() {
    return await db
      .select({
        listing: nftListings,
        nft: nftCollection,
        seller: users,
      })
      .from(nftListings)
      .innerJoin(nftCollection, eq(nftListings.nftId, nftCollection.id))
      .innerJoin(users, eq(nftListings.sellerId, users.id))
      .where(eq(nftListings.isActive, true))
      .orderBy(desc(nftListings.createdAt));
  }

  async getPlatformNFTListings() {
    const now = new Date();
    return await db
      .select({
        listing: nftListings,
        nft: nftCollection,
        seller: users,
      })
      .from(nftListings)
      .innerJoin(nftCollection, eq(nftListings.nftId, nftCollection.id))
      .innerJoin(users, eq(nftListings.sellerId, users.id))
      .where(
        and(
          eq(nftListings.isActive, true),
          eq(nftCollection.isUserGenerated, false),
          // Exclude expired auctions - if auctionEndDate is null (no auction) or greater than now
          sql`(${nftListings.auctionEndDate} IS NULL OR ${nftListings.auctionEndDate} > ${now})`
        )
      )
      .orderBy(desc(nftListings.createdAt));
  }

  async getUserGeneratedNFTListings() {
    const now = new Date();
    return await db
      .select({
        listing: nftListings,
        nft: nftCollection,
        seller: users,
      })
      .from(nftListings)
      .innerJoin(nftCollection, eq(nftListings.nftId, nftCollection.id))
      .innerJoin(users, eq(nftListings.sellerId, users.id))
      .where(
        and(
          eq(nftListings.isActive, true),
          eq(nftCollection.isUserGenerated, true),
          // Exclude expired auctions - if auctionEndDate is null (no auction) or greater than now
          sql`(${nftListings.auctionEndDate} IS NULL OR ${nftListings.auctionEndDate} > ${now})`
        )
      )
      .orderBy(desc(nftListings.createdAt));
  }

  async getUserNFTListings(userId: string) {
    return await db
      .select({
        listing: nftListings,
        nft: nftCollection,
      })
      .from(nftListings)
      .innerJoin(nftCollection, eq(nftListings.nftId, nftCollection.id))
      .where(eq(nftListings.sellerId, userId))
      .orderBy(desc(nftListings.createdAt));
  }

  // Auction expiry handling methods
  async getExpiredAuctions() {
    const now = new Date();
    return await db
      .select({
        listing: nftListings,
        nft: nftCollection,
        seller: users,
      })
      .from(nftListings)
      .innerJoin(nftCollection, eq(nftListings.nftId, nftCollection.id))
      .innerJoin(users, eq(nftListings.sellerId, users.id))
      .where(
        and(
          eq(nftListings.isActive, true),
          lt(nftListings.auctionEndDate, now)
        )
      );
  }

  async transferNFTOwnership(nftId: string, fromUserId: string, toUserId: string, listingId: string) {
    return await db.transaction(async (tx) => {
      // Remove NFT from current owner's collection
      await tx.delete(userNfts)
        .where(
          and(
            eq(userNfts.nftId, nftId),
            eq(userNfts.userId, fromUserId)
          )
        );

      // Add NFT to new owner's collection
      await tx.insert(userNfts).values({
        userId: toUserId,
        nftId: nftId,
        mintedAt: new Date(),
      });

      // Mark listing as sold and inactive
      await tx.update(nftListings)
        .set({
          isActive: false,
          soldAt: new Date(),
        })
        .where(eq(nftListings.id, listingId));
    });
  }

  async returnNFTToOwner(listingId: string) {
    return await db.update(nftListings)
      .set({
        isActive: false,
        soldAt: new Date(),
      })
      .where(eq(nftListings.id, listingId));
  }

  async processExpiredAuction(listingId: string, hasWinningBid: boolean, sellerId: string, winnerId?: string, nftId?: string) {
    return await db.transaction(async (tx) => {
      if (hasWinningBid && winnerId && nftId) {
        // Transfer NFT to highest bidder
        await this.transferNFTOwnership(nftId, sellerId, winnerId, listingId);
      } else {
        // Just mark listing as inactive (NFT stays with original owner)
        await this.returnNFTToOwner(listingId);
      }
    });
  }

  async getNFTBids(listingId: string) {
    return await db
      .select({
        bid: nftBids,
        bidder: users,
      })
      .from(nftBids)
      .innerJoin(users, eq(nftBids.bidderId, users.id))
      .where(eq(nftBids.listingId, listingId))
      .orderBy(desc(nftBids.bidAmount));
  }

  async acceptNFTBid(listingId: string, bidId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Get the winning bid details
      const [bid] = await tx
        .select()
        .from(nftBids)
        .where(eq(nftBids.id, bidId));

      if (!bid) throw new Error('Bid not found');

      // Get listing details
      const [listing] = await tx
        .select()
        .from(nftListings)
        .where(eq(nftListings.id, listingId));

      if (!listing) throw new Error('Listing not found');

      // Transfer NFT ownership
      await tx
        .update(userNfts)
        .set({ userId: bid.bidderId })
        .where(eq(userNfts.nftId, listing.nftId));

      // Mark listing as sold
      await tx
        .update(nftListings)
        .set({
          isActive: false,
          soldAt: new Date(),
        })
        .where(eq(nftListings.id, listingId));
    });
  }

  // Marketplace methods (Memes)
  async likeMeme(memeId: string, userId: string): Promise<void> {
    // Check if user has already voted (like or dislike)
    const [existingLike] = await db
      .select()
      .from(memeLikes)
      .where(and(eq(memeLikes.memeId, memeId), eq(memeLikes.userId, userId)));
      
    const [existingDislike] = await db
      .select()
      .from(memeDislikes)
      .where(and(eq(memeDislikes.memeId, memeId), eq(memeDislikes.userId, userId)));
    
    if (existingLike || existingDislike) {
      throw new Error('You have already voted on this meme');
    }

    // Add like
    await db
      .insert(memeLikes)
      .values({ memeId, userId });
  }

  async dislikeMeme(memeId: string, userId: string): Promise<void> {
    // Check if user has already voted (like or dislike)
    const [existingLike] = await db
      .select()
      .from(memeLikes)
      .where(and(eq(memeLikes.memeId, memeId), eq(memeLikes.userId, userId)));
      
    const [existingDislike] = await db
      .select()
      .from(memeDislikes)
      .where(and(eq(memeDislikes.memeId, memeId), eq(memeDislikes.userId, userId)));
    
    if (existingLike || existingDislike) {
      throw new Error('You have already voted on this meme');
    }

    // Add dislike
    await db
      .insert(memeDislikes)
      .values({ memeId, userId });
  }

  async removeLike(memeId: string, userId: string): Promise<void> {
    await db
      .delete(memeLikes)
      .where(and(eq(memeLikes.memeId, memeId), eq(memeLikes.userId, userId)));
  }

  async removeDislike(memeId: string, userId: string): Promise<void> {
    await db
      .delete(memeDislikes)
      .where(and(eq(memeDislikes.memeId, memeId), eq(memeDislikes.userId, userId)));
  }

  async getMemeStats(memeId: string): Promise<{likes: number, dislikes: number}> {
    const [likesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(memeLikes)
      .where(eq(memeLikes.memeId, memeId));

    const [dislikesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(memeDislikes)
      .where(eq(memeDislikes.memeId, memeId));

    return {
      likes: Number(likesResult?.count) || 0,
      dislikes: Number(dislikesResult?.count) || 0,
    };
  }

  async getUserMemeVote(memeId: string, userId: string): Promise<'like' | 'dislike' | null> {
    const [existingLike] = await db
      .select()
      .from(memeLikes)
      .where(and(eq(memeLikes.memeId, memeId), eq(memeLikes.userId, userId)));
      
    if (existingLike) return 'like';
    
    const [existingDislike] = await db
      .select()
      .from(memeDislikes)
      .where(and(eq(memeDislikes.memeId, memeId), eq(memeDislikes.userId, userId)));
      
    if (existingDislike) return 'dislike';
    
    return null;
  }

  async giftTokensToMeme(memeId: string, gifterId: string, amount: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Get meme owner
      const [meme] = await tx
        .select({ userId: memeGenerations.userId })
        .from(memeGenerations)
        .where(eq(memeGenerations.id, memeId));
      
      if (!meme) {
        throw new Error('Meme not found');
      }
      
      if (meme.userId === gifterId) {
        throw new Error('You cannot gift tokens to your own meme');
      }

      // Check gifter's balance
      const gifterBalance = await tx
        .select()
        .from(userBalances)
        .where(eq(userBalances.userId, gifterId));
      
      const currentBalance = parseFloat(gifterBalance[0]?.balance || '0');
      const giftAmount = parseFloat(amount);
      
      if (currentBalance < giftAmount) {
        throw new Error('Insufficient balance');
      }

      // Deduct from gifter
      const newGifterBalance = (currentBalance - giftAmount).toString();
      const newGifterUsdValue = (parseFloat(newGifterBalance) * 1.0).toFixed(8);
      
      await tx
        .update(userBalances)
        .set({
          balance: newGifterBalance,
          usdValue: newGifterUsdValue
        })
        .where(eq(userBalances.userId, gifterId));

      // Add to meme owner
      const [ownerBalance] = await tx
        .select()
        .from(userBalances)
        .where(eq(userBalances.userId, meme.userId));
      
      const currentOwnerBalance = parseFloat(ownerBalance?.balance || '0');
      const newOwnerBalance = (currentOwnerBalance + giftAmount).toString();
      const newOwnerUsdValue = (parseFloat(newOwnerBalance) * 1.0).toFixed(8);
      
      if (ownerBalance) {
        await tx
          .update(userBalances)
          .set({
            balance: newOwnerBalance,
            usdValue: newOwnerUsdValue
          })
          .where(eq(userBalances.userId, meme.userId));
      } else {
        await tx
          .insert(userBalances)
          .values({
            userId: meme.userId,
            balance: newOwnerBalance,
            usdValue: newOwnerUsdValue
          });
      }

      // Record transactions
      await tx.insert(transactions).values([
        {
          userId: gifterId,
          type: 'meme_gift_sent',
          amount: `-${giftAmount}`,
          description: `Gift sent to meme creator`,
          status: 'completed',
          createdAt: new Date()
        },
        {
          userId: meme.userId,
          type: 'meme_gift_received',
          amount: giftAmount.toString(),
          description: `Gift received for meme`,
          status: 'completed',
          createdAt: new Date()
        }
      ]);
    });
  }

  async getAllMemesWithUserInfo(limit: number = 6, offset: number = 0): Promise<any[]> {
    try {
      // Create subqueries for like and dislike counts
      const likes_subquery = db
        .select({
          memeId: memeLikes.memeId,
          likeCount: sql<number>`count(*)`.as('like_count')
        })
        .from(memeLikes)
        .groupBy(memeLikes.memeId)
        .as('likes_subquery');

      const dislikes_subquery = db
        .select({
          memeId: memeDislikes.memeId,
          dislikeCount: sql<number>`count(*)`.as('dislike_count')
        })
        .from(memeDislikes)
        .groupBy(memeDislikes.memeId)
        .as('dislikes_subquery');

      const allMemes = await db.select({
        id: memeGenerations.id,
        prompt: memeGenerations.prompt,
        overlayText: memeGenerations.overlayText,
        imageUrl: memeGenerations.imageUrl,
        status: memeGenerations.status,
        generatedAt: memeGenerations.generatedAt,
        user: {
          id: users.id,
          name: users.name,
          username: users.username
        },
        likeCount: sql`COALESCE(${likes_subquery.likeCount}, 0)`,
        dislikeCount: sql`COALESCE(${dislikes_subquery.dislikeCount}, 0)`
      })
      .from(memeGenerations)
      .leftJoin(users, eq(memeGenerations.userId, users.id))
      .leftJoin(likes_subquery, eq(memeGenerations.id, likes_subquery.memeId))
      .leftJoin(dislikes_subquery, eq(memeGenerations.id, dislikes_subquery.memeId))
      .where(eq(memeGenerations.status, 'completed'))
      .orderBy(desc(memeGenerations.generatedAt))
      .limit(limit)
      .offset(offset);
      
      return allMemes;
    } catch (error) {
      console.error('Error fetching all memes with user info:', error);
      return [];
    }
  }

  async getTotalMemesCount(): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(memeGenerations)
        .where(eq(memeGenerations.status, 'completed'));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error fetching total memes count:', error);
      return 0;
    }
  }

  async getMemeLeaderboard() {
    return await db
      .select({
        meme: memeGenerations,
        user: users,
        likes: sql<number>`COUNT(DISTINCT ${memeLikes.id})`,
        dislikes: sql<number>`COUNT(DISTINCT ${memeDislikes.id})`,
        score: sql<number>`COUNT(DISTINCT ${memeLikes.id}) - COUNT(DISTINCT ${memeDislikes.id})`,
      })
      .from(memeGenerations)
      .innerJoin(users, eq(memeGenerations.userId, users.id))
      .leftJoin(memeLikes, eq(memeGenerations.id, memeLikes.memeId))
      .leftJoin(memeDislikes, eq(memeGenerations.id, memeDislikes.memeId))
      .groupBy(memeGenerations.id, users.id)
      .orderBy(desc(sql`COUNT(DISTINCT ${memeLikes.id}) - COUNT(DISTINCT ${memeDislikes.id})`), desc(sql`COUNT(DISTINCT ${memeLikes.id})`));
  }
}

export const storage = new DatabaseStorage();
