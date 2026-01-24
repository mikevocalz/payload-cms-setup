import type { CollectionConfig } from "payload"

export const Users: CollectionConfig = {
  slug: "users",
  admin: {
    useAsTitle: "email",
  },
  auth: {
    depth: 2,
    useAPIKey: true,
    tokenExpiration: 60 * 60 * 24 * 30, // 30 days
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        // Check for duplicate email on create
        if (operation === "create" && data?.email) {
          const existingUser = await req.payload.find({
            collection: "users",
            where: { email: { equals: data.email.toLowerCase() } },
            limit: 1,
          });
          
          if (existingUser.docs.length > 0) {
            throw new Error("An account with this email already exists");
          }
          
          // Normalize email to lowercase
          data.email = data.email.toLowerCase();
        }
        
        // Check for duplicate username on create
        if (operation === "create" && data?.username) {
          const existingUsername = await req.payload.find({
            collection: "users",
            where: { username: { equals: data.username.toLowerCase() } },
            limit: 1,
          });
          
          if (existingUsername.docs.length > 0) {
            throw new Error("This username is already taken");
          }
          
          // Normalize username to lowercase
          data.username = data.username.toLowerCase();
        }
        
        return data;
      },
    ],
  },
  fields: [
    {
      name: "username",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "firstName",
      type: "text",
      maxLength: 50,
    },
    {
      name: "lastName",
      type: "text",
      maxLength: 50,
    },
    {
      name: "userType",
      type: "select",
      options: [
        { label: "Organizer", value: "Organizer" },
        { label: "Regular", value: "Regular" },
      ],
      defaultValue: "Regular",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "role",
      type: "select",
      options: [
        { label: "Super-Admin", value: "Super-Admin" },
        { label: "Admin", value: "Admin" },
        { label: "Moderator", value: "Moderator" },
        { label: "Basic", value: "Basic" },
      ],
      defaultValue: "Basic",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "email",
      type: "email",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "avatar",
      type: "upload",
      relationTo: "media",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "bio",
      type: "textarea",
      maxLength: 500,
    },
    {
      name: "pronouns",
      type:"select",
      options:[
        { label: "He/Him", value: "He/Him" },
        { label: "She/Her", value: "She/Her" },
        { label: "They/Them", value: "They/Them" },
        { label: "He/They", value: "He/They" },
        { label: "She/They", value: "She/They" },
        { label: "Other", value: "Other" },
      ]
    },
    {
      name: "location",
      type: "text",
      maxLength: 100,
    },
    {
      name: "verified",
      type: "checkbox",
      defaultValue: false,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "bannedAt",
      type: "date",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "lastActiveAt",
      type: "date",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "followersCount",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "followingCount",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "postsCount",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
      },
    },
  ],
}
