import { db } from "./db";
import { users, depositRequests, rewardPools, rewardDistributions, rewardContributions } from "@shared/schema";
import { eq, and, gte, lte, sql, ne } from "drizzle-orm";

/**
 * Weekly Reward Pool System
 * 
 * 10% of every deposit goes into a weekly reward pool
 * The pool is distributed among all existing members (excluding new depositors)
 * Distributions happen every week
 */

export class RewardSystem {
  /**
   * Get or create current week's reward pool
   */
  async getCurrentWeekRewardPool(): Promise<any> {
    const now = new Date();
    const weekStart = this.getWeekStart(now);
    const weekEnd = this.getWeekEnd(weekStart);

    // Check if current week's pool exists
    const existingPool = await db
      .select()
      .from(rewardPools)
      .where(
        and(
          eq(rewardPools.weekStartDate, weekStart),
          eq(rewardPools.status, "collecting")
        )
      )
      .limit(1);

    if (existingPool.length > 0) {
      return existingPool[0];
    }

    // Create new pool for this week
    const [newPool] = await db
      .insert(rewardPools)
      .values({
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        totalPoolAmount: "0",
        totalEligibleMembers: 0,
        rewardPerMember: "0",
        status: "collecting"
      })
      .returning();

    return newPool;
  }

  /**
   * Add contribution to reward pool when deposit is approved
   * Only new depositors contribute, existing members receive rewards
   */
  async addDepositContribution(depositRequestId: string, depositAmount: number, contributorUserId: string): Promise<void> {
    const contributionAmount = depositAmount * 0.10; // 10% of deposit

    const currentPool = await this.getCurrentWeekRewardPool();

    // Add contribution record
    await db.insert(rewardContributions).values({
      rewardPoolId: currentPool.id,
      depositRequestId,
      contributionAmount: contributionAmount.toString(),
      originalDepositAmount: depositAmount.toString(),
      contributorUserId
    });

    // Update pool total
    await db
      .update(rewardPools)
      .set({
        totalPoolAmount: sql`${rewardPools.totalPoolAmount} + ${contributionAmount.toString()}`
      })
      .where(eq(rewardPools.id, currentPool.id));
  }

  /**
   * Distribute weekly rewards to all eligible members
   * Eligible members = all existing users EXCEPT this week's new depositors
   */
  async distributeWeeklyRewards(poolId: string): Promise<void> {
    const pool = await db
      .select()
      .from(rewardPools)
      .where(eq(rewardPools.id, poolId))
      .limit(1);

    if (!pool || pool.length === 0) {
      throw new Error("Reward pool not found");
    }

    const currentPool = pool[0];

    // Get all contributors (new depositors) for this week - they don't receive rewards
    const weekContributors = await db
      .select({ userId: rewardContributions.contributorUserId })
      .from(rewardContributions)
      .where(eq(rewardContributions.rewardPoolId, poolId));

    const contributorIds = weekContributors.map(c => c.userId);

    // Get all eligible members (existing users who didn't deposit this week)
    const eligibleMembers = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(
        and(
          eq(users.isActive, true),
          contributorIds.length > 0 
            ? sql.raw(`users.id NOT IN (${contributorIds.map(id => `'${id}'`).join(',')})`)
            : sql`1=1`
        )
      );

    if (eligibleMembers.length === 0) {
      console.log("No eligible members for reward distribution");
      return;
    }

    const totalPoolAmount = parseFloat(currentPool.totalPoolAmount);
    const rewardPerMember = totalPoolAmount / eligibleMembers.length;

    // Create reward distribution records for each eligible member
    const distributionRecords = eligibleMembers.map(member => ({
      rewardPoolId: poolId,
      userId: member.id,
      rewardAmount: rewardPerMember.toString(),
      status: "pending" as const
    }));

    await db.insert(rewardDistributions).values(distributionRecords);

    // Update pool status and statistics
    await db
      .update(rewardPools)
      .set({
        totalEligibleMembers: eligibleMembers.length,
        rewardPerMember: rewardPerMember.toString(),
        status: "completed",
        distributedAt: new Date()
      })
      .where(eq(rewardPools.id, poolId));

    console.log(`Distributed ₹${totalPoolAmount} among ${eligibleMembers.length} members (₹${rewardPerMember.toFixed(2)} each)`);
  }

  /**
   * Get user's pending rewards
   */
  async getUserPendingRewards(userId: string): Promise<any[]> {
    return await db
      .select({
        id: rewardDistributions.id,
        rewardAmount: rewardDistributions.rewardAmount,
        weekStart: rewardPools.weekStartDate,
        weekEnd: rewardPools.weekEndDate,
        createdAt: rewardDistributions.createdAt
      })
      .from(rewardDistributions)
      .innerJoin(rewardPools, eq(rewardDistributions.rewardPoolId, rewardPools.id))
      .where(
        and(
          eq(rewardDistributions.userId, userId),
          eq(rewardDistributions.status, "pending")
        )
      )
      .orderBy(rewardDistributions.createdAt);
  }

  /**
   * Get current week statistics
   */
  async getCurrentWeekStats(): Promise<any> {
    const currentPool = await this.getCurrentWeekRewardPool();
    
    const totalContributions = await db
      .select({ 
        count: sql<number>`COUNT(*)`,
        totalAmount: sql<string>`COALESCE(SUM(${rewardContributions.contributionAmount}), 0)` 
      })
      .from(rewardContributions)
      .where(eq(rewardContributions.rewardPoolId, currentPool.id));

    const totalEligibleMembers = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users)
      .where(eq(users.isActive, true));

    return {
      weekStart: currentPool.weekStartDate,
      weekEnd: currentPool.weekEndDate,
      currentPoolAmount: parseFloat(currentPool.totalPoolAmount),
      totalContributors: totalContributions[0]?.count || 0,
      totalEligibleMembers: totalEligibleMembers[0]?.count || 0,
      estimatedRewardPerMember: totalEligibleMembers[0]?.count > 0 
        ? parseFloat(currentPool.totalPoolAmount) / totalEligibleMembers[0].count 
        : 0
    };
  }

  /**
   * Helper: Get start of week (Monday)
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }

  /**
   * Helper: Get end of week (Sunday)
   */
  private getWeekEnd(weekStart: Date): Date {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  }

  /**
   * Claim pending reward
   */
  async claimReward(userId: string, distributionId: string): Promise<boolean> {
    const result = await db
      .update(rewardDistributions)
      .set({
        status: "claimed",
        claimedAt: new Date()
      })
      .where(
        and(
          eq(rewardDistributions.id, distributionId),
          eq(rewardDistributions.userId, userId),
          eq(rewardDistributions.status, "pending")
        )
      );

    return (result.rowCount || 0) > 0;
  }
}