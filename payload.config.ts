import { postgresAdapter } from "@payloadcms/db-postgres"
import { lexicalEditor } from "@payloadcms/richtext-lexical"
import { buildConfig } from "payload"
import sharp from "sharp"
import { fileURLToPath } from "url"
import path from "path"
import { payloadRealTime } from "@alejotoro-o/payload-real-time"

// Core Identity & Access
import { Users } from "./collections/Users"
import { Profiles } from "./collections/Profiles"

// Social Graph
import { Follows } from "./collections/Follows"
import { Blocks } from "./collections/Blocks"

// Content System
import { Posts } from "./collections/Posts"
import { Stories } from "./collections/Stories"
import { Media } from "./collections/Media"
import { Comments } from "./collections/Comments"
import { Reactions } from "./collections/Reactions"
import { Hashtags } from "./collections/Hashtags"

// Tagging & Saves
import { Bookmarks } from "./collections/Bookmarks"
import { UserTags } from "./collections/UserTags"

// Realtime Messaging
import { Conversations } from "./collections/Conversations"
import { Messages } from "./collections/Messages"

// Realtime Notifications
import { Notifications } from "./collections/Notifications"

// Moderation & Safety
import { Reports } from "./collections/Reports"
import { ModerationActions } from "./collections/ModerationActions"
import { ContentFlags } from "./collections/ContentFlags"
import { DeviceBans } from "./collections/DeviceBans"

// Monetization
import { SubscriptionTiers } from "./collections/SubscriptionTiers"
import { Subscriptions } from "./collections/Subscriptions"
import { Transactions } from "./collections/Transactions"

// AI & Automation
import { AIProfiles } from "./collections/AIProfiles"
import { AIInteractions } from "./collections/AIInteractions"

// App Config
import { Settings } from "./collections/Settings"
import { FeatureFlags } from "./collections/FeatureFlags"

// Analytics
import { Events } from "./collections/Events"

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const config = buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  serverURL: process.env.PAYLOAD_SERVER_URL || "http://localhost:3000",
  collections: [
    // Core Identity & Access
    Users,
    Profiles,
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
    // Tagging & Saves
    Bookmarks,
    UserTags,
    // Realtime Messaging
    Conversations,
    Messages,
    // Realtime Notifications
    Notifications,
    // Moderation & Safety
    Reports,
    ModerationActions,
    ContentFlags,
    DeviceBans,
    // Monetization
    SubscriptionTiers,
    Subscriptions,
    Transactions,
    // AI & Automation
    AIProfiles,
    AIInteractions,
    // App Config
    Settings,
    FeatureFlags,
    // Analytics
    Events,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL || process.env.POSTGRES_URL,
    },
  }),
  sharp,
  plugins: [
    payloadRealTime({
      collections: {
        messages: {
          room: (doc: any) => {
            return doc.conversation ? `conversation:${doc.conversation}` : undefined
          },
          events: ["create", "update"],
        },
        notifications: {
          room: (doc: any) => {
            const recipient = doc.recipient
            const recipientId = typeof recipient === "number" ? recipient : recipient?.id
            return recipientId ? `user:${recipientId}` : undefined
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
})

export { config }
export default config
