/**
 * Upstash Redis client — optional for beta analytics.
 * If env vars aren't set, operations silently no-op.
 */

import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export { redis };

/**
 * Safely increment a counter in Redis. No-ops if Redis isn't configured.
 */
export async function trackAnalysis(): Promise<void> {
  if (!redis) return;
  try {
    await redis.incr('analyses:total');
  } catch (err) {
    console.warn('[Upstash] Failed to track analysis:', err);
  }
}
