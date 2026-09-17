const express = require("express");
const { z } = require("zod");
const { pool } = require("../../db/pool");
const requireAuth = require("../../middleware/requireAuth");
const requireRole = require("../../middleware/requireRole");
const upload = require("../../middleware/upload"); // Cloudinary upload middleware

const router = express.Router();

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().nonnegative(),
  category_id: z.coerce.number().int().positive().optional().nullable(),
});

router.get("/", async (req, res) => {
  try {
    const { categoryId } = req.query;
    let query = `
      SELECT 
        p.id, p.name, p.description, p.price, p.stock, p.image_url, p.created_at,
        p.category_id,
        c.name AS category_name
      FROM catalog.products p
      LEFT JOIN catalog.categories c ON p.category_id = c.id
    `;
    const params = [];
    if (categoryId) {
      query += ` WHERE p.category_id = $1`;
      params.push(categoryId);
    }
    query += ` ORDER BY p.created_at DESC`;

    const result = await pool.query(query, params);
    return res.status(200).json({ products: result.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/", requireAuth, requireRole("admin"), upload.single("image"), async (req, res) => {
  try {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

    const { name, description, price, stock, category_id } = parsed.data;
    const imageUrl = req.file ? req.file.path : null;

    const result = await pool.query(
      `INSERT INTO catalog.products (name, description, price, stock, image_url, category_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, description, price, stock, imageUrl, category_id || null]
    );

    return res.status(201).json({ product: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;