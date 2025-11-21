import { pool } from "../db.js";

const SQL = `
CREATE TABLE IF NOT EXISTS links (
  id SERIAL PRIMARY KEY,
  short_code VARCHAR(20) UNIQUE NOT NULL,
  original_url TEXT NOT NULL,
  clicks INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE IF EXISTS links ADD COLUMN IF NOT EXISTS last_clicked TIMESTAMP;
`;

async function main() {
  try {
    await pool.query(SQL);
    console.log("links table ready");
  } catch (err) {
    console.error("Failed to initialize database", err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();

