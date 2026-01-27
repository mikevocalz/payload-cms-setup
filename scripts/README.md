# Production Scripts

## cleanup-production-data.ts

**Purpose:** Safe cleanup of bad data caused by missing server-side invariants.

### Safety Features
- ✅ **Idempotent** - Safe to run multiple times
- ✅ **DRY_RUN mode** - Preview changes before executing
- ✅ **Batched** - Processes data in batches to avoid memory issues
- ✅ **Logged** - Full summary report at the end
- ✅ **No media deletion** - Never deletes files from Bunny CDN

### What It Cleans

| Task | Action |
|------|--------|
| Duplicate likes | Keeps oldest, deletes rest |
| Duplicate bookmarks | Keeps oldest, deletes rest |
| Duplicate follows | Keeps oldest, deletes rest |
| Self-follows | Deletes (user following themselves) |
| Stories missing expiresAt | Sets expiresAt = createdAt + 24h |
| Posts with missing author | Reports only (no deletion) |
| Comment depth violations | Reports only (manual review) |
| Count drift | Recomputes likesCount, followersCount, followingCount |

### Prerequisites

```bash
# Required environment variables
PAYLOAD_SECRET=your_secret
DATABASE_URI=postgres://...  # or DATABASE_URL or POSTGRES_URL
```

### How to Run

```bash
cd /Users/mikevocalz/Downloads/payload-cms-setup

# 1. ALWAYS run dry-run first
DRY_RUN=1 npx tsx scripts/cleanup-production-data.ts

# 2. Review output carefully

# 3. Execute if satisfied
DRY_RUN=0 npx tsx scripts/cleanup-production-data.ts
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DRY_RUN` | `1` | Set to `0` to execute changes |
| `BATCH_SIZE` | `100` | Records per batch |

### After Running

Verify these endpoints work correctly:

- [ ] `GET /api/posts` - Feed loads
- [ ] `GET /api/posts/:id` - Post detail loads
- [ ] `POST /api/posts/:id/like` - Like works (idempotent)
- [ ] `POST /api/posts/:id/bookmark` - Bookmark works (idempotent)
- [ ] `POST /api/users/follow` - Follow works (idempotent, blocks self-follow)
- [ ] `GET /api/stories` - Only non-expired stories returned
- [ ] `GET /api/comments` - Comments load with threading
- [ ] `POST /api/comments` - Reply-to-reply blocked (409)

### Troubleshooting

**"Missing PAYLOAD_SECRET"**
```bash
export PAYLOAD_SECRET=your_payload_secret
```

**"Missing database connection"**
```bash
export DATABASE_URI=postgres://user:pass@host:5432/dbname
```

**Script hangs**
- Check database connection
- Reduce BATCH_SIZE if memory issues

---

## SQL Migrations (if needed)

If the Comments `parent` field causes issues, add the column first:

```sql
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES comments(id);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;
```

If unique indexes don't exist:

```sql
-- Likes: unique (user, post)
CREATE UNIQUE INDEX IF NOT EXISTS likes_user_post_unique ON likes(user_id, post_id);

-- Bookmarks: unique (user, post)
CREATE UNIQUE INDEX IF NOT EXISTS bookmarks_user_post_unique ON bookmarks(user_id, post_id);

-- Follows: unique (follower, following)
CREATE UNIQUE INDEX IF NOT EXISTS follows_follower_following_unique ON follows(follower_id, following_id);
```
