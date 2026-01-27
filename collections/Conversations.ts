import type { CollectionConfig } from "payload";

export const Conversations: CollectionConfig = {
  slug: "conversations",
  admin: {
    useAsTitle: "id",
    defaultColumns: ["participants", "type", "lastMessageAt", "createdAt"],
  },
  access: {
    // STRICT: Only participants can read their conversations
    read: ({ req }) => {
      if (!req.user) return true; // API key auth (server-side)
      return {
        participants: { contains: req.user.id },
      };
    },
    // Allow create - hooks validate participants
    create: () => true,
    // Only participants can update
    update: ({ req }) => {
      if (!req.user) return true; // API key auth
      return {
        participants: { contains: req.user.id },
      };
    },
    // Only participants can delete
    delete: ({ req }) => {
      if (!req.user) return true; // API key auth
      return {
        participants: { contains: req.user.id },
      };
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === "create") {
          const { payload } = req;

          // INVARIANT 1: Participants must exist and be valid
          if (
            !data?.participants ||
            !Array.isArray(data.participants) ||
            data.participants.length < 2
          ) {
            const error = new Error(
              "Conversation requires at least 2 participants",
            );
            (error as any).status = 400;
            throw error;
          }

          // Normalize participant IDs
          const participantIds = data.participants
            .map((p: any) => (typeof p === "object" ? p.id : p))
            .filter(Boolean);

          // INVARIANT 2: No duplicate participants
          const uniqueIds = [...new Set(participantIds)];
          if (uniqueIds.length !== participantIds.length) {
            const error = new Error("Duplicate participants not allowed");
            (error as any).status = 400;
            throw error;
          }

          // Determine conversation type
          const isGroup = data.isGroup === true || uniqueIds.length > 2;

          // INVARIANT 3: Direct conversations must have exactly 2 participants
          if (!isGroup && uniqueIds.length !== 2) {
            const error = new Error(
              "Direct conversations must have exactly 2 participants",
            );
            (error as any).status = 400;
            throw error;
          }

          // INVARIANT 4: Group conversations must have 3+ participants
          if (isGroup && uniqueIds.length < 3) {
            const error = new Error(
              "Group conversations require at least 3 participants",
            );
            (error as any).status = 400;
            throw error;
          }

          // INVARIANT 5: Prevent duplicate direct conversations (same 2 users)
          if (!isGroup) {
            const [user1, user2] = uniqueIds.sort(); // Sort for consistent lookup

            const existingConversation = await payload.find({
              collection: "conversations",
              where: {
                and: [
                  { isGroup: { equals: false } },
                  { participants: { contains: user1 } },
                  { participants: { contains: user2 } },
                ],
              },
              limit: 1,
            });

            if (existingConversation.docs.length > 0) {
              console.log(
                "[Conversations] INVARIANT: Duplicate direct conversation prevented",
              );
              const error = new Error(
                "Conversation already exists between these users",
              );
              (error as any).status = 409;
              (error as any).existingId = existingConversation.docs[0].id;
              throw error;
            }
          }

          // Set normalized data
          data.participants = uniqueIds;
          data.isGroup = isGroup;

          console.log("[Conversations] Creating:", {
            participantCount: uniqueIds.length,
            isGroup: data.isGroup,
          });
        }

        return data;
      },
    ],
  },
  fields: [
    {
      name: "participants",
      type: "relationship",
      relationTo: "users",
      hasMany: true,
      required: true,
      index: true,
    },
    {
      name: "isGroup",
      type: "checkbox",
      defaultValue: false,
    },
    {
      name: "groupName",
      type: "text",
      maxLength: 100,
      admin: {
        condition: (data) => data?.isGroup === true,
      },
    },
    {
      name: "lastMessageAt",
      type: "date",
      index: true,
    },
    {
      name: "createdAt",
      type: "date",
      defaultValue: () => new Date(),
      admin: {
        readOnly: true,
      },
    },
    // NOTE: New fields below require DB migration before uncommenting
    // {
    //   name: "type",
    //   type: "select",
    //   defaultValue: "direct",
    //   options: [
    //     { label: "Direct", value: "direct" },
    //     { label: "Group", value: "group" },
    //   ],
    //   index: true,
    // },
    // {
    //   name: "createdBy",
    //   type: "relationship",
    //   relationTo: "users",
    // },
    // {
    //   name: "lastMessagePreview",
    //   type: "text",
    //   maxLength: 100,
    // },
  ],
  // NOTE: Compound indexes removed - individual field indexes are sufficient
  // and compound indexes require DB migration
};
