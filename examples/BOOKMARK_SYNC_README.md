# Bookmark Sync Implementation Guide

This guide shows how to enhance your existing local bookmark system with backend synchronization using Payload CMS.

## Overview

Your current bookmark system:

- ✅ Local storage persistence
- ✅ `toggleBookmark` and `isBookmarked` functions
- ✅ Works in feed posts and post detail screens
- ✅ "Saved" tab in profile

Enhanced system adds:

- 🔄 Backend synchronization across devices
- 🔄 Offline support with sync queue
- 🔄 Automatic conflict resolution
- 🔄 Periodic sync and app lifecycle integration

## Files Created

1. **`expo-api-client.ts`** - Enhanced with bookmark API methods
2. **`bookmark-sync.ts`** - Core sync logic and offline queue
3. **`bookmark-store-example.ts`** - Example implementation
4. **`BOOKMARK_SYNC_README.md`** - This guide

## Implementation Steps

### 1. Update API Client

Your `expo-api-client.ts` now includes:

```typescript
// New bookmark methods
async getBookmarks(query?: {...}) -> Promise<BookmarkResponse>
async toggleBookmark(postId: string) -> Promise<{bookmarked: boolean}>
async isBookmarked(postId: string) -> Promise<boolean>
```

### 2. Replace Local Bookmark Functions

Replace your current bookmark functions with sync-enabled versions:

```typescript
// Before (local only)
const toggleBookmark = (postId: string) => {
  const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
  // ... local logic
};

// After (with sync)
import { bookmarkStore } from "./bookmark-store-example";

const toggleBookmark = async (postId: string) => {
  return await bookmarkStore.toggleBookmark(postId);
};
```

### 3. Initialize in Your App

Add this to your app entry point:

```typescript
import { bookmarkStore } from "./bookmark-store-example";

// App initialization
useEffect(() => {
  bookmarkStore.initialize();

  // Periodic sync every 5 minutes
  const syncInterval = setInterval(
    () => {
      bookmarkStore.sync();
    },
    5 * 60 * 1000,
  );

  // Sync when app becomes active
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      bookmarkStore.sync();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    clearInterval(syncInterval);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}, []);
```

### 4. Update React Components

#### Post Card Component

```typescript
const PostCard = ({ post }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
      <button onClick={handleToggleBookmark} disabled={loading}>
        {loading ? '...' : isBookmarked ? '❤️' : '🤍'}
      </button>
    </div>
  );
};
```

#### Saved Posts Screen

```typescript
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
```

## How It Works

### Sync Strategy

1. **Primary Backend**: Always try backend operations first
2. **Local Fallback**: If backend fails, use local storage
3. **Sync Queue**: Queue failed operations for later sync
4. **Conflict Resolution**: Backend state takes precedence

### Offline Support

- Bookmarks work offline using local storage
- Failed operations are queued automatically
- Queue is processed when connection is restored
- Periodic sync ensures data consistency

### Data Flow

```
User Action → Try Backend → Success? → Update Local
                    ↓
                 Failure → Local Only → Queue for Sync
```

## Migration from Local Only

### Data Migration

Your existing local bookmarks will automatically sync to the backend when:

1. App initializes (`initializeBookmarkSync`)
2. User toggles a bookmark
3. Periodic sync runs

### API Compatibility

The sync functions maintain the same interface as your local functions:

```typescript
// Before
toggleBookmark(postId: string): void
isBookmarked(postId: string): boolean

// After (async)
toggleBookmark(postId: string): Promise<boolean>
isBookmarked(postId: string): Promise<boolean>
```

## Error Handling

### Network Errors

- Automatic fallback to local storage
- Operations queued for later sync
- User sees immediate feedback

### Sync Conflicts

- Backend state always wins
- Local state updated to match backend
- No data loss, just temporary inconsistency

### Storage Errors

- Graceful degradation
- Console logging for debugging
- App continues functioning

## Performance Considerations

### Local First

- Instant UI updates from local storage
- Background sync doesn't block UI
- Optimistic updates for better UX

### Batch Operations

- Sync queue processes items in batches
- Debounced periodic sync
- Efficient API usage

### Memory Management

- Local storage size limits considered
- Sync queue cleanup
- Periodic cleanup of old data

## Testing

### Test Scenarios

1. **Online Mode**: Full sync functionality
2. **Offline Mode**: Local storage fallback
3. **Network Changes**: Sync queue processing
4. **Multi-device**: Cross-device synchronization
5. **Edge Cases**: Storage limits, API errors

### Test Code

```typescript
// Test offline functionality
const testOfflineBookmarks = async () => {
  // Simulate offline
  global.navigator = { onLine: false };

  // Toggle bookmark (should work locally)
  const result = await bookmarkStore.toggleBookmark("post-123");
  console.log("Offline bookmark result:", result);

  // Simulate back online
  global.navigator = { onLine: true };

  // Process sync queue
  await bookmarkStore.sync();
};
```

## Troubleshooting

### Common Issues

1. **TypeScript Errors**: Ensure proper types are imported
2. **Sync Not Working**: Check API authentication
3. **Local Storage Full**: Implement cleanup strategy
4. **Performance Issues**: Optimize sync frequency

### Debug Mode

Enable debug logging:

```typescript
// In bookmark-sync.ts
const DEBUG = true;

const debugLog = (message: string, data?: any) => {
  if (DEBUG) {
    console.log("[BookmarkSync]", message, data);
  }
};
```

## Next Steps

1. **Integration**: Replace your current bookmark functions
2. **Testing**: Test offline/online scenarios
3. **Monitoring**: Add analytics for sync success rates
4. **Optimization**: Tune sync frequency based on usage

## Support

If you encounter issues:

1. Check browser console for errors
2. Verify API authentication
3. Test network connectivity
4. Check local storage availability

The bookmark sync system is designed to be robust and provide a seamless experience even with network issues.
