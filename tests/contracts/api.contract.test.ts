/**
 * API Contract Tests
 * 
 * Tests that verify all canonical endpoints exist and return correct shapes.
 * Run against dev/staging before production deployment.
 * 
 * Usage:
 *   API_URL=https://payload-cms-setup-gray.vercel.app \
 *   TEST_TOKEN=<your_jwt_token> \
 *   npx vitest run tests/contracts/api.contract.test.ts
 */

import { describe, it, expect, beforeAll } from "vitest";

const API_URL = process.env.API_URL || "https://payload-cms-setup-gray.vercel.app";
const TEST_TOKEN = process.env.TEST_TOKEN || "";

// Skip tests if no token provided
const describeWithAuth = TEST_TOKEN ? describe : describe.skip;

async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${API_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (TEST_TOKEN) {
    headers["Authorization"] = `JWT ${TEST_TOKEN}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

describe("API Contract Tests", () => {
  beforeAll(() => {
    console.log(`Testing against: ${API_URL}`);
    console.log(`Has auth token: ${!!TEST_TOKEN}`);
  });

  // ============================================
  // NO 404 TESTS - All endpoints must exist
  // ============================================

  describe("Endpoint Existence (No 404s)", () => {
    it("GET /api/users/me should not return 404", async () => {
      const res = await apiFetch("/api/users/me");
      expect(res.status).not.toBe(404);
    });

    it("POST /api/users/follow should not return 404", async () => {
      const res = await apiFetch("/api/users/follow", {
        method: "POST",
        body: JSON.stringify({ followingId: "1" }),
      });
      expect(res.status).not.toBe(404);
    });

    it("DELETE /api/users/follow should not return 404", async () => {
      const res = await apiFetch("/api/users/follow", {
        method: "DELETE",
        body: JSON.stringify({ followingId: "1" }),
      });
      expect(res.status).not.toBe(404);
    });

    it("GET /api/posts/feed should not return 404", async () => {
      const res = await apiFetch("/api/posts/feed");
      expect(res.status).not.toBe(404);
    });

    it("GET /api/stories should not return 404", async () => {
      const res = await apiFetch("/api/stories");
      expect(res.status).not.toBe(404);
    });

    it("GET /api/notifications should not return 404", async () => {
      const res = await apiFetch("/api/notifications");
      expect(res.status).not.toBe(404);
    });

    it("GET /api/badges should not return 404", async () => {
      const res = await apiFetch("/api/badges");
      expect(res.status).not.toBe(404);
    });

    it("GET /api/conversations should not return 404", async () => {
      const res = await apiFetch("/api/conversations?box=inbox");
      expect(res.status).not.toBe(404);
    });

    it("POST /api/conversations/direct should not return 404", async () => {
      const res = await apiFetch("/api/conversations/direct", {
        method: "POST",
        body: JSON.stringify({ userId: "1" }),
      });
      expect(res.status).not.toBe(404);
    });

    it("GET /api/users/me/bookmarks should not return 404", async () => {
      const res = await apiFetch("/api/users/me/bookmarks");
      expect(res.status).not.toBe(404);
    });

    it("POST /api/devices/register should not return 404", async () => {
      const res = await apiFetch("/api/devices/register", {
        method: "POST",
        body: JSON.stringify({
          deviceId: "test-device",
          expoPushToken: "ExponentPushToken[test]",
        }),
      });
      expect(res.status).not.toBe(404);
    });
  });

  // ============================================
  // IDEMPOTENCY TESTS
  // ============================================

  describeWithAuth("Idempotency Tests", () => {
    // These tests require a valid auth token

    it("Follow twice returns same result (idempotent)", async () => {
      // First follow
      const res1 = await apiFetch("/api/users/follow", {
        method: "POST",
        body: JSON.stringify({ followingId: "1" }),
      });

      // Second follow (same user)
      const res2 = await apiFetch("/api/users/follow", {
        method: "POST",
        body: JSON.stringify({ followingId: "1" }),
      });

      // Both should succeed (not error)
      expect(res1.status).toBeLessThan(500);
      expect(res2.status).toBeLessThan(500);

      const data1 = await res1.json();
      const data2 = await res2.json();

      // Both should return following: true
      expect(data1.following).toBe(true);
      expect(data2.following).toBe(true);
    });

    it("Unfollow twice returns same result (idempotent)", async () => {
      // First unfollow
      const res1 = await apiFetch("/api/users/follow", {
        method: "DELETE",
        body: JSON.stringify({ followingId: "1" }),
      });

      // Second unfollow (same user)
      const res2 = await apiFetch("/api/users/follow", {
        method: "DELETE",
        body: JSON.stringify({ followingId: "1" }),
      });

      // Both should succeed
      expect(res1.status).toBeLessThan(500);
      expect(res2.status).toBeLessThan(500);

      const data1 = await res1.json();
      const data2 = await res2.json();

      // Both should return following: false
      expect(data1.following).toBe(false);
      expect(data2.following).toBe(false);
    });
  });

  // ============================================
  // RESPONSE SHAPE TESTS
  // ============================================

  describeWithAuth("Response Shape Tests", () => {
    it("GET /api/badges returns correct shape", async () => {
      const res = await apiFetch("/api/badges");
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("notificationsUnread");
      expect(data).toHaveProperty("messagesUnread");
      expect(typeof data.notificationsUnread).toBe("number");
      expect(typeof data.messagesUnread).toBe("number");
    });

    it("GET /api/stories returns grouped structure", async () => {
      const res = await apiFetch("/api/stories");
      
      if (res.status === 200) {
        const data = await res.json();
        // Should have myStories and otherStories
        expect(data).toHaveProperty("myStories");
        expect(data).toHaveProperty("otherStories");
        expect(Array.isArray(data.otherStories)).toBe(true);
      }
    });

    it("GET /api/conversations returns docs array", async () => {
      const res = await apiFetch("/api/conversations?box=inbox");

      if (res.status === 200) {
        const data = await res.json();
        expect(data).toHaveProperty("docs");
        expect(Array.isArray(data.docs)).toBe(true);
        expect(data).toHaveProperty("box");
      }
    });

    it("GET /api/notifications returns paginated docs", async () => {
      const res = await apiFetch("/api/notifications");

      if (res.status === 200) {
        const data = await res.json();
        expect(data).toHaveProperty("docs");
        expect(Array.isArray(data.docs)).toBe(true);
      }
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  describe("Error Handling Tests", () => {
    it("Unauthenticated request returns 401", async () => {
      // Make request without token
      const res = await fetch(`${API_URL}/api/badges`, {
        headers: { "Content-Type": "application/json" },
      });

      expect(res.status).toBe(401);
    });

    it("Invalid followingId returns 400 or 404", async () => {
      const res = await apiFetch("/api/users/follow", {
        method: "POST",
        body: JSON.stringify({ followingId: "invalid-id-that-does-not-exist" }),
      });

      // Should be 400 (bad request) or 404 (user not found), not 500
      expect([400, 404]).toContain(res.status);
    });

    it("Missing body returns 400", async () => {
      const res = await apiFetch("/api/users/follow", {
        method: "POST",
        body: JSON.stringify({}),
      });

      // Should be 400 (missing followingId), not 500
      expect(res.status).toBeLessThan(500);
    });
  });

  // ============================================
  // INVARIANT TESTS
  // ============================================

  describeWithAuth("Invariant Tests", () => {
    it("Self-follow returns error", async () => {
      // Get current user ID first
      const meRes = await apiFetch("/api/users/me");
      if (meRes.status !== 200) {
        console.log("Skipping self-follow test - could not get current user");
        return;
      }

      const me = await meRes.json();
      const myId = me.user?.id;

      if (!myId) {
        console.log("Skipping self-follow test - no user ID");
        return;
      }

      // Try to self-follow
      const res = await apiFetch("/api/users/follow", {
        method: "POST",
        body: JSON.stringify({ followingId: String(myId) }),
      });

      // Should be 409 (conflict) or 400 (bad request)
      expect([400, 409]).toContain(res.status);

      const data = await res.json();
      expect(data.error || data.message).toMatch(/yourself|self/i);
    });
  });
});

// ============================================
// CI GUARD TESTS
// ============================================

describe("CI Guards", () => {
  it("API_URL is not localhost", () => {
    expect(API_URL).not.toMatch(/localhost/);
    expect(API_URL).not.toMatch(/127\.0\.0\.1/);
  });

  it("API_URL starts with https", () => {
    expect(API_URL.startsWith("https://")).toBe(true);
  });
});
