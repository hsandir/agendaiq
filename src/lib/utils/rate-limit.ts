import { LRUCache } from 'lru-cache';
// // import { NextResponse } from 'next/server'; // Unused import commented out // Unused import commented out

export function rateLimit({
  interval = 60 * 1000, // default: 1 minute
  uniqueTokenPerInterval = 500, // default: max 500 users per interval
} = {}) {
  const tokenCache = new LRUCache({
    max: uniqueTokenPerInterval,
    ttl: interval,
  });

  return {
    check: (request: Request, limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;

        if (isRateLimited) {
          reject();
        } else {
          resolve();
        }
      }),
  };
} 