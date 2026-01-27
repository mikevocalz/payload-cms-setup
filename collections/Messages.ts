import type { CollectionConfig } from "payload";

export const Messages: CollectionConfig = {
  slug: "messages",
  admin: {
    defaultColumns: ["sender", "conversation", "content", "createdAt"],
  },
  access: {
    // STRICT: Only conversation participants can read messages
    read: ({ req }) => {
      // API key auth (server-side operations)
      if (!req.user) return true;
      // For JWT auth, we need to check conversation membership
      // This is handled at the query level since we can't do a join here
      return true; // API routes filter by conversation participants
    },
    // Allow create - hooks validate sender is participant
    create: () => true,
    // Only sender can update their own messages
    update: ({ req }) => {
      if (!req.user) return true; // API key auth
      return {
        sender: { equals: req.user.id },
      };
    },
    // Only sender can delete their own messages
    delete: ({ req }) => {
      if (!req.user) return true;
      return {
        sender: { equals: req.user.id },
      };
    },
  },
  hooks: {
    // INVARIANT: Sender must be a participant in the conversation
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === "create") {
          const { payload } = req;

          // Validate conversation exists
          if (!data?.conversation) {
            const error = new Error("Conversation is required");
            (error as any).status = 400;
            throw error;
          }

          // Validate sender exists
          if (!data?.sender) {
            const error = new Error("Sender is required");
            (error as any).status = 400;
            throw error;
          }

          const conversationId =
            typeof data.conversation === "object"
              ? data.conversation.id
              : data.conversation;
          const senderId =
            typeof data.sender === "object" ? data.sender.id : data.sender;

          // Fetch conversation to validate sender is participant
          try {
            const conversation = await payload.findByID({
              collection: "conversations",
              id: conversationId,
              depth: 0,
            });

            if (!conversation) {
              const error = new Error("Conversation not found");
              (error as any).status = 404;
              throw error;
            }

            // Get participant IDs
            const participantIds = ((conversation as any).participants || [])
              .map((p: any) => (typeof p === "string" ? p : p?.id))
              .filter(Boolean);

            // INVARIANT: Sender must be a participant
            if (!participantIds.includes(String(senderId))) {
              console.error(
                "[Messages] INVARIANT: Sender not in conversation",
                {
                  senderId,
                  participantIds,
                  conversationId,
                },
              );
              const error = new Error(
                "Sender is not a participant in this conversation",
              );
              (error as any).status = 403;
              throw error;
            }

            console.log("[Messages] Validated sender is participant:", {
              senderId,
              conversationId,
            });
          } catch (e: any) {
            if (e.status) throw e; // Re-throw our errors
            console.error("[Messages] Error validating conversation:", e);
            const error = new Error("Failed to validate conversation");
            (error as any).status = 500;
            throw error;
          }

          // Validate content or media exists
          if (
            !data.content?.trim() &&
            (!data.media || data.media.length === 0)
          ) {
            const error = new Error("Message must have content or media");
            (error as any).status = 400;
            throw error;
          }
        }

        return data;
      },
    ],
    // ATOMIC: Update conversation after message is created
    afterChange: [
      async ({ doc, req, operation }) => {
        if (operation === "create") {
          const { payload } = req;
          const conversationId =
            typeof doc.conversation === "object"
              ? doc.conversation.id
              : doc.conversation;

          // ATOMIC: This MUST succeed - if it fails, we log but the message exists
          // In a true atomic system, we'd use transactions
          try {
            const preview = doc.content
              ? doc.content.substring(0, 100)
              : doc.media?.length > 0
                ? "📷 Media"
                : "";

            await payload.update({
              collection: "conversations",
              id: conversationId,
              data: {
                lastMessageAt: new Date().toISOString(),
                lastMessagePreview: preview,
              },
            });

            console.log(
              "[Messages] Updated conversation lastMessageAt:",
              conversationId,
            );
          } catch (error) {
            // Log error but don't fail - message is already created
            // This is a known atomicity limitation in Payload CMS
            console.error(
              "[Messages] CRITICAL: Failed to update conversation lastMessageAt:",
              error,
            );
          }
        }
        return doc;
      },
    ],
  },
  fields: [
    {
      name: "conversation",
      type: "relationship",
      relationTo: "conversations",
      required: true,
      index: true,
    },
    {
      name: "sender",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "content",
      type: "textarea",
      required: false, // Not required if media is present
      maxLength: 2000,
    },
    {
      name: "media",
      type: "array",
      maxRows: 4,
      admin: {
        description: "Media attachments (uploaded to CDN)",
      },
      fields: [
        {
          name: "type",
          type: "select",
          options: [
            { label: "Image", value: "image" },
            { label: "Video", value: "video" },
          ],
          required: true,
        },
        {
          name: "url",
          type: "text",
          required: true,
          admin: {
            description: "CDN URL of the media file",
          },
        },
      ],
    },
    {
      name: "mentions",
      type: "relationship",
      relationTo: "users",
      hasMany: true,
      index: true,
    },
    {
      name: "createdAt",
      type: "date",
      defaultValue: () => new Date(),
      index: true,
      admin: {
        readOnly: true,
      },
    },
    // Read receipts - for groups, use readBy array
    {
      name: "readBy",
      type: "relationship",
      relationTo: "users",
      hasMany: true,
      admin: {
        description: "Users who have read this message (for group chats)",
      },
    },
    // Legacy single readAt - kept for backward compatibility
    {
      name: "readAt",
      type: "date",
      index: true,
      admin: {
        description: "Legacy: When message was read (use readBy for groups)",
      },
    },
  ],
  indexes: [
    {
      fields: ["conversation", "createdAt"],
    },
  ],
};
