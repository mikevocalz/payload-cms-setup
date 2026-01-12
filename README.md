# Social Network - Payload CMS with Better Auth

A modern social network built with Payload CMS, Next.js, Supabase PostgreSQL, and Better Auth using the official `@payload-auth/better-auth-plugin`.

## Architecture

This is a **headless CMS architecture** with separate deployments:

### Development
- **Frontend/User App**: `http://localhost:3000` - Next.js app with Better Auth
- **Admin CMS**: `http://localhost:3001` - Payload CMS admin dashboard

### Production
- **Frontend**: `https://example.com` (or `https://app.example.com`) - User-facing Next.js app
- **Admin CMS**: `https://admin.example.com` - Payload CMS admin panel (separate Vercel deployment)

Both applications connect to the same Supabase PostgreSQL database and share user data via Better Auth integration.

## Features

- **User Management**: Profile creation, editing, and management
- **Posts**: Create, edit, delete posts with media support
- **Comments**: Threaded comments on posts
- **Likes**: Like posts and comments
- **Follows**: Follow other users to see their content
- **Media Management**: Upload and manage images
- **Authentication**: Secure authentication with Better Auth integrated via official plugin
- **Account Linking**: Merge Google and Apple OAuth accounts with email/password login
- **Real-time Chat**: WebSocket-powered real-time messaging and notifications
- **Notifications**: Real-time notification system
- **Direct Messages**: Private conversations between users
- **Hashtags**: Content discovery via hashtags
- **Bookmarks**: Save posts for later
- **Database**: PostgreSQL via Supabase

## Collections

### Users
- Username, display name, bio
- Avatar and cover image
- Location, website
- Verified badge
- Followers/following/posts counts
- Linked to Better Auth user via betterAuthId

### Posts
- Content (up to 5000 characters)
- Media attachments (up to 4 images)
- Likes, comments, reposts counts
- Repost and reply functionality
- Hashtag extraction and linking

### Comments
- Thread-able comments
- Likes support
- Parent comment references

### Likes
- User can like posts or comments
- Unique constraints prevent duplicate likes

### Follows
- Follow relationships between users
- Unique constraints prevent duplicate follows

### Media
- Image uploads with automatic resizing
- Thumbnail, card, and tablet sizes
- Alt text support

### Notifications
- Real-time notifications for likes, comments, follows, mentions
- Unread status tracking
- Type-based filtering

### Messages
- Direct messaging between users
- Conversation grouping
- Media attachments support
- Read status tracking
- Real-time delivery via WebSockets

### Hashtags
- Automatic hashtag extraction from posts
- Usage count tracking
- Trending hashtag support

### Bookmarks
- Save posts for later viewing
- User-specific collections

## Environment Setup

### Required Environment Variables

You need to set the following environment variables in the **Vars section** of the in-chat sidebar:

1. **PAYLOAD_SECRET** - Generate with: `openssl rand -base64 32`
2. **BETTER_AUTH_SECRET** - Generate with: `openssl rand -base64 32`
3. **NEXT_PUBLIC_APP_URL** - Your app URL (e.g., `http://localhost:3000` for dev)
4. **BETTER_AUTH_URL** - Same as your app URL
5. **NEXT_PUBLIC_SERVER_URL** - Your frontend URL (e.g., `http://localhost:3000` for dev, `https://example.com` for prod)
6. **PAYLOAD_SERVER_URL** - Your admin CMS URL (e.g., `http://localhost:3001` for dev, `https://admin.example.com` for prod)
7. **NEXT_PUBLIC_REALTIME_URL** - WebSocket server URL (same as `PAYLOAD_SERVER_URL`)
8. **NEXT_PUBLIC_BETTER_AUTH_URL** - Better Auth base URL (same as `NEXT_PUBLIC_SERVER_URL`)
9. **ADMIN_EMAIL** - Admin email (default: admin@example.com)
10. **ADMIN_PASSWORD** - Admin password (default: change-this-password)
11. **ADMIN_USERNAME** - Admin username (default: admin)

### OAuth Providers (Optional)

To enable Google and Apple sign-in with account linking:

12. **GOOGLE_CLIENT_ID** - OAuth client ID from Google Cloud Console
13. **GOOGLE_CLIENT_SECRET** - OAuth client secret from Google
14. **GOOGLE_REDIRECT_URI** - OAuth redirect URI (e.g., `http://localhost:3000/api/auth/callback/google`)
15. **APPLE_CLIENT_ID** - Apple Services ID
16. **APPLE_CLIENT_SECRET** - Apple client secret (generated from private key)
17. **APPLE_REDIRECT_URI** - OAuth redirect URI (e.g., `http://localhost:3000/api/auth/callback/apple`)

The Supabase database credentials are automatically provided via the Supabase integration.

### Development
1. Ensure all environment variables are set in the Vars section
2. The `.env.local` file shows what variables are needed

### Production Deployment

#### Frontend (example.com)
1. Deploy Next.js app to Vercel
2. Set environment variables:
   - `NEXT_PUBLIC_SERVER_URL=https://example.com`
   - `PAYLOAD_SERVER_URL=https://admin.example.com`
   - `NEXT_PUBLIC_REALTIME_URL=https://admin.example.com`
   - `NEXT_PUBLIC_BETTER_AUTH_URL=https://example.com`
   - Plus all other required variables

#### Admin CMS (admin.example.com)
1. Deploy Payload CMS to separate Vercel project
2. Configure custom domain `admin.example.com`
3. Set same database credentials
4. Set `PAYLOAD_SERVER_URL=https://admin.example.com`

Both deployments share the same Supabase database but serve different purposes.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Generate Payload types:
```bash
npm run generate:types
```

3. Create initial admin user:
```bash
npm run seed:admin
```

This will create an admin user using the credentials from your environment variables:
- `ADMIN_EMAIL` (default: admin@example.com)
- `ADMIN_PASSWORD` (default: change-this-password)
- `ADMIN_USERNAME` (default: admin)

Make sure to change these values in your `.env.local` file before running the seed script!

4. Start development server:
```bash
npm run dev
```

5. Access Payload admin at `http://localhost:3001/admin`
6. Login with your admin credentials
7. Access Better Auth endpoints at `http://localhost:3000/api/auth/*`
8. WebSocket server runs automatically on port 3001

## Real-time Features

This project uses the `@alejotoro-o/payload-real-time` plugin for WebSocket-powered real-time updates.

### How It Works

1. **WebSocket Server**: Runs on port 3001 (configurable)
2. **Authentication**: Requires JWT token for secure connections
3. **Rooms**: Events are scoped to specific rooms (conversations, users)
4. **Collections**: Messages and Notifications emit real-time events

### Client-Side Usage

Two custom hooks are provided for real-time functionality:

#### `useRealtimeMessages`
Subscribe to real-time messages in a conversation:

```typescript
import { useRealtimeMessages } from "@/hooks/use-realtime-messages"

const messages = useRealtimeMessages(userId, conversationId, token)
```

#### `useRealtimeNotifications`
Subscribe to real-time notifications for a user:

```typescript
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications"

const notifications = useRealtimeNotifications(userId, token)
```

### Custom Events

You can also emit and listen to custom events:

```typescript
import { getRealtimeClient } from "@/lib/realtime-client"

const client = getRealtimeClient(token)

// Join a room
client.join("chat:abc123")

// Listen for events
client.on("typing", (data) => {
  console.log("User is typing:", data)
})

// Emit events
client.emit("typing", { roomId: "chat:abc123", userId: "user123" })
```

## Database Migrations

The database schema is automatically managed by Payload CMS and Better Auth. On first run, both will create their necessary tables in your Supabase PostgreSQL database.

## Authentication Flow

1. User signs up via Better Auth (email/password or OAuth)
2. Better Auth creates authentication record
3. User profile automatically created in Payload CMS with betterAuthId link
4. Session managed via Better Auth cookies
5. User can access both Better Auth endpoints and Payload CMS features

### Account Linking

Users can link their Google or Apple accounts to their existing email/password account:

1. User logs in with email/password
2. User navigates to account settings
3. User clicks "Link Google" or "Link Apple"
4. OAuth flow completes and accounts are merged
5. User can now sign in with either method using the same profile

Use the `AccountLinking` component in your settings page:

```tsx
import { AccountLinking } from "@/components/account-linking"

export default function SettingsPage() {
  return (
    <div>
      <h1>Account Settings</h1>
      <AccountLinking />
    </div>
  )
}
```

The Better Auth `accountLinking` feature automatically merges accounts when:
- A user signs in with Google/Apple using an email that already exists
- A logged-in user explicitly links a social account
- Trusted providers (Google, Apple) are configured in the auth settings

## Plugin Integration

This project uses:
- **@payload-auth/better-auth-plugin**: Integrates Better Auth directly into Payload CMS
- **@alejotoro-o/payload-real-time**: Provides WebSocket-based real-time events for collections
- **Better Auth Account Linking**: Automatic account merging for OAuth providers

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/[...all]/           # Better Auth routes
│   │   ├── feed/                    # User feed endpoint
│   │   ├── search/                  # Search endpoints
│   │   ├── trending/                # Trending content
│   │   ├── notifications/           # Notifications API
│   │   └── conversations/           # Conversations API
│   ├── auth/
│   │   ├── login/                   # Login page
│   │   └── signup/                  # Signup page
│   ├── layout.tsx
│   └── page.tsx
├── collections/                     # Payload CMS collections
│   ├── Users.ts
│   ├── Posts.ts
│   ├── Comments.ts
│   ├── Likes.ts
│   ├── Follows.ts
│   ├── Media.ts
│   ├── Accounts.ts
│   ├── Notifications.ts
│   ├── Messages.ts
│   ├── Hashtags.ts
│   └── Bookmarks.ts
├── hooks/                           # React hooks
│   ├── use-realtime-messages.tsx   # Real-time messages
│   └── use-realtime-notifications.tsx # Real-time notifications
├── lib/
│   ├── auth.ts                      # Better Auth server config
│   ├── auth-client.ts               # Better Auth client
│   ├── payload.ts                   # Payload instance helper
│   └── realtime-client.ts           # WebSocket client helper
├── scripts/
│   └── seed-admin.ts                # Admin user seed script
├── payload.config.ts                # Payload + plugins config
└── package.json
```

## Next Steps

1. Customize the Users collection fields as needed
2. Configure Google and Apple OAuth credentials for social sign-in
3. Implement Row Level Security (RLS) policies in Supabase
4. Add two-factor authentication via Better Auth plugin
5. Create feed and profile pages with the AccountLinking component
6. Implement typing indicators for chat
7. Add push notifications support
8. Create hashtag trending algorithm
