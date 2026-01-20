import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, "../.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URI,
});

async function runMigration() {
  const schemaPath = path.join(__dirname, "../lib/auth-schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");

  const client = await pool.connect();
  try {
    console.log("Running Better Auth schema migration...");
    await client.query(schema);
    console.log("✅ Better Auth tables created successfully!");
  } catch (error: any) {
    if (error.code === "42P07") {
      console.log("⚠️ Tables already exist, skipping...");
    } else {
      console.error("❌ Migration failed:", error.message);
      throw error;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
