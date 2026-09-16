const express = require("express");
const { z } = require("zod");
const { pool } = require("../../db/pool");
const requireAuth = require("../../middleware/requireAuth");
const requireRole = require("../../middleware/requireRole");

const router = express.Router();

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
});

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, description, price, stock, created_at FROM catalog.products ORDER BY created_at DESC"
    );
    return res.status(200).json({ products: result.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

    const { name, description, price, stock } = parsed.data;
    const result = await pool.query(
      `INSERT INTO catalog.products (name, description, price, stock) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, description, price, stock]
    );

    return res.status(201).json({ product: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;