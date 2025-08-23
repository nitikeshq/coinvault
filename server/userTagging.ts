import { db } from "./db";
import { users, depositRequests } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

// Investment tier configuration based on INR amounts
export const INVESTMENT_TIERS = [
  { tag: "Whales", minAmount: 10000001, maxAmount: 100000000, description: "Top-tier investors" },
  { tag: "Sharks", minAmount: 1000001, maxAmount: 10000000, description: "Elite investors" },
  { tag: "VVIP", minAmount: 100001, maxAmount: 1000000, description: "Major investors" },
  { tag: "VIP", minAmount: 10001, maxAmount: 100000, description: "High-value participants" },
  { tag: "Premium", minAmount: 1001, maxAmount: 10000, description: "Active contributors" },
  { tag: "Members", minAmount: 100, maxAmount: 1000, description: "Basic participants" },
];

/**
 * Calculate total approved investment for a user in INR
 */
export async function calculateUserTotalInvestment(userId: string): Promise<number> {
  const result = await db
    .select({
      totalInr: sql<string>`COALESCE(SUM(
        CASE 
          WHEN currency = 'INR' THEN original_amount
          WHEN currency = 'USD' THEN original_amount * 83 -- Approximate USD to INR conversion
          ELSE original_amount
        END
      ), 0)`
    })
    .from(depositRequests)
    .where(
      and(
        eq(depositRequests.userId, userId),
        eq(depositRequests.status, "approved")
      )
    );

  return parseFloat(result[0]?.totalInr || "0");
}

/**
 * Determine investment tag based on total INR amount
 */
export function getInvestmentTag(totalInr: number): string {
  // Find the appropriate tier for the investment amount
  for (const tier of INVESTMENT_TIERS) {
    if (totalInr >= tier.minAmount && totalInr <= tier.maxAmount) {
      return tier.tag;
    }
  }
  
  // If amount is above highest tier, assign Whales
  if (totalInr > 100000000) {
    return "Whales";
  }
  
  // If amount is below lowest tier, no tag
  if (totalInr < 100) {
    return "";
  }
  
  return "Members"; // Default fallback
}

/**
 * Update user investment tag and total
 */
export async function updateUserInvestmentTag(userId: string): Promise<{ tag: string; totalInr: number }> {
  const totalInr = await calculateUserTotalInvestment(userId);
  const newTag = getInvestmentTag(totalInr);
  
  await db
    .update(users)
    .set({
      investmentTag: newTag,
      totalInvestmentInr: totalInr.toString(),
      updatedAt: new Date()
    })
    .where(eq(users.id, userId));

  return { tag: newTag, totalInr };
}

/**
 * Get tag color for UI display
 */
export function getTagColor(tag: string): string {
  switch (tag) {
    case "Whales":
      return "bg-gradient-to-r from-purple-600 to-pink-600 text-white";
    case "Sharks":
      return "bg-gradient-to-r from-red-600 to-orange-600 text-white";
    case "VVIP":
      return "bg-gradient-to-r from-yellow-600 to-orange-500 text-white";
    case "VIP":
      return "bg-gradient-to-r from-blue-600 to-purple-600 text-white";
    case "Premium":
      return "bg-gradient-to-r from-green-600 to-blue-600 text-white";
    case "Members":
      return "bg-gradient-to-r from-gray-600 to-gray-700 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

/**
 * Get tag icon for UI display
 */
export function getTagIcon(tag: string): string {
  switch (tag) {
    case "Whales":
      return "🐋";
    case "Sharks":
      return "🦈";
    case "VVIP":
      return "💎";
    case "VIP":
      return "👑";
    case "Premium":
      return "⭐";
    case "Members":
      return "👤";
    default:
      return "📱";
  }
}

/**
 * Update all users' investment tags (for batch processing)
 */
export async function updateAllUserInvestmentTags(): Promise<void> {
  const allUsers = await db.select({ id: users.id }).from(users);
  
  for (const user of allUsers) {
    await updateUserInvestmentTag(user.id);
  }
}