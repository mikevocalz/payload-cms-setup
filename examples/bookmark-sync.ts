/**
 * Bookmark Sync Utility
 * Handles synchronization between local storage and backend bookmarks
 */

import { api } from "./expo-api-client";

export interface Bookmark {
  id: string;
  post: string;
  user: string;
  createdAt: string;
}

export interface BookmarkStore {
  bookmarks: string[]; // Array of post IDs
  lastSync: number | null;
}

const STORAGE_KEY = "bookmarks";

// Local storage operations
export const getLocalBookmarks = (): BookmarkStore => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { bookmarks: [], lastSync: null };
  } catch (error) {
    console.error("Error reading local bookmarks:", error);
    return { bookmarks: [], lastSync: null };
  }
};

export const setLocalBookmarks = (store: BookmarkStore): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.error("Error saving local bookmarks:", error);
  }
};

// Sync functions
export const syncBookmarksToBackend = async (): Promise<void> => {
  try {
    const localStore = getLocalBookmarks();
    const { docs: backendBookmarks } = await api.getBookmarks({ limit: 1000 });

    // Get backend bookmark post IDs
    const backendPostIds = backendBookmarks.map((b: Bookmark) => b.post);

    // Find bookmarks that exist locally but not on backend
    const missingOnBackend = localStore.bookmarks.filter(
      (postId) => !backendPostIds.includes(postId),
    );

    // Add missing bookmarks to backend
    for (const postId of missingOnBackend) {
      try {
        await api.create("bookmarks", { post: postId });
      } catch (error) {
        console.error(`Failed to sync bookmark for post ${postId}:`, error);
      }
    }

    // Update last sync time
    localStore.lastSync = Date.now();
    setLocalBookmarks(localStore);
  } catch (error) {
    console.error("Error syncing bookmarks to backend:", error);
    throw error;
  }
};

export const syncBookmarksFromBackend = async (): Promise<void> => {
  try {
    const { docs: backendBookmarks } = await api.getBookmarks({ limit: 1000 });
    const backendPostIds = backendBookmarks.map((b: Bookmark) => b.post);

    const localStore = getLocalBookmarks();
    localStore.bookmarks = backendPostIds;
    localStore.lastSync = Date.now();

    setLocalBookmarks(localStore);
  } catch (error) {
    console.error("Error syncing bookmarks from backend:", error);
    throw error;
  }
};

// Hybrid bookmark operations (local + backend)
export const toggleBookmarkSync = async (
  postId: string,
): Promise<{ bookmarked: boolean }> => {
  const localStore = getLocalBookmarks();
  const isCurrentlyBooked = localStore.bookmarks.includes(postId);

  try {
    // Try backend first
    const result = await api.toggleBookmark(postId);

    // Update local store to match backend result
    if (result.bookmarked) {
      if (!localStore.bookmarks.includes(postId)) {
        localStore.bookmarks.push(postId);
      }
    } else {
      localStore.bookmarks = localStore.bookmarks.filter((id) => id !== postId);
    }

    setLocalBookmarks(localStore);
    return { bookmarked: result.bookmarked };
  } catch (error) {
    // If backend fails, fall back to local only
    console.warn("Backend bookmark failed, using local storage:", error);

    if (isCurrentlyBooked) {
      localStore.bookmarks = localStore.bookmarks.filter((id) => id !== postId);
    } else {
      localStore.bookmarks.push(postId);
    }

    setLocalBookmarks(localStore);

    // Queue for sync when online
    queueBookmarkSync(postId, !isCurrentlyBooked ? "add" : "remove");

    return { bookmarked: !isCurrentlyBooked };
  }
};

export const isBookmarkedSync = async (postId: string): Promise<boolean> => {
  const localStore = getLocalBookmarks();

  try {
    // Check backend first
    const backendResult = await api.isBookmarked(postId);

    // Sync local state if mismatched
    const localIsBookmarked = localStore.bookmarks.includes(postId);
    if (backendResult !== localIsBookmarked) {
      if (backendResult) {
        if (!localStore.bookmarks.includes(postId)) {
          localStore.bookmarks.push(postId);
        }
      } else {
        localStore.bookmarks = localStore.bookmarks.filter(
          (id) => id !== postId,
        );
      }
      setLocalBookmarks(localStore);
    }

    return backendResult;
  } catch (error) {
    // If backend fails, use local state
    console.warn("Backend bookmark check failed, using local storage:", error);
    return localStore.bookmarks.includes(postId);
  }
};

// Offline queue for pending bookmark operations
const SYNC_QUEUE_KEY = "bookmarkSyncQueue";

interface SyncQueueItem {
  postId: string;
  action: "add" | "remove";
  timestamp: number;
}

export const getSyncQueue = (): SyncQueueItem[] => {
  try {
    const stored = localStorage.getItem(SYNC_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading sync queue:", error);
    return [];
  }
};

export const queueBookmarkSync = (
  postId: string,
  action: "add" | "remove",
): void => {
  try {
    const queue = getSyncQueue();
    const existingIndex = queue.findIndex((item) => item.postId === postId);

    if (existingIndex >= 0) {
      // Update existing item
      queue[existingIndex] = { postId, action, timestamp: Date.now() };
    } else {
      // Add new item
      queue.push({ postId, action, timestamp: Date.now() });
    }

    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error("Error queuing bookmark sync:", error);
  }
};

export const processSyncQueue = async (): Promise<void> => {
  try {
    const queue = getSyncQueue();

    for (const item of queue) {
      try {
        if (item.action === "add") {
          await api.create("bookmarks", { post: item.postId });
        } else {
          // Find and delete the bookmark
          const { docs } = await api.find<{ docs: Bookmark[] }>("bookmarks", {
            where: { post: { equals: item.postId } },
            limit: 1,
          });

          if (docs.length > 0) {
            await api.delete("bookmarks", docs[0].id);
          }
        }
      } catch (error) {
        console.error(
          `Failed to process queued bookmark sync for ${item.postId}:`,
          error,
        );
      }
    }

    // Clear the queue
    localStorage.removeItem(SYNC_QUEUE_KEY);
  } catch (error) {
    console.error("Error processing sync queue:", error);
  }
};

// Auto-sync on app start
export const initializeBookmarkSync = async (): Promise<void> => {
  try {
    // Process any pending sync operations
    await processSyncQueue();

    // Sync from backend to get latest state
    await syncBookmarksFromBackend();
  } catch (error) {
    console.error("Error initializing bookmark sync:", error);
    // Don't throw - app should still work with local bookmarks
  }
};

// Periodic sync (call this periodically, e.g., every 5 minutes)
export const periodicBookmarkSync = async (): Promise<void> => {
  const localStore = getLocalBookmarks();
  const now = Date.now();

  // Only sync if last sync was more than 5 minutes ago
  if (!localStore.lastSync || now - localStore.lastSync > 5 * 60 * 1000) {
    try {
      await syncBookmarksFromBackend();
    } catch (error) {
      console.error("Periodic bookmark sync failed:", error);
    }
  }
};
