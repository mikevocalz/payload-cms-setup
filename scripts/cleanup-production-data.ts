/**
 * Production Data Cleanup Script
 *
 * PHASE D: Safe cleanup of bad data caused by missing server-side invariants
 *
 * SAFETY:
 * - Idempotent (safe to run multiple times)
 * - Supports DRY_RUN mode (prints what would change)
 * - Batched operations (avoids memory issues)
 * - Logs summary report
 * - NEVER deletes media from Bunny CDN - only fixes DB records
 *
 * RUN:
 *   DRY_RUN=1 npx tsx scripts/cleanup-production-data.ts  # Preview
 *   DRY_RUN=0 npx tsx scripts/cleanup-production-data.ts  # Execute
 */

import "dotenv/config";
import { getPayload, Payload } from "payload";
import config from "../payload.config";

// Configuration
const DRY_RUN = process.env.DRY_RUN !== "0";
const BATCH_SIZE = Number(process.env.BATCH_SIZE ?? 100);

// Summary tracking
interface CleanupSummary {
  duplicateLikesDeleted: number;
  duplicateBookmarksDeleted: number;
  duplicateFollowsDeleted: number;
  selfFollowsDeleted: number;
  storiesExpiresAtFixed: number;
  postsWithMissingAuthor: number;
  commentsDepthViolations: number;
  orphanMediaReferences: number;
  countsRecomputed: number;
}

const summary: CleanupSummary = {
  duplicateLikesDeleted: 0,
  duplicateBookmarksDeleted: 0,
  duplicateFollowsDeleted: 0,
  selfFollowsDeleted: 0,
  storiesExpiresAtFixed: 0,
  postsWithMissingAuthor: 0,
  commentsDepthViolations: 0,
  orphanMediaReferences: 0,
  countsRecomputed: 0,
};

function log(...args: unknown[]) {
  console.log(`[${new Date().toISOString()}]`, ...args);
}

function warn(...args: unknown[]) {
  console.warn(`[${new Date().toISOString()}] ⚠️`, ...args);
}

function error(...args: unknown[]) {
  console.error(`[${new Date().toISOString()}] ❌`, ...args);
}

/**
 * Initialize Payload CMS
 */
async function initPayload(): Promise<Payload> {
  if (!process.env.PAYLOAD_SECRET) {
    throw new Error("Missing PAYLOAD_SECRET environment variable");
  }
  if (
    !process.env.DATABASE_URI &&
    !process.env.DATABASE_URL &&
    !process.env.POSTGRES_URL
  ) {
    throw new Error(
      "Missing database connection string (DATABASE_URI, DATABASE_URL, or POSTGRES_URL)",
    );
  }

  log("Initializing Payload CMS...");
  const payload = await getPayload({ config });
  log("Payload initialized successfully");
  return payload;
}

/**
 * Deduplicate a join collection by (leftField, rightField)
 * Keeps the oldest record, deletes duplicates
 */
async function dedupeJoinCollection(
  payload: Payload,
  opts: {
    collection: string;
    leftField: string;
    rightField: string;
    summaryKey: keyof CleanupSummary;
  },
) {
  const { collection, leftField, rightField, summaryKey } = opts;
  log(
    `\n[DEDUPE] ${collection} by (${leftField}, ${rightField}) DRY_RUN=${DRY_RUN}`,
  );

  let page = 1;
  let deleted = 0;
  const seen = new Map<string, string>(); // pairKey -> keptId

  while (true) {
    const res = await payload.find({
      collection: collection as any,
      limit: BATCH_SIZE,
      page,
      sort: "createdAt", // Keep oldest
      depth: 0,
    });

    for (const doc of res.docs as any[]) {
      const left = doc[leftField];
      const right = doc[rightField];
      const leftId = typeof left === "string" ? left : (left?.id ?? left);
      const rightId = typeof right === "string" ? right : (right?.id ?? right);

      if (!leftId || !rightId) continue;

      const key = `${leftId}::${rightId}`;
      if (!seen.has(key)) {
        seen.set(key, doc.id);
        continue;
      }

      // Duplicate found
      log(`  Duplicate ${collection}: ${doc.id} (keeping ${seen.get(key)})`);
      if (!DRY_RUN) {
        try {
          await payload.delete({
            collection: collection as any,
            id: doc.id,
          });
        } catch (e: any) {
          error(`  Failed to delete ${collection} ${doc.id}:`, e.message);
        }
      }
      deleted++;
    }

    if (page >= res.totalPages) break;
    page++;
  }

  log(
    `[DEDUPE] ${collection}: ${deleted} duplicates ${DRY_RUN ? "would be" : ""} deleted`,
  );
  summary[summaryKey] = deleted;
  return deleted;
}

/**
 * Remove self-follows (user following themselves)
 */
async function removeSelfFollows(payload: Payload) {
  log("\n[SELF-FOLLOWS] Checking for self-follows...");

  let page = 1;
  let deleted = 0;

  while (true) {
    const res = await payload.find({
      collection: "follows",
      limit: BATCH_SIZE,
      page,
      depth: 0,
    });

    for (const doc of res.docs as any[]) {
      const followerId =
        typeof doc.follower === "string"
          ? doc.follower
          : (doc.follower?.id ?? doc.follower);
      const followingId =
        typeof doc.following === "string"
          ? doc.following
          : (doc.following?.id ?? doc.following);

      if (
        followerId &&
        followingId &&
        String(followerId) === String(followingId)
      ) {
        log(`  Self-follow found: user ${followerId} (record ${doc.id})`);
        if (!DRY_RUN) {
          try {
            await payload.delete({
              collection: "follows",
              id: doc.id,
            });
          } catch (e: any) {
            error(`  Failed to delete self-follow ${doc.id}:`, e.message);
          }
        }
        deleted++;
      }
    }

    if (page >= res.totalPages) break;
    page++;
  }

  log(
    `[SELF-FOLLOWS] ${deleted} self-follows ${DRY_RUN ? "would be" : ""} deleted`,
  );
  summary.selfFollowsDeleted = deleted;
  return deleted;
}

/**
 * Ensure all stories have expiresAt set
 */
async function ensureStoryExpiresAt(payload: Payload) {
  log("\n[STORIES] Ensuring expiresAt is set...");

  let page = 1;
  let updated = 0;

  while (true) {
    const res = await payload.find({
      collection: "stories",
      limit: BATCH_SIZE,
      page,
      depth: 0,
    });

    for (const story of res.docs as any[]) {
      if (story.expiresAt) continue;

      const created = story.createdAt ? new Date(story.createdAt) : new Date();
      const expiresAt = new Date(created.getTime() + 24 * 60 * 60 * 1000);

      log(
        `  Story ${story.id}: setting expiresAt to ${expiresAt.toISOString()}`,
      );
      if (!DRY_RUN) {
        try {
          await payload.update({
            collection: "stories",
            id: story.id,
            data: { expiresAt: expiresAt.toISOString() },
            depth: 0,
          });
        } catch (e: any) {
          error(`  Failed to update story ${story.id}:`, e.message);
        }
      }
      updated++;
    }

    if (page >= res.totalPages) break;
    page++;
  }

  log(
    `[STORIES] ${updated} stories ${DRY_RUN ? "would have" : "had"} expiresAt set`,
  );
  summary.storiesExpiresAtFixed = updated;
  return updated;
}

/**
 * Find posts with missing or invalid author
 */
async function findPostsWithMissingAuthor(payload: Payload) {
  log("\n[POSTS] Checking for posts with missing author...");

  let page = 1;
  let found = 0;

  while (true) {
    const res = await payload.find({
      collection: "posts",
      limit: BATCH_SIZE,
      page,
      depth: 1, // Populate author to check if valid
    });

    for (const post of res.docs as any[]) {
      // Check if author is missing or null
      if (!post.author) {
        warn(`  Post ${post.id}: missing author`);
        found++;
        // Don't delete - just report. Could mark with a flag if needed.
      }
    }

    if (page >= res.totalPages) break;
    page++;
  }

  log(`[POSTS] ${found} posts have missing author (not deleted, logged only)`);
  summary.postsWithMissingAuthor = found;
  return found;
}

/**
 * Find comments that violate depth rule (reply-to-reply)
 */
async function findCommentDepthViolations(payload: Payload) {
  log("\n[COMMENTS] Checking for depth violations (reply-to-reply)...");

  let page = 1;
  let violations = 0;

  while (true) {
    const res = await payload.find({
      collection: "comments",
      limit: BATCH_SIZE,
      page,
      where: {
        parent: { exists: true },
      },
      depth: 1, // Populate parent
    });

    for (const comment of res.docs as any[]) {
      const parent = comment.parent;
      if (parent && typeof parent === "object" && parent.parent) {
        warn(
          `  Comment ${comment.id}: reply-to-reply violation (parent ${parent.id} has parent ${parent.parent})`,
        );
        violations++;
        // Don't delete automatically - log for manual review
        // Could reattach to grandparent or soft-delete
      }
    }

    if (page >= res.totalPages) break;
    page++;
  }

  log(
    `[COMMENTS] ${violations} depth violations found (logged only, manual review needed)`,
  );
  summary.commentsDepthViolations = violations;
  return violations;
}

/**
 * Recompute likesCount for posts from likes collection
 */
async function recomputePostLikesCounts(payload: Payload) {
  log("\n[COUNTS] Recomputing post likes counts...");

  let page = 1;
  let updated = 0;

  while (true) {
    const res = await payload.find({
      collection: "posts",
      limit: BATCH_SIZE,
      page,
      depth: 0,
    });

    for (const post of res.docs as any[]) {
      // Count actual likes
      const likesResult = await payload.find({
        collection: "likes",
        where: {
          post: { equals: post.id },
        },
        limit: 0, // Just need count
      });

      const actualCount = likesResult.totalDocs;
      const storedCount = post.likesCount || 0;

      if (actualCount !== storedCount) {
        log(`  Post ${post.id}: likesCount ${storedCount} -> ${actualCount}`);
        if (!DRY_RUN) {
          try {
            await payload.update({
              collection: "posts",
              id: post.id,
              data: { likesCount: actualCount },
              depth: 0,
            });
          } catch (e: any) {
            error(`  Failed to update post ${post.id}:`, e.message);
          }
        }
        updated++;
      }
    }

    if (page >= res.totalPages) break;
    page++;
  }

  log(
    `[COUNTS] ${updated} post likesCount values ${DRY_RUN ? "would be" : "were"} corrected`,
  );
  summary.countsRecomputed += updated;
  return updated;
}

/**
 * Recompute followersCount and followingCount for users
 */
async function recomputeUserFollowCounts(payload: Payload) {
  log("\n[COUNTS] Recomputing user follow counts...");

  let page = 1;
  let updated = 0;

  while (true) {
    const res = await payload.find({
      collection: "users",
      limit: BATCH_SIZE,
      page,
      depth: 0,
    });

    for (const user of res.docs as any[]) {
      // Count followers (where following = this user)
      const followersResult = await payload.find({
        collection: "follows",
        where: {
          following: { equals: user.id },
        },
        limit: 0,
      });

      // Count following (where follower = this user)
      const followingResult = await payload.find({
        collection: "follows",
        where: {
          follower: { equals: user.id },
        },
        limit: 0,
      });

      const actualFollowers = followersResult.totalDocs;
      const actualFollowing = followingResult.totalDocs;
      const storedFollowers = user.followersCount || 0;
      const storedFollowing = user.followingCount || 0;

      if (
        actualFollowers !== storedFollowers ||
        actualFollowing !== storedFollowing
      ) {
        log(
          `  User ${user.id} (${user.username}): followers ${storedFollowers}->${actualFollowers}, following ${storedFollowing}->${actualFollowing}`,
        );
        if (!DRY_RUN) {
          try {
            await payload.update({
              collection: "users",
              id: user.id,
              data: {
                followersCount: actualFollowers,
                followingCount: actualFollowing,
              },
              depth: 0,
            });
          } catch (e: any) {
            error(`  Failed to update user ${user.id}:`, e.message);
          }
        }
        updated++;
      }
    }

    if (page >= res.totalPages) break;
    page++;
  }

  log(
    `[COUNTS] ${updated} user follow counts ${DRY_RUN ? "would be" : "were"} corrected`,
  );
  summary.countsRecomputed += updated;
  return updated;
}

// ============================================================
// MESSAGING CLEANUP FUNCTIONS
// ============================================================

/**
 * Find and merge duplicate direct conversations (same 2 participants)
 * Works without 'type' column - checks participant count instead
 */
async function dedupeDuplicateConversations(payload: Payload) {
  log("\n[MESSAGING] Finding duplicate direct conversations...");

  let page = 1;
  let merged = 0;
  const seen = new Map<string, string>(); // participantKey -> keptConversationId

  while (true) {
    // Fetch all conversations (filter by participant count in code)
    const res = await payload.find({
      collection: "conversations",
      limit: BATCH_SIZE,
      page,
      sort: "createdAt", // Keep oldest
      depth: 0,
    });

    for (const conv of res.docs as any[]) {
      const participants = (conv.participants || [])
        .map((p: any) => (typeof p === "string" ? p : p?.id))
        .filter(Boolean)
        .sort();

      if (participants.length !== 2) continue;

      const key = participants.join("::");

      if (!seen.has(key)) {
        seen.set(key, conv.id);
        continue;
      }

      // Duplicate found - merge messages into the kept conversation
      const keptId = seen.get(key)!;
      log(`  Duplicate conversation ${conv.id} -> merging into ${keptId}`);

      if (!DRY_RUN) {
        try {
          // Move all messages from duplicate to kept conversation
          const messages = await payload.find({
            collection: "messages",
            where: { conversation: { equals: conv.id } },
            limit: 1000,
            depth: 0,
          });

          for (const msg of messages.docs as any[]) {
            await payload.update({
              collection: "messages",
              id: msg.id,
              data: { conversation: keptId },
              depth: 0,
            });
          }

          // Delete duplicate conversation
          await payload.delete({
            collection: "conversations",
            id: conv.id,
          });

          log(
            `    Moved ${messages.docs.length} messages, deleted conversation ${conv.id}`,
          );
        } catch (e: any) {
          error(`  Failed to merge conversation ${conv.id}:`, e.message);
        }
      }
      merged++;
    }

    if (page >= res.totalPages) break;
    page++;
  }

  log(
    `[MESSAGING] ${merged} duplicate conversations ${DRY_RUN ? "would be" : "were"} merged`,
  );
  return merged;
}

/**
 * Find conversations with < 2 participants and mark as invalid
 */
async function findInvalidConversations(payload: Payload) {
  log("\n[MESSAGING] Finding conversations with < 2 participants...");

  let page = 1;
  let found = 0;

  while (true) {
    const res = await payload.find({
      collection: "conversations",
      limit: BATCH_SIZE,
      page,
      depth: 0,
    });

    for (const conv of res.docs as any[]) {
      const participants = (conv.participants || []).filter(Boolean);

      if (participants.length < 2) {
        warn(
          `  Conversation ${conv.id}: only ${participants.length} participants`,
        );
        found++;
        // Don't delete - just log for manual review
      }
    }

    if (page >= res.totalPages) break;
    page++;
  }

  log(`[MESSAGING] ${found} conversations have < 2 participants (logged only)`);
  return found;
}

/**
 * Find messages where sender is not a participant in the conversation
 */
async function findOrphanMessages(payload: Payload) {
  log("\n[MESSAGING] Finding messages where sender is not a participant...");

  let page = 1;
  let found = 0;

  while (true) {
    const res = await payload.find({
      collection: "messages",
      limit: BATCH_SIZE,
      page,
      depth: 1, // Populate conversation
    });

    for (const msg of res.docs as any[]) {
      const senderId =
        typeof msg.sender === "string" ? msg.sender : msg.sender?.id;
      const conv = msg.conversation;

      if (!conv || !senderId) continue;

      const participants = (conv.participants || [])
        .map((p: any) => (typeof p === "string" ? p : p?.id))
        .filter(Boolean);

      if (!participants.includes(String(senderId))) {
        warn(
          `  Message ${msg.id}: sender ${senderId} not in conversation ${conv.id}`,
        );
        found++;
        // Don't delete - just log for manual review
      }
    }

    if (page >= res.totalPages) break;
    page++;
  }

  log(`[MESSAGING] ${found} orphan messages found (logged only)`);
  return found;
}

/**
 * Find messages without a valid conversation
 */
async function findMessagesWithoutConversation(payload: Payload) {
  log("\n[MESSAGING] Finding messages without valid conversation...");

  let page = 1;
  let found = 0;

  while (true) {
    const res = await payload.find({
      collection: "messages",
      limit: BATCH_SIZE,
      page,
      depth: 0,
    });

    for (const msg of res.docs as any[]) {
      if (!msg.conversation) {
        warn(`  Message ${msg.id}: no conversation reference`);
        found++;
        continue;
      }

      // Check if conversation exists
      try {
        const convId =
          typeof msg.conversation === "string"
            ? msg.conversation
            : msg.conversation?.id;
        const conv = await payload.findByID({
          collection: "conversations",
          id: convId,
          depth: 0,
        });

        if (!conv) {
          warn(`  Message ${msg.id}: conversation ${convId} not found`);
          found++;
        }
      } catch {
        warn(`  Message ${msg.id}: conversation lookup failed`);
        found++;
      }
    }

    if (page >= res.totalPages) break;
    page++;
  }

  log(`[MESSAGING] ${found} messages without valid conversation (logged only)`);
  return found;
}

/**
 * Fix conversations missing lastMessageAt
 */
async function fixConversationLastMessageAt(payload: Payload) {
  log("\n[MESSAGING] Fixing conversations missing lastMessageAt...");

  let page = 1;
  let fixed = 0;

  while (true) {
    const res = await payload.find({
      collection: "conversations",
      limit: BATCH_SIZE,
      page,
      where: {
        lastMessageAt: { exists: false },
      },
      depth: 0,
    });

    for (const conv of res.docs as any[]) {
      // Find the most recent message
      const messages = await payload.find({
        collection: "messages",
        where: { conversation: { equals: conv.id } },
        sort: "-createdAt",
        limit: 1,
        depth: 0,
      });

      if (messages.docs.length > 0) {
        const lastMsg = messages.docs[0] as any;
        log(
          `  Conversation ${conv.id}: setting lastMessageAt to ${lastMsg.createdAt}`,
        );

        if (!DRY_RUN) {
          try {
            await payload.update({
              collection: "conversations",
              id: conv.id,
              data: {
                lastMessageAt: lastMsg.createdAt,
                lastMessagePreview: lastMsg.content?.substring(0, 100) || "",
              },
              depth: 0,
            });
          } catch (e: any) {
            error(`  Failed to update conversation ${conv.id}:`, e.message);
          }
        }
        fixed++;
      }
    }

    if (page >= res.totalPages) break;
    page++;
  }

  log(
    `[MESSAGING] ${fixed} conversations ${DRY_RUN ? "would have" : "had"} lastMessageAt fixed`,
  );
  return fixed;
}

/**
 * Add missing 'type' field to conversations
 * NOTE: Skipped if 'type' column doesn't exist in DB yet
 */
async function fixConversationTypes(payload: Payload) {
  log("\n[MESSAGING] Fixing conversations missing type field...");

  // Check if type column exists by trying a simple query
  try {
    await payload.find({
      collection: "conversations",
      limit: 1,
      where: { type: { exists: true } },
      depth: 0,
    });
  } catch (e: any) {
    if (
      e.message?.includes("type does not exist") ||
      e.cause?.message?.includes("type does not exist")
    ) {
      log(
        "[MESSAGING] SKIPPED: type column does not exist in DB yet. Run migrations first.",
      );
      return 0;
    }
    throw e;
  }

  let page = 1;
  let fixed = 0;

  while (true) {
    const res = await payload.find({
      collection: "conversations",
      limit: BATCH_SIZE,
      page,
      where: {
        type: { exists: false },
      },
      depth: 0,
    });

    for (const conv of res.docs as any[]) {
      const participants = (conv.participants || []).filter(Boolean);
      const isGroup = conv.isGroup === true || participants.length > 2;
      const type = isGroup ? "group" : "direct";

      log(
        `  Conversation ${conv.id}: setting type to '${type}' (${participants.length} participants)`,
      );

      if (!DRY_RUN) {
        try {
          await payload.update({
            collection: "conversations",
            id: conv.id,
            data: { type } as any,
            depth: 0,
          });
        } catch (e: any) {
          error(`  Failed to update conversation ${conv.id}:`, e.message);
        }
      }
      fixed++;
    }

    if (page >= res.totalPages) break;
    page++;
  }

  log(
    `[MESSAGING] ${fixed} conversations ${DRY_RUN ? "would have" : "had"} type field fixed`,
  );
  return fixed;
}

// ============================================================
// NOTIFICATION CLEANUP FUNCTIONS
// ============================================================

/**
 * Find and remove duplicate notifications by dedupeKey
 * NOTE: Skipped if dedupeKey column doesn't exist in DB yet
 */
async function dedupeNotifications(payload: Payload) {
  log("\n[NOTIFICATIONS] Finding duplicate notifications by dedupeKey...");

  // Check if dedupeKey column exists
  try {
    await payload.find({
      collection: "notifications",
      limit: 1,
      where: { dedupeKey: { exists: true } },
      depth: 0,
    });
  } catch (e: any) {
    if (
      e.message?.includes("dedupeKey") ||
      e.message?.includes("dedupe_key") ||
      e.cause?.message?.includes("dedupeKey") ||
      e.cause?.message?.includes("dedupe_key")
    ) {
      log(
        "[NOTIFICATIONS] SKIPPED: dedupeKey column does not exist yet. Run migrations first.",
      );
      return 0;
    }
    throw e;
  }

  let page = 1;
  let deleted = 0;
  const seen = new Map<string, any>();

  while (true) {
    const res = await payload.find({
      collection: "notifications",
      limit: BATCH_SIZE,
      page,
      sort: "createdAt", // Keep oldest
      depth: 0,
    });

    for (const notif of res.docs as any[]) {
      if (!notif.dedupeKey) continue;

      if (!seen.has(notif.dedupeKey)) {
        seen.set(notif.dedupeKey, notif.id);
        continue;
      }

      // Duplicate found
      log(
        `  Duplicate notification ${notif.id} (dedupeKey: ${notif.dedupeKey})`,
      );

      if (!DRY_RUN) {
        try {
          await payload.delete({
            collection: "notifications",
            id: notif.id,
          });
        } catch (e: any) {
          error(`  Failed to delete notification ${notif.id}:`, e.message);
        }
      }
      deleted++;
    }

    if (page >= res.totalPages) break;
    page++;
  }

  log(
    `[NOTIFICATIONS] ${deleted} duplicate notifications ${DRY_RUN ? "would be" : "were"} deleted`,
  );
  return deleted;
}

/**
 * Find notifications with missing recipient or entityId
 */
async function findInvalidNotifications(payload: Payload) {
  log("\n[NOTIFICATIONS] Finding notifications with missing recipient...");

  let page = 1;
  let found = 0;

  while (true) {
    const res = await payload.find({
      collection: "notifications",
      limit: BATCH_SIZE,
      page,
      depth: 0,
    });

    for (const notif of res.docs as any[]) {
      if (!notif.recipient) {
        warn(`  Notification ${notif.id}: missing recipient`);
        found++;
      }
    }

    if (page >= res.totalPages) break;
    page++;
  }

  log(`[NOTIFICATIONS] ${found} invalid notifications found (logged only)`);
  return found;
}

/**
 * Clean up old notifications (retention policy: 90 days)
 */
async function cleanupOldNotifications(payload: Payload) {
  const RETENTION_DAYS = 90;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);

  log(
    `\n[NOTIFICATIONS] Cleaning up notifications older than ${RETENTION_DAYS} days...`,
  );

  let page = 1;
  let deleted = 0;

  while (true) {
    const res = await payload.find({
      collection: "notifications",
      limit: BATCH_SIZE,
      page,
      where: {
        and: [
          { createdAt: { less_than: cutoffDate.toISOString() } },
          { readAt: { exists: true } }, // Only delete READ notifications
        ],
      },
      depth: 0,
    });

    if (res.docs.length === 0) break;

    for (const notif of res.docs as any[]) {
      log(
        `  Old notification ${notif.id}: ${notif.type} from ${notif.createdAt}`,
      );

      if (!DRY_RUN) {
        try {
          await payload.delete({
            collection: "notifications",
            id: notif.id,
          });
        } catch (e: any) {
          error(`  Failed to delete notification ${notif.id}:`, e.message);
        }
      }
      deleted++;
    }

    // Since we're deleting, don't increment page
    if (DRY_RUN) {
      if (page >= res.totalPages) break;
      page++;
    }
  }

  log(
    `[NOTIFICATIONS] ${deleted} old notifications ${DRY_RUN ? "would be" : "were"} deleted`,
  );
  return deleted;
}

/**
 * Disable invalid device tokens
 */
async function cleanupInvalidDeviceTokens(payload: Payload) {
  log("\n[NOTIFICATIONS] Checking for invalid device tokens...");

  // Check if user-devices collection exists
  try {
    await payload.find({
      collection: "user-devices" as any,
      limit: 1,
      depth: 0,
    });
  } catch (e: any) {
    log("[NOTIFICATIONS] SKIPPED: user-devices collection does not exist yet.");
    return 0;
  }

  let page = 1;
  let disabled = 0;

  while (true) {
    const res = await payload.find({
      collection: "user-devices" as any,
      limit: BATCH_SIZE,
      page,
      where: {
        disabledAt: { exists: false },
      },
      depth: 0,
    });

    for (const device of res.docs as any[]) {
      // Validate Expo push token format
      if (!device.expoPushToken?.startsWith("ExponentPushToken[")) {
        warn(`  Device ${device.id}: invalid token format`);

        if (!DRY_RUN) {
          try {
            await payload.update({
              collection: "user-devices" as any,
              id: device.id,
              data: { disabledAt: new Date().toISOString() },
            });
          } catch (e: any) {
            error(`  Failed to disable device ${device.id}:`, e.message);
          }
        }
        disabled++;
      }
    }

    if (page >= res.totalPages) break;
    page++;
  }

  log(
    `[NOTIFICATIONS] ${disabled} invalid device tokens ${DRY_RUN ? "would be" : "were"} disabled`,
  );
  return disabled;
}

/**
 * Main cleanup function
 */
async function main() {
  log("========================================");
  log("PRODUCTION DATA CLEANUP SCRIPT");
  log(
    `DRY_RUN: ${DRY_RUN} (${DRY_RUN ? "preview mode - no changes" : "EXECUTING CHANGES"})`,
  );
  log(`BATCH_SIZE: ${BATCH_SIZE}`);
  log("========================================\n");

  if (!DRY_RUN) {
    log("⚠️  WARNING: DRY_RUN=0 - Changes WILL be made to the database!");
    log("    Press Ctrl+C within 5 seconds to abort...\n");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  const payload = await initPayload();

  try {
    // ========================================
    // SOCIAL GRAPH CLEANUP
    // ========================================

    // 1. Deduplicate likes
    await dedupeJoinCollection(payload, {
      collection: "likes",
      leftField: "user",
      rightField: "post",
      summaryKey: "duplicateLikesDeleted",
    });

    // 2. Deduplicate bookmarks
    await dedupeJoinCollection(payload, {
      collection: "bookmarks",
      leftField: "user",
      rightField: "post",
      summaryKey: "duplicateBookmarksDeleted",
    });

    // 3. Deduplicate follows
    await dedupeJoinCollection(payload, {
      collection: "follows",
      leftField: "follower",
      rightField: "following",
      summaryKey: "duplicateFollowsDeleted",
    });

    // 4. Remove self-follows
    await removeSelfFollows(payload);

    // 5. Fix story expiresAt
    await ensureStoryExpiresAt(payload);

    // 6. Find posts with missing author (report only)
    await findPostsWithMissingAuthor(payload);

    // 7. Find comment depth violations (report only)
    await findCommentDepthViolations(payload);

    // 8. Recompute counts
    await recomputePostLikesCounts(payload);
    await recomputeUserFollowCounts(payload);

    // ========================================
    // MESSAGING CLEANUP
    // ========================================

    // 9. Deduplicate direct conversations (uses isGroup field)
    await dedupeDuplicateConversations(payload);

    // 10. Find invalid conversations (< 2 participants)
    await findInvalidConversations(payload);

    // 11. Find orphan messages (sender not in conversation)
    await findOrphanMessages(payload);

    // 12. Find messages without valid conversation
    await findMessagesWithoutConversation(payload);

    // 13. Fix conversations missing lastMessageAt
    await fixConversationLastMessageAt(payload);

    // NOTE: fixConversationTypes() skipped - requires 'type' column migration

    // ========================================
    // NOTIFICATION CLEANUP
    // NOTE: Skipped until DB migration adds new columns (dedupeKey, etc.)
    // ========================================

    // 14. Find notifications with missing recipient (uses existing schema)
    await findInvalidNotifications(payload);

    // 15. Clean up old notifications (retention policy - uses existing schema)
    await cleanupOldNotifications(payload);

    // NOTE: dedupeNotifications() and cleanupInvalidDeviceTokens() skipped
    // - dedupeNotifications requires dedupeKey column
    // - cleanupInvalidDeviceTokens requires user-devices collection
  } catch (e) {
    error("Cleanup failed:", e);
    process.exit(1);
  }

  // Print summary
  log("\n========================================");
  log("CLEANUP SUMMARY");
  log(`DRY_RUN: ${DRY_RUN}`);
  log("========================================");
  log(JSON.stringify(summary, null, 2));
  log("========================================\n");

  if (DRY_RUN) {
    log("✅ Dry run complete. Run with DRY_RUN=0 to execute changes.");
  } else {
    log("✅ Cleanup complete. Verify endpoints work correctly.");
  }

  process.exit(0);
}

// Run
main().catch((e) => {
  error("Fatal error:", e);
  process.exit(1);
});
