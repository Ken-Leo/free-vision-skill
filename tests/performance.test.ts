import { describe, it, expect } from "vitest";
import { RequestPool, RateLimiter, parallelFallback } from "../src/pool.js";

describe("Performance: Request Pool", () => {
  it("respects concurrency limit", async () => {
    const pool = new RequestPool({
      maxConcurrency: 2,
      timeoutMs: 5000,
      maxRetries: 0
    });

    const timestamps: number[] = [];

    const results = await pool.submitAll([
      {
        fn: async () => {
          timestamps.push(Date.now());
          await new Promise(resolve => setTimeout(resolve, 100));
          return "done1";
        }
      },
      {
        fn: async () => {
          timestamps.push(Date.now());
          await new Promise(resolve => setTimeout(resolve, 100));
          return "done2";
        }
      },
      {
        fn: async () => {
          timestamps.push(Date.now());
          await new Promise(resolve => setTimeout(resolve, 100));
          return "done3";
        }
      }
    ]);

    expect(results.every(r => r.success)).toBe(true);
    expect(timestamps.length).toBe(3);

    // Check that requests were batched (2 at a time)
    const diff1 = timestamps[1] - timestamps[0];
    const diff2 = timestamps[2] - timestamps[1];

    // First two should start around the same time
    expect(diff1).toBeLessThan(50);
    // Third should start after first batch finishes (100ms + small overhead)
    expect(diff2).toBeGreaterThan(80);
  });

  it("handles timeouts", async () => {
    const pool = new RequestPool({
      maxConcurrency: 1,
      timeoutMs: 500,
      maxRetries: 0
    });

    const result = await pool.submit({
      fn: async () => {
        await new Promise(resolve => setTimeout(resolve, 10000));
        return "should not reach";
      }
    });

    expect(result.success).toBe(false);
    expect(result.error?.message).toContain("Timeout");
  });

  it("retries on failure", async () => {
    let attempts = 0;
    const pool = new RequestPool({
      maxConcurrency: 1,
      timeoutMs: 5000,
      maxRetries: 2,
      baseDelayMs: 10,
      maxDelayMs: 50
    });

    const result = await pool.submit({
      fn: async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error("temporary error");
        }
        return "success";
      }
    });

    expect(result.success).toBe(true);
    expect(result.value).toBe("success");
    expect(attempts).toBe(3);
    expect(result.retries).toBe(2);
  });
});

describe("Performance: Rate Limiter", () => {
  it("allows requests within limit", async () => {
    const limiter = new RateLimiter(10, 1000);

    const results = await Promise.all([
      limiter.tryAcquire(1),
      limiter.tryAcquire(1),
      limiter.tryAcquire(1)
    ]);

    expect(results.every(r => r)).toBe(true);
  });

  it("blocks requests over limit", async () => {
    const limiter = new RateLimiter(2, 1000);

    await limiter.tryAcquire(1);
    await limiter.tryAcquire(1);

    const blocked = await limiter.tryAcquire(1);
    expect(blocked).toBe(false);
  });

  it("refills tokens over time", async () => {
    const limiter = new RateLimiter(5, 1000);

    // Use all tokens
    await limiter.tryAcquire(5);

    // Wait for refill
    await new Promise(resolve => setTimeout(resolve, 500));

    // Should have ~2.5 tokens (50% of 5)
    const status = limiter.getStatus();
    expect(status.tokens).toBeGreaterThan(2);
  });
});

describe("Performance: Parallel Fallback", () => {
  it("returns first successful result", async () => {
    const result = await parallelFallback([
      {
        id: "provider1",
        fn: async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          throw new Error("failed");
        }
      },
      {
        id: "provider2",
        fn: async () => "success from provider2"
      },
      {
        id: "provider3",
        fn: async () => "success from provider3"
      }
    ]);

    expect(result.success).toBe("success from provider2");
    expect(result.provider).toBe("provider2");
  });

  it("throws when all providers fail", async () => {
    await expect(
      parallelFallback([
        {
          id: "p1",
          fn: async () => { throw new Error("p1 failed"); }
        },
        {
          id: "p2",
          fn: async () => { throw new Error("p2 failed"); }
        }
      ])
    ).rejects.toThrow("All providers failed");
  });
});
