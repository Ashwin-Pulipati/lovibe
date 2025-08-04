import { RateLimiterPrisma } from "rate-limiter-flexible";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "./db";

const FREE_POINTS = 10;
const PRO_POINTS = 150;
const DURATION = 30 * 24 * 60 * 60; //30days
const GENERATION_COST = 1;

/**
 * Returns a rate limiter instance configured for the authenticated user's subscription plan.
 *
 * The rate limiter tracks usage and enforces credit limits based on whether the user has a "pro" or free plan.
 * @returns A `RateLimiterPrisma` instance set up with the user's allowed points and duration window.
 */
export async function getUsageTracker() {
  const { has } = await auth();
  const hasProAccess = has({ plan: "pro" });
  const usageTracker = new RateLimiterPrisma({
    storeClient: prisma,
    tableName: "Usage",
    points: hasProAccess ? PRO_POINTS : FREE_POINTS,
    duration: DURATION,
  });

  return usageTracker;
}

/**
 * Consumes one credit from the authenticated user's usage quota.
 *
 * Throws an error if the user is not authenticated or if credit consumption fails.
 * Returns the result of the credit consumption operation.
 */
export async function consumeCredits() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }
  const usageTracker = await getUsageTracker();
  try {
    const result = await usageTracker.consume(userId, GENERATION_COST);
    return result;
  } catch (error) {
    console.error("Error consuming credits:", error);
    throw error;
  }
}

/**
 * Retrieves the current usage status for the authenticated user.
 *
 * @returns The usage status object containing information about the user's remaining credits and usage within the current period.
 * @throws If the user is not authenticated.
 */
export async function getUsageStatus() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }
  const usageTracker = await getUsageTracker();
  const result = await usageTracker.get(userId);
  return result;
}
