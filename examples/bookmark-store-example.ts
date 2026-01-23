/**
 * Enhanced Bookmark Store Example
 * Shows how to integrate backend sync with existing local bookmark functionality
 */

import {
  toggleBookmarkSync,
  isBookmarkedSync,
  initializeBookmarkSync,
  periodicBookmarkSync,
  getLocalBookmarks,
} from "./bookmark-sync";

// Enhanced bookmark store with backend sync
class EnhancedBookmarkStore {
  private initialized = false;

  // Initialize the store when app starts
  async initialize() {
    if (this.initialized) return;

    try {
      await initializeBookmarkSync();
      this.initialized = true;
      console.log("Bookmark store initialized with backend sync");
    } catch (error) {
      console.error("Failed to initialize bookmark sync:", error);
      // Still allow local functionality
      this.initialized = true;
    }
  }

  // Toggle bookmark with sync
  async toggleBookmark(postId: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const result = await toggleBookmarkSync(postId);
      return result.bookmarked;
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
      // Fallback to local only
      const localStore = getLocalBookmarks();
      const isBookmarked = localStore.bookmarks.includes(postId);

      if (isBookmarked) {
        localStore.bookmarks = localStore.bookmarks.filter(
          (id) => id !== postId,
        );
      } else {
        localStore.bookmarks.push(postId);
      }

      localStorage.setItem("bookmarks", JSON.stringify(localStore));
      return !isBookmarked;
    }
  }

  // Check if post is bookmarked with sync
  async isBookmarked(postId: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      return await isBookmarkedSync(postId);
    } catch (error) {
      console.error("Failed to check bookmark status:", error);
      // Fallback to local only
      const localStore = getLocalBookmarks();
      return localStore.bookmarks.includes(postId);
    }
  }

  // Get all bookmarked posts (for "Saved" tab)
  async getBookmarkedPosts(): Promise<string[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const localStore = getLocalBookmarks();
    return localStore.bookmarks;
  }

  // Periodic sync (call this every 5 minutes or when app becomes active)
  async sync() {
    if (!this.initialized) return;

    try {
      await periodicBookmarkSync();
    } catch (error) {
      console.error("Periodic sync failed:", error);
    }
  }
}

// Export singleton instance
export const bookmarkStore = new EnhancedBookmarkStore();

// Usage in React components:
/*
import React, { useState, useEffect } from 'react';
import { bookmarkStore } from './bookmark-store-example';

const PostCard = ({ post }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check bookmark status when component mounts
    bookmarkStore.isBookmarked(post.id).then(setIsBookmarked);
  }, [post.id]);

  const handleToggleBookmark = async () => {
    setLoading(true);
    try {
      const newBookmarkState = await bookmarkStore.toggleBookmark(post.id);
      setIsBookmarked(newBookmarkState);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>{post.title}</h3>
      <button 
        onClick={handleToggleBookmark}
        disabled={loading}
      >
        {loading ? '...' : isBookmarked ? '❤️' : '🤍'}
      </button>
    </div>
  );
};

// App initialization:
import { bookmarkStore } from './bookmark-store-example';

// In your main App component or app entry point:
useEffect(() => {
  bookmarkStore.initialize();
  
  // Set up periodic sync
  const syncInterval = setInterval(() => {
    bookmarkStore.sync();
  }, 5 * 60 * 1000); // Every 5 minutes

  // Sync when app becomes active (for mobile apps)
  const handleAppStateChange = (nextAppState) => {
    if (nextAppState === 'active') {
      bookmarkStore.sync();
    }
  };

  // For React Native:
  // AppState.addEventListener('change', handleAppStateChange);

  // For web:
  // document.addEventListener('visibilitychange', () => {
  //   if (!document.hidden) {
  //     bookmarkStore.sync();
  //   }
  // });

  return () => {
    clearInterval(syncInterval);
    // Clean up event listeners
  };
}, []);

// Saved posts screen:
const SavedPostsScreen = () => {
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavedPosts = async () => {
      try {
        const bookmarkedIds = await bookmarkStore.getBookmarkedPosts();
        
        // Fetch full post data for each bookmarked ID
        const posts = await Promise.all(
          bookmarkedIds.map(async (postId) => {
            // Use your existing API to fetch post details
            return await api.findById('posts', postId);
          })
        );
        
        setBookmarkedPosts(posts);
      } catch (error) {
        console.error('Failed to load saved posts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSavedPosts();
  }, []);

  if (loading) return <div>Loading saved posts...</div>;

  return (
    <div>
      <h2>Saved Posts</h2>
      {bookmarkedPosts.length === 0 ? (
        <p>No saved posts yet</p>
      ) : (
        bookmarkedPosts.map(post => (
          <PostCard key={post.id} post={post} />
        ))
      )}
    </div>
  );
};
*/
