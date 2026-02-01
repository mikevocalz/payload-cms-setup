import { Pool } from "pg";
import { config } from "dotenv";

config();

async function checkUsers() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URI });
  const client = await pool.connect();
  
  try {
    const result = await client.query('SELECT id, email, name FROM "user" LIMIT 5');
    console.log("Better Auth users:", result.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

checkUsers();
