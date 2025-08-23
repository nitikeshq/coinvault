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

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  walletAddress: varchar("wallet_address").unique(),
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
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
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
  tokenConfigId: varchar("token_config_id").notNull().references(() => tokenConfig.id),
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
  type: varchar("type").notNull(), // deposit, send, receive
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  transactionHash: varchar("transaction_hash"),
  fromAddress: varchar("from_address"),
  toAddress: varchar("to_address"),
  status: varchar("status").notNull().default("pending"), // pending, confirmed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const insertTokenConfigSchema = createInsertSchema(tokenConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

// Types
export type UpsertUser = typeof users.$inferInsert;
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
