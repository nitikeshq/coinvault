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
  memeListings,
  bids,
  memeStats,
  memeLikes,
  nftTransfers,
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
  type NftListing,
  type InsertNftListing,
  type MemeListing,
  type InsertMemeListing,
  type Bid,
  type InsertBid,
  type MemeStats,
  type MemeLikes,
  type NftTransfer,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
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
  
  // NFT Marketplace operations
  createNftListing(listing: InsertNftListing & { ownerId: string }): Promise<NftListing>;
  getNftListings(isActive?: boolean): Promise<Array<NftListing & { nft: any, owner: any }>>;
  getNftListing(id: string): Promise<(NftListing & { nft: any, owner: any }) | undefined>;
  updateNftListing(id: string, updates: Partial<InsertNftListing>): Promise<void>;
  deleteNftListing(id: string): Promise<void>;
  
  // Meme Marketplace operations
  createMemeListing(listing: InsertMemeListing & { ownerId: string }): Promise<MemeListing>;
  getMemeListings(isActive?: boolean): Promise<Array<MemeListing & { meme: any, owner: any }>>;
  getMemeListing(id: string): Promise<(MemeListing & { meme: any, owner: any }) | undefined>;
  updateMemeListing(id: string, updates: Partial<InsertMemeListing>): Promise<void>;
  deleteMemeListing(id: string): Promise<void>;
  
  // Bid operations
  createBid(bid: InsertBid & { bidderId: string }): Promise<Bid>;
  getBidsForItem(itemType: string, itemId: string): Promise<Array<Bid & { bidder: any }>>;
  getUserBids(userId: string): Promise<Array<Bid & { bidder: any }>>;
  acceptBid(bidId: string): Promise<void>;
  cancelBid(bidId: string): Promise<void>;
  
  // Meme social features
  getMemeStats(memeId: string): Promise<MemeStats | undefined>;
  updateMemeStats(memeId: string, stats: Partial<MemeStats>): Promise<void>;
  incrementMemeView(memeId: string): Promise<void>;
  incrementMemeShare(memeId: string): Promise<void>;
  incrementMemeDownload(memeId: string): Promise<void>;
  toggleMemeLike(memeId: string, userId: string): Promise<boolean>;
  
  // NFT Transfer operations
  createNftTransfer(transfer: Omit<NftTransfer, 'id' | 'createdAt'>): Promise<NftTransfer>;
  getUserNftTransfers(userId: string): Promise<NftTransfer[]>;
  
  // Public URLs for sharing
  generateMemePublicUrl(memeId: string): Promise<string>;
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
      .returning();
    
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
    const [settings] = await db
      .select()
      .from(websiteSettings)
      .orderBy(desc(websiteSettings.createdAt));
    return settings;
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
      tokenId: nftCollection.tokenId,
      name: nftCollection.name,
      description: nftCollection.description,
      imageUrl: nftCollection.imageUrl,
      rarity: nftCollection.rarity,
      mintedAt: userNfts.mintedAt,
      transactionHash: userNfts.transactionHash
    })
    .from(userNfts)
    .innerJoin(nftCollection, eq(userNfts.nftId, nftCollection.id))
    .where(eq(userNfts.userId, userId))
    .orderBy(userNfts.mintedAt);
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
      return await db.select().from(memeGenerations)
        .where(eq(memeGenerations.userId, userId))
        .orderBy(memeGenerations.generatedAt);
    } catch (error) {
      // Handle case where new columns don't exist yet
      console.log('Meme table columns not found, returning empty array:', error);
      return [];
    }
  }

  async getNftCollectionStats(): Promise<any> {
    const [stats] = await db.select({
      totalNfts: sql<number>`count(*)`,
      mintedNfts: sql<number>`sum(case when is_minted = true then 1 else 0 end)`,
      availableNfts: sql<number>`sum(case when is_minted = false then 1 else 0 end)`
    }).from(nftCollection);
    
    return stats;
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

  // Update createMemeGeneration to match the new signature
  async createMemeGeneration(data: any): Promise<any> {
    const [meme] = await db.insert(memeGenerations)
      .values({
        userId: data.userId,
        prompt: data.prompt,
        style: data.style || 'funny',
        generatedDescription: data.generatedDescription,
        cost: data.cost,
        status: data.status || 'processing'
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

  // NFT Marketplace operations
  async createNftListing(listing: InsertNftListing & { ownerId: string }): Promise<NftListing> {
    const [nftListing] = await db.insert(nftListings)
      .values(listing)
      .returning();
    return nftListing;
  }

  async getNftListings(isActive?: boolean): Promise<Array<NftListing & { nft: any, owner: any }>> {
    const query = db.select({
      id: nftListings.id,
      nftId: nftListings.nftId,
      ownerId: nftListings.ownerId,
      price: nftListings.price,
      isActive: nftListings.isActive,
      description: nftListings.description,
      createdAt: nftListings.createdAt,
      updatedAt: nftListings.updatedAt,
      nft: nftCollection,
      owner: users
    })
    .from(nftListings)
    .leftJoin(nftCollection, eq(nftListings.nftId, nftCollection.id))
    .leftJoin(users, eq(nftListings.ownerId, users.id));
    
    if (isActive !== undefined) {
      query.where(eq(nftListings.isActive, isActive));
    }
    
    return await query.orderBy(desc(nftListings.createdAt));
  }

  async getNftListing(id: string): Promise<(NftListing & { nft: any, owner: any }) | undefined> {
    const [listing] = await db.select({
      id: nftListings.id,
      nftId: nftListings.nftId,
      ownerId: nftListings.ownerId,
      price: nftListings.price,
      isActive: nftListings.isActive,
      description: nftListings.description,
      createdAt: nftListings.createdAt,
      updatedAt: nftListings.updatedAt,
      nft: nftCollection,
      owner: users
    })
    .from(nftListings)
    .leftJoin(nftCollection, eq(nftListings.nftId, nftCollection.id))
    .leftJoin(users, eq(nftListings.ownerId, users.id))
    .where(eq(nftListings.id, id));
    
    return listing;
  }

  async updateNftListing(id: string, updates: Partial<InsertNftListing>): Promise<void> {
    await db.update(nftListings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(nftListings.id, id));
  }

  async deleteNftListing(id: string): Promise<void> {
    await db.delete(nftListings).where(eq(nftListings.id, id));
  }

  // Meme Marketplace operations
  async createMemeListing(listing: InsertMemeListing & { ownerId: string }): Promise<MemeListing> {
    const [memeListing] = await db.insert(memeListings)
      .values(listing)
      .returning();
    return memeListing;
  }

  async getMemeListings(isActive?: boolean): Promise<Array<MemeListing & { meme: any, owner: any }>> {
    const query = db.select({
      id: memeListings.id,
      memeId: memeListings.memeId,
      ownerId: memeListings.ownerId,
      price: memeListings.price,
      isActive: memeListings.isActive,
      description: memeListings.description,
      createdAt: memeListings.createdAt,
      updatedAt: memeListings.updatedAt,
      meme: memeGenerations,
      owner: users
    })
    .from(memeListings)
    .leftJoin(memeGenerations, eq(memeListings.memeId, memeGenerations.id))
    .leftJoin(users, eq(memeListings.ownerId, users.id));
    
    if (isActive !== undefined) {
      query.where(eq(memeListings.isActive, isActive));
    }
    
    return await query.orderBy(desc(memeListings.createdAt));
  }

  async getMemeListing(id: string): Promise<(MemeListing & { meme: any, owner: any }) | undefined> {
    const [listing] = await db.select({
      id: memeListings.id,
      memeId: memeListings.memeId,
      ownerId: memeListings.ownerId,
      price: memeListings.price,
      isActive: memeListings.isActive,
      description: memeListings.description,
      createdAt: memeListings.createdAt,
      updatedAt: memeListings.updatedAt,
      meme: memeGenerations,
      owner: users
    })
    .from(memeListings)
    .leftJoin(memeGenerations, eq(memeListings.memeId, memeGenerations.id))
    .leftJoin(users, eq(memeListings.ownerId, users.id))
    .where(eq(memeListings.id, id));
    
    return listing;
  }

  async updateMemeListing(id: string, updates: Partial<InsertMemeListing>): Promise<void> {
    await db.update(memeListings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(memeListings.id, id));
  }

  async deleteMemeListing(id: string): Promise<void> {
    await db.delete(memeListings).where(eq(memeListings.id, id));
  }

  // Bid operations
  async createBid(bid: InsertBid & { bidderId: string }): Promise<Bid> {
    const [newBid] = await db.insert(bids)
      .values(bid)
      .returning();
    return newBid;
  }

  async getBidsForItem(itemType: string, itemId: string): Promise<Array<Bid & { bidder: any }>> {
    return await db.select({
      id: bids.id,
      itemType: bids.itemType,
      itemId: bids.itemId,
      bidderId: bids.bidderId,
      amount: bids.amount,
      isActive: bids.isActive,
      expiresAt: bids.expiresAt,
      createdAt: bids.createdAt,
      bidder: users
    })
    .from(bids)
    .leftJoin(users, eq(bids.bidderId, users.id))
    .where(and(eq(bids.itemType, itemType), eq(bids.itemId, itemId), eq(bids.isActive, true)))
    .orderBy(desc(bids.amount));
  }

  async getUserBids(userId: string): Promise<Array<Bid & { bidder: any }>> {
    return await db.select({
      id: bids.id,
      itemType: bids.itemType,
      itemId: bids.itemId,
      bidderId: bids.bidderId,
      amount: bids.amount,
      isActive: bids.isActive,
      expiresAt: bids.expiresAt,
      createdAt: bids.createdAt,
      bidder: users
    })
    .from(bids)
    .leftJoin(users, eq(bids.bidderId, users.id))
    .where(eq(bids.bidderId, userId))
    .orderBy(desc(bids.createdAt));
  }

  async acceptBid(bidId: string): Promise<void> {
    const [bid] = await db.select().from(bids).where(eq(bids.id, bidId));
    if (!bid) throw new Error('Bid not found');
    
    // Transfer the item ownership logic would go here
    // For now, just mark bid as inactive and other bids as inactive
    await db.update(bids)
      .set({ isActive: false })
      .where(and(eq(bids.itemType, bid.itemType), eq(bids.itemId, bid.itemId)));
  }

  async cancelBid(bidId: string): Promise<void> {
    await db.update(bids)
      .set({ isActive: false })
      .where(eq(bids.id, bidId));
  }

  // Meme social features
  async getMemeStats(memeId: string): Promise<MemeStats | undefined> {
    const [stats] = await db.select().from(memeStats).where(eq(memeStats.memeId, memeId));
    if (!stats) {
      // Create initial stats if they don't exist
      const [newStats] = await db.insert(memeStats)
        .values({ memeId, viewCount: 0, likeCount: 0, shareCount: 0, downloadCount: 0 })
        .returning();
      return newStats;
    }
    return stats;
  }

  async updateMemeStats(memeId: string, statsUpdate: Partial<MemeStats>): Promise<void> {
    await db.update(memeStats)
      .set({ ...statsUpdate, updatedAt: new Date() })
      .where(eq(memeStats.memeId, memeId));
  }

  async incrementMemeView(memeId: string): Promise<void> {
    await db.insert(memeStats)
      .values({ memeId, viewCount: 1, likeCount: 0, shareCount: 0, downloadCount: 0 })
      .onConflictDoUpdate({
        target: memeStats.memeId,
        set: { viewCount: sql`${memeStats.viewCount} + 1`, updatedAt: new Date() }
      });
  }

  async incrementMemeShare(memeId: string): Promise<void> {
    await db.insert(memeStats)
      .values({ memeId, viewCount: 0, likeCount: 0, shareCount: 1, downloadCount: 0 })
      .onConflictDoUpdate({
        target: memeStats.memeId,
        set: { shareCount: sql`${memeStats.shareCount} + 1`, updatedAt: new Date() }
      });
  }

  async incrementMemeDownload(memeId: string): Promise<void> {
    await db.insert(memeStats)
      .values({ memeId, viewCount: 0, likeCount: 0, shareCount: 0, downloadCount: 1 })
      .onConflictDoUpdate({
        target: memeStats.memeId,
        set: { downloadCount: sql`${memeStats.downloadCount} + 1`, updatedAt: new Date() }
      });
  }

  async toggleMemeLike(memeId: string, userId: string): Promise<boolean> {
    // Check if user already liked this meme
    const [existingLike] = await db.select()
      .from(memeLikes)
      .where(and(eq(memeLikes.memeId, memeId), eq(memeLikes.userId, userId)));
    
    if (existingLike) {
      // Unlike: remove like and decrement count
      await db.delete(memeLikes)
        .where(and(eq(memeLikes.memeId, memeId), eq(memeLikes.userId, userId)));
      
      await db.update(memeStats)
        .set({ likeCount: sql`${memeStats.likeCount} - 1`, updatedAt: new Date() })
        .where(eq(memeStats.memeId, memeId));
      
      return false; // unliked
    } else {
      // Like: add like and increment count
      await db.insert(memeLikes).values({ memeId, userId });
      
      await db.insert(memeStats)
        .values({ memeId, viewCount: 0, likeCount: 1, shareCount: 0, downloadCount: 0 })
        .onConflictDoUpdate({
          target: memeStats.memeId,
          set: { likeCount: sql`${memeStats.likeCount} + 1`, updatedAt: new Date() }
        });
      
      return true; // liked
    }
  }

  // NFT Transfer operations
  async createNftTransfer(transfer: Omit<NftTransfer, 'id' | 'createdAt'>): Promise<NftTransfer> {
    const [nftTransfer] = await db.insert(nftTransfers)
      .values(transfer)
      .returning();
    return nftTransfer;
  }

  async getUserNftTransfers(userId: string): Promise<NftTransfer[]> {
    return await db.select()
      .from(nftTransfers)
      .where(eq(nftTransfers.toUserId, userId))
      .orderBy(desc(nftTransfers.createdAt));
  }

  // Public URLs for sharing
  async generateMemePublicUrl(memeId: string): Promise<string> {
    // Generate a shareable public URL for the meme
    return `/public/meme/${memeId}`;
  }
}

export const storage = new DatabaseStorage();
