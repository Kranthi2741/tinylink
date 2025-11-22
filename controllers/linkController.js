import { pool } from "../db.js";
import { nanoid } from "nanoid";

// Spec requirement: Codes follow [A-Za-z0-9]{6,8}
const SHORT_CODE_REGEX = /^[A-Za-z0-9]{6,8}$/;

// Validate URL format
const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_) {
    return false;
  }
};

const buildOrderClause = (sort = "newest") => {
  if (sort === "oldest") return "ORDER BY created_at ASC";
  if (sort === "most-clicked") return "ORDER BY clicks DESC NULLS LAST";
  if (sort === "least-clicked") return "ORDER BY clicks ASC NULLS FIRST";
  return "ORDER BY created_at DESC";
};

const normalizeTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const stringValue = String(value).replace(" ", "T");
  return stringValue.endsWith("Z") ? stringValue : `${stringValue}Z`;
};

const normalizeLinkRow = (row) => ({
  ...row,
  created_at: normalizeTimestamp(row.created_at),
  last_clicked: normalizeTimestamp(row.last_clicked),
});

const findExistingCode = async (code) => {
  const existing = await pool.query(
    "SELECT 1 FROM links WHERE short_code = $1 LIMIT 1",
    [code]
  );
  return existing.rowCount > 0;
};

// Generate 6-character code (within spec range of 6-8)
const generateUniqueCode = async () => {
  let code = nanoid(6);
  // small safeguard loop in case of collision
  for (let i = 0; i < 5; i += 1) {
    const exists = await findExistingCode(code);
    if (!exists) return code;
    code = nanoid(6);
  }
  // fall-through: if collisions happen repeatedly
  throw new Error("Unable to generate unique short code");
};

export const createShortUrl = async (req, res) => {
  const { url, customCode } = req.body;

  if (!url) return res.status(400).json({ error: "Destination URL is required" });

  // Validate URL format
  if (!isValidUrl(url)) {
    return res.status(400).json({ error: "Invalid URL format. Must be http:// or https://" });
  }

  try {
    let code = customCode?.trim();

    if (code) {
      if (!SHORT_CODE_REGEX.test(code)) {
        return res.status(400).json({
          error: "Custom code must be 6-8 characters and only letters or numbers (A-Za-z0-9)"
        });
      }
      const exists = await findExistingCode(code);
      if (exists) {
        return res.status(409).json({ error: "That code is already taken" });
      }
    } else {
      code = await generateUniqueCode();
    }

    const result = await pool.query(
      `INSERT INTO links (short_code, original_url)
       VALUES ($1, $2)
       RETURNING id, short_code, original_url, clicks, created_at, last_clicked`,
      [code, url]
    );

    res.status(201).json({
      shortUrl: `${process.env.BASE_URL}/${code}`,
      data: normalizeLinkRow(result.rows[0])
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to shorten URL" });
  }
};

export const redirectUrl = async (req, res) => {
  const { code } = req.params;

  try {
    // Check if the link exists in the database
    const result = await pool.query(
      "SELECT original_url FROM links WHERE short_code = $1",
      [code]
    );

    // If link doesn't exist (e.g., after deletion), return 404
    // This ensures deleted links no longer redirect
    if (result.rowCount === 0) {
      return res.status(404).send("Short URL not found");
    }

    // Link exists - increment click count and redirect
    await pool.query(
      "UPDATE links SET clicks = clicks + 1, last_clicked = NOW() WHERE short_code = $1",
      [code]
    );

    // HTTP 302 redirect as per spec
    res.redirect(302, result.rows[0].original_url);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

export const getAllLinks = async (req, res) => {
  const { search = "", sort = "newest" } = req.query;

  try {
    const params = [];
    let whereClause = "";

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      whereClause =
        "WHERE LOWER(short_code) LIKE $1 OR LOWER(original_url) LIKE $1";
    }

    const orderClause = buildOrderClause(sort);
    const result = await pool.query(
      `SELECT id, short_code, original_url, clicks, created_at, last_clicked
       FROM links
       ${whereClause}
       ${orderClause}`,
      params
    );

    res.json(result.rows.map(normalizeLinkRow));
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch links");
  }
};

export const deleteLink = async (req, res) => {
  const { code } = req.params;

  try {
    // Delete the link from the database
    // After deletion, accessing /{code} will return 404
    const result = await pool.query("DELETE FROM links WHERE short_code = $1", [
      code,
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Link not found" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Deletion failed");
  }
};

export const getLinkInfo = async (req, res) => {
  const { code } = req.params;

  try {
    const result = await pool.query(
      `SELECT id, short_code, original_url, clicks, created_at, last_clicked
       FROM links
       WHERE short_code = $1`,
      [code]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Link not found" });
    }

    res.json(normalizeLinkRow(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};
