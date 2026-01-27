# Payload CMS Collection Audit

**Date:** January 2026  
**Purpose:** Line-by-line audit for server-side invariant enforcement

---

## Summary

| Collection | Status | Issues Fixed |
|------------|--------|--------------|
| Users | ✅ OK | Duplicate email/username prevented |
| Posts | ⚠️ Partial | author not required (legacy data) |
| Comments | ✅ Fixed | Added parent field + depth validation |
| Likes | ✅ OK | Duplicate prevention + unique index |
| Bookmarks | ✅ Fixed | Added beforeChange hook |
| Follows | ✅ Fixed | Added self-follow + duplicate prevention |
| Stories | ✅ OK | expiresAt with default |
| Media | ✅ OK | Basic upload config |
| Messages | ✅ OK | Conversation validation |
| Notifications | ✅ OK | Recipient filtering |

---

## Detailed Audit

### 1. Users (`collections/Users.ts`)

**Fields:**
- `username` (text, required, unique, indexed)
- `email` (email, required, unique, indexed)
- `avatar` (upload → media)
- `likedPosts` (relationship → posts, hasMany) - LEGACY
- `bookmarkedPosts` (relationship → posts, hasMany) - LEGACY
- `followersCount`, `followingCount`, `postsCount` (numbers)

**Access:**
- read: `() => true` (public)
- create: `() => true` (registration)
- update: Own profile or API key
- delete: Admin only

**Hooks:**
- `beforeValidate`: Checks duplicate email/username on create

**Known Risks:**
- ⚠️ `likedPosts`/`bookmarkedPosts` arrays are legacy - use `likes`/`bookmarks` collections instead
- ⚠️ No DOB/age field for 18+ validation (handled at app layer)

**Recommendation:** Keep as-is. Age validation at API route level.

---

### 2. Posts (`collections/Posts.ts`)

**Fields:**
- `author` (relationship → users, **not required**)
- `externalAuthorId` (text, indexed)
- `content` (textarea, max 5000)
- `media` (array of type/url/image)
- `likesCount`, `commentsCount`, `repostsCount`, `bookmarksCount`

**Access:**
- read: `() => true`
- create: `() => true`
- update/delete: Author only

**Hooks:**
- `afterChange`: Updates postsCount, creates hashtags

**Known Risks:**
- ⚠️ `author` not required - legacy data may have missing author
- ⚠️ afterChange swallows errors (logs but doesn't throw)

**Recommendation:** Keep author optional for backward compatibility. Cleanup script reports missing authors.

---

### 3. Comments (`collections/Comments.ts`)

**Fields:**
- `author` (relationship → users, required)
- `post` (relationship → posts, required, indexed)
- `content` (textarea, required, max 1000)
- `parent` (relationship → comments, optional) - **ADDED**
- `likesCount` (number) - **ADDED**

**Access:**
- read: `() => true`
- create: `() => true`
- update/delete: Authenticated users

**Hooks:**
- `beforeChange`: Auto-set author, **enforce 2-level depth** ✅
- `afterChange`: Update post commentsCount

**Fixed Issues:**
- ✅ Added `parent` field for threading
- ✅ Added depth validation (reply-to-reply blocked with 409)
- ✅ Added `likesCount` field

---

### 4. Likes (`collections/Likes.ts`)

**Fields:**
- `user` (relationship → users, required, indexed)
- `post` (relationship → posts, indexed)
- `comment` (relationship → comments, indexed)

**Indexes:**
- `["user", "post"]` unique ✅

**Hooks:**
- `beforeChange`: **Duplicate prevention** ✅
- `afterChange`: Update likesCount, create notification
- `afterDelete`: Decrement likesCount

**Status:** ✅ Correctly implemented

---

### 5. Bookmarks (`collections/Bookmarks.ts`)

**Fields:**
- `user` (relationship → users, required, indexed)
- `post` (relationship → posts, required, indexed)

**Indexes:**
- `["user", "post"]` unique ✅

**Access:**
- read: Owner only ✅
- create/delete: `() => true`

**Hooks:**
- `beforeChange`: **Duplicate prevention** ✅ ADDED

**Fixed Issues:**
- ✅ Added beforeChange hook to enforce uniqueness at application layer

---

### 6. Follows (`collections/Follows.ts`)

**Fields:**
- `follower` (relationship → users, required, indexed)
- `following` (relationship → users, required, indexed)

**Indexes:**
- `["follower", "following"]` unique ✅

**Hooks:**
- `beforeChange`: **Self-follow + duplicate prevention** ✅ ADDED
- `afterChange`: Update followersCount/followingCount, create notification
- `afterDelete`: Decrement counts

**Fixed Issues:**
- ✅ Added self-follow prevention (409 error)
- ✅ Added duplicate follow prevention (409 error)

---

### 7. Stories (`collections/Stories.ts`)

**Fields:**
- `author` (relationship → users, required)
- `media` (upload → media)
- `items` (array of type/url)
- `expiresAt` (date, required, default: +24h) ✅
- `viewCount` (number)

**Access:**
- read: `() => true`
- update/delete: Author only

**Status:** ✅ Correctly implemented with expiresAt default

---

### 8. Media (`collections/Media.ts`)

**Fields:**
- `alt` (text)
- `type` (select: image/video/audio)
- `owner` (relationship → users)
- `blurhash` (text)
- `nsfwScore` (number)

**Upload Config:**
- mimeTypes: image/*, video/*, audio/*
- imageSizes: thumbnail, card, tablet

**Status:** ✅ Basic config OK

---

### 9. Messages (`collections/Messages.ts`)

**Fields:**
- `conversation` (relationship → conversations, required)
- `sender` (relationship → users, required)
- `content` (textarea, required, max 2000)
- `media` (array)
- `readAt` (date)

**Hooks:**
- `afterChange`: Update conversation lastMessageAt

**Status:** ✅ OK

---

### 10. Notifications (`collections/Notifications.ts`)

**Fields:**
- `recipient` (relationship → users, required)
- `type` (select: follow/like/comment/mention/tag/system)
- `actor` (relationship → users)
- `entityType`, `entityId`
- `readAt` (date)

**Access:**
- read: Recipient only (with API key bypass)

**Status:** ✅ OK

---

## Files Changed

| File | Change |
|------|--------|
| `collections/Bookmarks.ts` | Added beforeChange hook for duplicate prevention |
| `collections/Follows.ts` | Added beforeChange hook for self-follow + duplicate prevention |
| `collections/Comments.ts` | Uncommented parent + likesCount fields, added depth validation |
| `scripts/cleanup-production-data.ts` | NEW: Production data cleanup script |
| `scripts/README.md` | NEW: Script documentation |

---

## Required Database Migrations

Before deploying, ensure these columns exist:

```sql
-- Comments threading
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES comments(id);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Unique indexes (if not auto-created by Payload)
CREATE UNIQUE INDEX IF NOT EXISTS likes_user_post_unique 
  ON likes(user_id, post_id) WHERE post_id IS NOT NULL;
  
CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_user_post_unique 
  ON bookmarks(user_id, post_id);
  
CREATE UNIQUE INDEX IF NOT EXISTS follows_follower_following_unique 
  ON follows(follower_id, following_id);
```

---

## Verification Checklist

After deploying changes:

- [ ] Like same post twice → 409 error (not duplicate record)
- [ ] Bookmark same post twice → 409 error
- [ ] Follow same user twice → 409 error
- [ ] Self-follow → 409 error
- [ ] Reply to reply → 409 error
- [ ] Stories without expiresAt → not returned in list
- [ ] Counts match actual join records

---

## Next Steps

1. Run database migrations (if needed)
2. Deploy Payload CMS changes
3. Run cleanup script: `DRY_RUN=1 npx tsx scripts/cleanup-production-data.ts`
4. Execute cleanup: `DRY_RUN=0 npx tsx scripts/cleanup-production-data.ts`
5. Verify endpoints with checklist
6. Re-enable frontend optimistic updates (incrementally)
