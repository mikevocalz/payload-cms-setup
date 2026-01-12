import { getPayload } from "payload"
import config from "../payload.config"

async function seedAdmin() {
  console.log("Starting Payload admin user creation...")

  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com"
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123456"
  const adminUsername = process.env.ADMIN_USERNAME || "admin"

  try {
    // Initialize Payload
    const payload = await getPayload({ config })

    // Check if admin user already exists
    const existingUsers = await payload.find({
      collection: "users",
      where: {
        email: {
          equals: adminEmail,
        },
      },
    })

    if (existingUsers.docs.length > 0) {
      console.log("Admin user already exists!")
      process.exit(0)
    }

    // Create Payload admin user
    console.log(`Creating Payload admin user: ${adminEmail}`)
    const payloadUser = await payload.create({
      collection: "users",
      data: {
        email: adminEmail,
        password: adminPassword,
        username: adminUsername,
        displayName: "Admin User",
        verified: true,
      },
    })

    console.log("Payload admin user created:", payloadUser.id)
    console.log("\n✅ Admin user created successfully!")
    console.log(`Email: ${adminEmail}`)
    console.log(`Password: ${adminPassword}`)
    console.log(`Username: ${adminUsername}`)
    console.log("\nYou can now sign in at /admin")

    process.exit(0)
  } catch (error) {
    console.error("Error creating admin user:", error)
    process.exit(1)
  }
}

seedAdmin()
