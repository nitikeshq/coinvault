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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
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
}

export const storage = new DatabaseStorage();
