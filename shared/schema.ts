import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  username: varchar("username").unique().notNull(),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // null for Google OAuth users
  phone: varchar("phone"),
  isAdmin: boolean("is_admin").default(false),
  authProvider: varchar("auth_provider").default("email"), // email, google
  googleId: varchar("google_id"),
  profileImageUrl: varchar("profile_image_url"),
  walletAddress: varchar("wallet_address").unique(),
  walletPrivateKey: varchar("wallet_private_key"), // Encrypted in production
  withdrawalAddress: varchar("withdrawal_address"), // BEP-20 address for withdrawals
  isActive: boolean("is_active").default(true),
  // Investment tier fields
  investmentTag: varchar("investment_tag").default("Members"), // Members, Premium, VIP, VVIP, Sharks, Whales
  totalInvestmentInr: decimal("total_investment_inr", { precision: 20, scale: 2 }).default("0"),
  // Referral fields
  referralCode: varchar("referral_code").unique(),
  referredBy: varchar("referred_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Token configuration table (admin managed)
export const tokenConfig = pgTable("token_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractAddress: varchar("contract_address").notNull(),
  tokenName: varchar("token_name").notNull(),
  tokenSymbol: varchar("token_symbol").notNull(),
  decimals: integer("decimals").notNull(),
  defaultPriceUsd: decimal("default_price_usd", { precision: 18, scale: 8 }).default("0.001"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User token balances
export const userBalances = pgTable("user_balances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  tokenConfigId: varchar("token_config_id").notNull().references(() => tokenConfig.id),
  balance: decimal("balance", { precision: 18, scale: 8 }).default("0"),
  usdValue: decimal("usd_value", { precision: 18, scale: 2 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Deposit requests
export const depositRequests = pgTable("deposit_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(), // Amount in USD after conversion
  originalAmount: decimal("original_amount", { precision: 18, scale: 8 }), // Original amount in submitted currency
  currency: varchar("currency").notNull().default("USD"), // Currency: INR, USD
  paymentMethod: varchar("payment_method").notNull().default("bsc"), // Payment method: upi, bsc
  transactionHash: varchar("transaction_hash"),
  screenshot: varchar("screenshot"),
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// News articles
export const newsArticles = pgTable("news_articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  imageUrl: varchar("image_url"),
  externalUrl: varchar("external_url"),
  category: varchar("category").notNull(),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social media links (admin configurable)
export const socialLinks = pgTable("social_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: varchar("platform").notNull().unique(), // telegram, instagram, twitter, etc.
  url: varchar("url").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Token price data
export const tokenPrices = pgTable("token_prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenConfigId: varchar("token_config_id").notNull().unique().references(() => tokenConfig.id),
  priceUsd: decimal("price_usd", { precision: 18, scale: 8 }).notNull(),
  priceChange24h: decimal("price_change_24h", { precision: 5, scale: 2 }).default("0"),
  volume24h: decimal("volume_24h", { precision: 18, scale: 2 }).default("0"),
  marketCap: decimal("market_cap", { precision: 18, scale: 2 }).default("0"),
  high24h: decimal("high_24h", { precision: 18, scale: 8 }).default("0"),
  low24h: decimal("low_24h", { precision: 18, scale: 8 }).default("0"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transactions history
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type").notNull(), // deposit, send, receive, credit, debit
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  transactionHash: varchar("transaction_hash"),
  fromAddress: varchar("from_address"),
  toAddress: varchar("to_address"),
  description: text("description"), // Added for admin actions and other descriptions
  status: varchar("status").notNull().default("pending"), // pending, confirmed, failed, completed
  createdAt: timestamp("created_at").defaultNow(),
});

// Website settings (admin managed)
export const websiteSettings = pgTable("website_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteName: varchar("site_name").notNull().default("CryptoWallet Pro"),
  logoUrl: varchar("logo_url"),
  faviconUrl: varchar("favicon_url"),
  description: text("description"),
  primaryColor: varchar("primary_color").default("#6366f1"),
  secondaryColor: varchar("secondary_color").default("#8b5cf6"),
  auditReportUrl: varchar("audit_report_url"),
  whitepaperUrl: varchar("whitepaper_url"),
  nftCollectionLimit: integer("nft_collection_limit").default(10000),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Presale configuration table
export const presaleConfig = pgTable("presale_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  targetAmount: decimal("target_amount", { precision: 20, scale: 8 }).default("1000000"),
  currentAmount: decimal("current_amount", { precision: 20, scale: 8 }).default("0"),
  initialLiquidity: decimal("initial_liquidity", { precision: 20, scale: 8 }).default("0"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date").default(sql`now() + interval '30 days'`),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  walletAddress: true,
  createdAt: true,
  updatedAt: true,
});

export const loginUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
}).extend({
  username: z.string().optional(),
});

export const registerUserSchema = createInsertSchema(users).pick({
  name: true,
  username: true,
  email: true,
  password: true,
  phone: true,
});

export const insertTokenConfigSchema = createInsertSchema(tokenConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  defaultPriceUsd: z.union([z.string(), z.number()]).transform(val => String(val)),
});

export const insertDepositRequestSchema = createInsertSchema(depositRequests).omit({
  id: true,
  userId: true,
  status: true,
  adminNotes: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNewsArticleSchema = createInsertSchema(newsArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSocialLinkSchema = createInsertSchema(socialLinks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWebsiteSettingsSchema = createInsertSchema(websiteSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPresaleConfigSchema = createInsertSchema(presaleConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type User = typeof users.$inferSelect;
export type TokenConfig = typeof tokenConfig.$inferSelect;
export type InsertTokenConfig = z.infer<typeof insertTokenConfigSchema>;
export type UserBalance = typeof userBalances.$inferSelect;
export type DepositRequest = typeof depositRequests.$inferSelect;
export type InsertDepositRequest = z.infer<typeof insertDepositRequestSchema>;
export type NewsArticle = typeof newsArticles.$inferSelect;
export type InsertNewsArticle = z.infer<typeof insertNewsArticleSchema>;
export type SocialLink = typeof socialLinks.$inferSelect;
export type InsertSocialLink = z.infer<typeof insertSocialLinkSchema>;
export type TokenPrice = typeof tokenPrices.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type WebsiteSettings = typeof websiteSettings.$inferSelect;
export type InsertWebsiteSettings = z.infer<typeof insertWebsiteSettingsSchema>;
export type PresaleConfig = typeof presaleConfig.$inferSelect;
export type InsertPresaleConfig = z.infer<typeof insertPresaleConfigSchema>;

// Dapp settings table (admin controlled)
export const dappSettings = pgTable("dapp_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  appName: varchar("app_name").notNull().unique(), // "nft_mint", "meme_generator"
  displayName: varchar("display_name").notNull(), // "NFT Mint", "Memes Generator"
  isEnabled: boolean("is_enabled").default(false),
  cost: decimal("cost", { precision: 18, scale: 8 }).notNull(), // Cost in tokens
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// NFT Collection table
export const nftCollection = pgTable("nft_collection", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tokenId: integer("token_id").notNull().unique(), // NFT token ID (configured by admin)
  name: varchar("name").notNull(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  rarity: varchar("rarity").default("Common"), // Common, Rare, Epic, Legendary
  attributes: jsonb("attributes"), // Store NFT metadata as JSON
  referenceImageUrl: varchar("reference_image_url"), // Admin uploaded reference image
  isMinted: boolean("is_minted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User NFTs table
export const userNfts = pgTable("user_nfts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  nftId: varchar("nft_id").notNull().references(() => nftCollection.id),
  transactionHash: varchar("transaction_hash"),
  mintedAt: timestamp("minted_at").defaultNow(),
});

// Meme generations table
export const memeGenerations = pgTable("meme_generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  prompt: text("prompt").notNull(),
  style: varchar("style").default("funny"),
  generatedDescription: text("generated_description"),
  cost: varchar("cost"),
  imageUrl: varchar("image_url"),
  status: varchar("status").default("pending"), // pending, completed, failed
  transactionHash: varchar("transaction_hash"),
  generatedAt: timestamp("generated_at").defaultNow(),
});

// Zod schemas for new tables
export const insertDappSettingsSchema = createInsertSchema(dappSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNftCollectionSchema = createInsertSchema(nftCollection).omit({
  id: true,
  createdAt: true,
});

// Additional types
export type DappSettings = typeof dappSettings.$inferSelect;
export type InsertDappSettings = z.infer<typeof insertDappSettingsSchema>;
export type NftCollection = typeof nftCollection.$inferSelect;
export type InsertNftCollection = z.infer<typeof insertNftCollectionSchema>;
export type UserNfts = typeof userNfts.$inferSelect;
export type MemeGenerations = typeof memeGenerations.$inferSelect;

// Referral earnings table
export const referralEarnings = pgTable("referral_earnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull().references(() => users.id),
  referredUserId: varchar("referred_user_id").notNull().references(() => users.id),
  depositAmount: decimal("deposit_amount", { precision: 18, scale: 8 }).notNull(),
  earningsAmount: decimal("earnings_amount", { precision: 18, scale: 8 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ReferralEarnings = typeof referralEarnings.$inferSelect;

// NFT Marketplace listings
export const nftListings = pgTable("nft_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nftId: varchar("nft_id").notNull().references(() => nftCollection.id),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  price: decimal("price", { precision: 18, scale: 8 }).notNull(),
  isActive: boolean("is_active").default(true),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meme Marketplace listings  
export const memeListings = pgTable("meme_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memeId: varchar("meme_id").notNull().references(() => memeGenerations.id),
  ownerId: varchar("owner_id").notNull().references(() => users.id),
  price: decimal("price", { precision: 18, scale: 8 }).notNull(),
  isActive: boolean("is_active").default(true),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bids table (for both NFTs and memes)
export const bids = pgTable("bids", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemType: varchar("item_type").notNull(), // 'nft' or 'meme'
  itemId: varchar("item_id").notNull(), // nftId or memeId
  bidderId: varchar("bidder_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Meme social stats
export const memeStats = pgTable("meme_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memeId: varchar("meme_id").notNull().unique().references(() => memeGenerations.id),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  shareCount: integer("share_count").default(0),
  downloadCount: integer("download_count").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meme likes (for tracking individual likes)
export const memeLikes = pgTable("meme_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memeId: varchar("meme_id").notNull().references(() => memeGenerations.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// NFT transfers
export const nftTransfers = pgTable("nft_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nftId: varchar("nft_id").notNull().references(() => nftCollection.id),
  fromUserId: varchar("from_user_id").references(() => users.id),
  toUserId: varchar("to_user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 18, scale: 8 }), // Purchase amount if applicable
  transferType: varchar("transfer_type").notNull(), // 'mint', 'sale', 'transfer'
  transactionHash: varchar("transaction_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Marketplace schemas
export const insertNftListingSchema = createInsertSchema(nftListings).omit({
  id: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMemeListingSchema = createInsertSchema(memeListings).omit({
  id: true,
  ownerId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBidSchema = createInsertSchema(bids).omit({
  id: true,
  bidderId: true,
  createdAt: true,
});

// Marketplace types
export type NftListing = typeof nftListings.$inferSelect;
export type InsertNftListing = z.infer<typeof insertNftListingSchema>;
export type MemeListing = typeof memeListings.$inferSelect;
export type InsertMemeListing = z.infer<typeof insertMemeListingSchema>;
export type Bid = typeof bids.$inferSelect;
export type InsertBid = z.infer<typeof insertBidSchema>;
export type MemeStats = typeof memeStats.$inferSelect;
export type MemeLikes = typeof memeLikes.$inferSelect;
export type NftTransfer = typeof nftTransfers.$inferSelect;

// Weekly reward pool system
export const rewardPools = pgTable("reward_pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  weekStartDate: timestamp("week_start_date").notNull(),
  weekEndDate: timestamp("week_end_date").notNull(),
  totalPoolAmount: decimal("total_pool_amount", { precision: 18, scale: 2 }).default("0"),
  totalEligibleMembers: integer("total_eligible_members").default(0),
  rewardPerMember: decimal("reward_per_member", { precision: 18, scale: 8 }).default("0"),
  status: varchar("status").notNull().default("collecting"), // collecting, distributing, completed
  createdAt: timestamp("created_at").defaultNow(),
  distributedAt: timestamp("distributed_at"),
});

// Individual reward distributions
export const rewardDistributions = pgTable("reward_distributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rewardPoolId: varchar("reward_pool_id").notNull().references(() => rewardPools.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  rewardAmount: decimal("reward_amount", { precision: 18, scale: 8 }).notNull(),
  claimedAt: timestamp("claimed_at"),
  status: varchar("status").notNull().default("pending"), // pending, claimed
  createdAt: timestamp("created_at").defaultNow(),
});

// Reward pool contributions (tracking deposits that contributed to pools)
export const rewardContributions = pgTable("reward_contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rewardPoolId: varchar("reward_pool_id").notNull().references(() => rewardPools.id),
  depositRequestId: varchar("deposit_request_id").notNull().references(() => depositRequests.id),
  contributionAmount: decimal("contribution_amount", { precision: 18, scale: 8 }).notNull(), // 10% of deposit
  originalDepositAmount: decimal("original_deposit_amount", { precision: 18, scale: 8 }).notNull(),
  contributorUserId: varchar("contributor_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas for reward system
export const insertRewardPoolSchema = createInsertSchema(rewardPools).omit({
  id: true,
  createdAt: true,
  distributedAt: true,
});

export const insertRewardDistributionSchema = createInsertSchema(rewardDistributions).omit({
  id: true,
  createdAt: true,
  claimedAt: true,
});

export const insertRewardContributionSchema = createInsertSchema(rewardContributions).omit({
  id: true,
  createdAt: true,
});

// Types for reward system
export type RewardPool = typeof rewardPools.$inferSelect;
export type InsertRewardPool = z.infer<typeof insertRewardPoolSchema>;
export type RewardDistribution = typeof rewardDistributions.$inferSelect;
export type InsertRewardDistribution = z.infer<typeof insertRewardDistributionSchema>;
export type RewardContribution = typeof rewardContributions.$inferSelect;
export type InsertRewardContribution = z.infer<typeof insertRewardContributionSchema>;
