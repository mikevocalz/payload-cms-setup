import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { buildConfig } from "payload";
import sharp from "sharp";
import { fileURLToPath } from "url";
import path from "path";
import { payloadRealTime } from "@alejotoro-o/payload-real-time";

// Core Identity & Access
import { Users } from "./collections/Users";
import { Profiles } from "./collections/Profiles";
import { Accounts } from "./collections/Accounts";

// Social Graph
import { Follows } from "./collections/Follows";
import { Blocks } from "./collections/Blocks";

// Content System
import { Posts } from "./collections/Posts";
import { Stories } from "./collections/Stories";
import { Media } from "./collections/Media";
import { Comments } from "./collections/Comments";
import { Reactions } from "./collections/Reactions";
import { Hashtags } from "./collections/Hashtags";
import { Likes } from "./collections/Likes";

// Tagging & Saves
import { Bookmarks } from "./collections/Bookmarks";
import { UserTags } from "./collections/UserTags";

// Realtime Messaging
import { Conversations } from "./collections/Conversations";
import { Messages } from "./collections/Messages";

// Realtime Notifications
import { Notifications } from "./collections/Notifications";
import { UserDevices } from "./collections/UserDevices";

// Moderation & Safety
import { Reports } from "./collections/Reports";
import { ModerationActions } from "./collections/ModerationActions";
import { ContentFlags } from "./collections/ContentFlags";
import { DeviceBans } from "./collections/DeviceBans";

// Monetization
import { SubscriptionTiers } from "./collections/SubscriptionTiers";
import { Subscriptions } from "./collections/Subscriptions";
import { Transactions } from "./collections/Transactions";

// App Config
import { Settings } from "./collections/Settings";
import { FeatureFlags } from "./collections/FeatureFlags";

// Analytics
import { Events } from "./collections/Events";
import { EventRsvps } from "./collections/EventRsvps";
import { StoryViews } from "./collections/StoryViews";
// NOTE: These collections are commented out until database tables are created via migration
// import { Tickets } from "./collections/Tickets";
// import { EventReviews } from "./collections/EventReviews";
// import { EventComments } from "./collections/EventComments";

// Website Template (Page Builder)
import { Pages } from "./collections/Pages";
import { Categories } from "./collections/Categories";
import { LegalPages } from "./collections/LegalPages";

// Custom Endpoints
import {
  followEndpoint,
  unfollowEndpoint,
  checkFollowEndpoint,
} from "./endpoints/follow";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const config = buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    theme: "dark",
    components: {
      providers: ["/components/admin/AdminStyleProvider"],
      beforeDashboard: ["/components/admin/dashboard/Dashboard"],
      graphics: {
        Logo: "/components/admin/ui/logo#Logo",
        Icon: "/components/admin/ui/logo#Logo",
      },
    },
  },
  serverURL: process.env.PAYLOAD_SERVER_URL || "http://localhost:3000",
  cors: [
    process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
    "http://localhost:8081", // Expo dev
    "http://localhost:19006", // Expo web
    "exp://localhost:8081", // Expo Go
    ...(process.env.EXPO_PUBLIC_API_URL
      ? [process.env.EXPO_PUBLIC_API_URL]
      : []),
  ],
  collections: [
    // Core Identity & Access
    Users,
    Profiles,
    Accounts,
    // Social Graph
    Follows,
    Blocks,
    // Content System
    Posts,
    Stories,
    Media,
    Comments,
    Reactions,
    Hashtags,
    Likes,
    // Tagging & Saves
    Bookmarks,
    UserTags,
    // Realtime Messaging
    Conversations,
    Messages,
    // Realtime Notifications
    Notifications,
    UserDevices,
    // Moderation & Safety
    Reports,
    ModerationActions,
    ContentFlags,
    DeviceBans,
    // Monetization
    SubscriptionTiers,
    Subscriptions,
    Transactions,
    // App Config
    Settings,
    FeatureFlags,
    // Analytics
    Events,
    EventRsvps,
    StoryViews,
    // NOTE: Tickets, EventReviews, EventComments removed until DB tables exist
    // Website Template (Page Builder)
    Pages,
    Categories,
    LegalPages,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  endpoints: [followEndpoint, unfollowEndpoint, checkFollowEndpoint],
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString:
        process.env.DATABASE_URI ||
        process.env.DATABASE_URL ||
        process.env.POSTGRES_URL,
      // Limit pool size for serverless (Supabase Session mode has limits)
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    },
    // Note: In production, schema must match via migrations or DB already synced
    // Disable push mode (default) and use migrations or pre-synced DB
    push: false,
  }),
  sharp,
  plugins: [
    payloadRealTime({
      collections: {
        messages: {
          room: (doc: any) => {
            return doc.conversation
              ? `conversation:${doc.conversation}`
              : undefined;
          },
          events: ["create", "update"],
        },
        notifications: {
          room: (doc: any) => {
            const recipient = doc.recipient;
            const recipientId =
              typeof recipient === "number" ? recipient : recipient?.id;
            return recipientId ? `user:${recipientId}` : undefined;
          },
          events: ["create"],
        },
      },
      serverOptions: {
        port: 3001,
        cors: {
          origin: [
            process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000",
            process.env.PAYLOAD_SERVER_URL || "http://localhost:3001",
          ],
          methods: ["GET", "POST"],
        },
      },
      requireAuth: true,
    }),
  ],
});

export { config };
export default config;
