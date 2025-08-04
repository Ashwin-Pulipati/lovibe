import { RateLimiterPrisma } from "rate-limiter-flexible";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "./db";

const FREE_POINTS = 10;
const PRO_POINTS = 150;
const DURATION = 30 * 24 * 60 * 60; //30days
const GENERATION_COST = 1;

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

export async function getUsageStatus() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }
  const usageTracker = await getUsageTracker();
  const result = await usageTracker.get(userId);
  return result;
}
