/**
 * Contract Tests: Likes & Profile
 * 
 * STOP CONDITION:
 * - Likes endpoints exist (no 404)
 * - Likes are idempotent (double like = same count)
 * - Profile endpoint returns stable shape
 * 
 * Run: API_URL=https://payload-cms-setup-gray.vercel.app npx vitest run tests/contracts/likes-profile.contract.test.ts
 */

import { describe, it, expect, beforeAll } from "vitest";

const API_URL = process.env.API_URL || "https://payload-cms-setup-gray.vercel.app";
const TEST_TOKEN = process.env.TEST_TOKEN || "";
const TEST_POST_ID = process.env.TEST_POST_ID || "4";
const TEST_USER_ID = process.env.TEST_USER_ID || "15";

// CI Guard: Never use localhost
if (API_URL.includes("localhost") || API_URL.includes("127.0.0.1")) {
  throw new Error("FATAL: Contract tests must not use localhost");
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (TEST_TOKEN) {
    headers["Authorization"] = `JWT ${TEST_TOKEN}`;
  }

  const url = `${API_URL}${path}`;
  console.log(`[Test] ${options.method || "GET"} ${url}`);

  const res = await fetch(url, {
    ...options,
    headers,
  });

  return res;
}

describe("Likes Endpoint Contracts", () => {
  describe("Endpoint Existence (no 404)", () => {
    it("POST /api/posts/:id/like exists", async () => {
      const res = await apiFetch(`/api/posts/${TEST_POST_ID}/like`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      // 401 = exists but needs auth, 200/409 = exists and works
      expect([200, 401, 409]).toContain(res.status);
      expect(res.status).not.toBe(404);
    });

    it("DELETE /api/posts/:id/like exists", async () => {
      const res = await apiFetch(`/api/posts/${TEST_POST_ID}/like`, {
        method: "DELETE",
      });
      expect([200, 401]).toContain(res.status);
      expect(res.status).not.toBe(404);
    });

    it("GET /api/posts/:id/like-state exists", async () => {
      const res = await apiFetch(`/api/posts/${TEST_POST_ID}/like-state`);
      expect([200, 401]).toContain(res.status);
      expect(res.status).not.toBe(404);
    });

    it("GET /api/posts/:id/like exists (alias)", async () => {
      const res = await apiFetch(`/api/posts/${TEST_POST_ID}/like`);
      expect([200, 401]).toContain(res.status);
      expect(res.status).not.toBe(404);
    });
  });

  describe("Auth Required", () => {
    it("POST like requires auth", async () => {
      // Use a fresh fetch without token
      const res = await fetch(`${API_URL}/api/posts/${TEST_POST_ID}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(401);
    });

    it("DELETE like requires auth", async () => {
      const res = await fetch(`${API_URL}/api/posts/${TEST_POST_ID}/like`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      expect(res.status).toBe(401);
    });
  });

  // These tests require a valid token
  describe.skipIf(!TEST_TOKEN)("Idempotency (requires TEST_TOKEN)", () => {
    let initialCount: number;

    beforeAll(async () => {
      // Get initial state
      const res = await apiFetch(`/api/posts/${TEST_POST_ID}/like-state`);
      if (res.ok) {
        const data = await res.json();
        initialCount = data.likesCount || 0;
      }
    });

    it("POST like twice does NOT double count", async () => {
      // First like
      const res1 = await apiFetch(`/api/posts/${TEST_POST_ID}/like`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      expect(res1.ok).toBe(true);
      const data1 = await res1.json();
      const countAfterFirst = data1.likesCount;

      // Second like (should be idempotent)
      const res2 = await apiFetch(`/api/posts/${TEST_POST_ID}/like`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      expect(res2.ok).toBe(true);
      const data2 = await res2.json();

      // Count should NOT increase
      expect(data2.likesCount).toBe(countAfterFirst);
      expect(data2.hasLiked).toBe(true);
    });

    it("DELETE like twice does NOT cause error", async () => {
      // First unlike
      const res1 = await apiFetch(`/api/posts/${TEST_POST_ID}/like`, {
        method: "DELETE",
      });
      expect(res1.ok).toBe(true);
      const data1 = await res1.json();

      // Second unlike (should be idempotent)
      const res2 = await apiFetch(`/api/posts/${TEST_POST_ID}/like`, {
        method: "DELETE",
      });
      expect(res2.ok).toBe(true);
      const data2 = await res2.json();

      // Should still return valid state, no error
      expect(data2.hasLiked).toBe(false);
      expect(data2.likesCount).toBe(data1.likesCount);
    });

    it("Response shape is stable", async () => {
      const res = await apiFetch(`/api/posts/${TEST_POST_ID}/like-state`);
      expect(res.ok).toBe(true);
      const data = await res.json();

      // Required fields
      expect(typeof data.hasLiked).toBe("boolean");
      expect(typeof data.likesCount).toBe("number");
    });
  });
});

describe("Profile Endpoint Contracts", () => {
  describe("Endpoint Existence (no 404)", () => {
    it("GET /api/users/:id/profile exists", async () => {
      const res = await apiFetch(`/api/users/${TEST_USER_ID}/profile`);
      // 401 = exists but needs auth, 200 = exists and works
      expect([200, 401]).toContain(res.status);
      expect(res.status).not.toBe(404);
    });

    it("GET /api/users/:id/posts exists", async () => {
      const res = await apiFetch(`/api/users/${TEST_USER_ID}/posts`);
      expect([200, 401]).toContain(res.status);
      expect(res.status).not.toBe(404);
    });

    it("GET /api/users/:id/follow-state exists", async () => {
      const res = await apiFetch(`/api/users/${TEST_USER_ID}/follow-state`);
      expect([200, 401]).toContain(res.status);
      expect(res.status).not.toBe(404);
    });
  });

  describe.skipIf(!TEST_TOKEN)("Response Shapes (requires TEST_TOKEN)", () => {
    it("Profile returns stable shape (no null fields that crash client)", async () => {
      const res = await apiFetch(`/api/users/${TEST_USER_ID}/profile`);
      if (res.status === 401) {
        console.log("Skipping - no valid token");
        return;
      }
      expect(res.ok).toBe(true);
      const data = await res.json();

      // Required fields that MUST exist and be correct type
      expect(typeof data.id).toBe("string");
      expect(typeof data.username).toBe("string");
      expect(data.username.length).toBeGreaterThan(0);

      // Numeric fields must be numbers (not null/undefined)
      expect(typeof data.followersCount).toBe("number");
      expect(typeof data.followingCount).toBe("number");
      expect(typeof data.postsCount).toBe("number");

      // Boolean fields
      expect(typeof data.isFollowing).toBe("boolean");
      expect(typeof data.isOwnProfile).toBe("boolean");
    });

    it("Follow state returns stable shape", async () => {
      const res = await apiFetch(`/api/users/${TEST_USER_ID}/follow-state`);
      if (res.status === 401) {
        console.log("Skipping - no valid token");
        return;
      }
      expect(res.ok).toBe(true);
      const data = await res.json();

      expect(typeof data.isFollowing).toBe("boolean");
      expect(typeof data.isFollowedBy).toBe("boolean");
    });
  });
});

describe("CI Guards", () => {
  it("API_URL is not localhost", () => {
    expect(API_URL).not.toContain("localhost");
    expect(API_URL).not.toContain("127.0.0.1");
  });

  it("API_URL uses HTTPS", () => {
    expect(API_URL.startsWith("https://")).toBe(true);
  });
});
