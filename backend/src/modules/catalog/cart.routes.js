const express = require("express");
const { z } = require("zod");
const { pool } = require("../../db/pool");
const requireAuth = require("../../middleware/requireAuth");

const router = express.Router();

const cartSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id as cart_item_id, c.product_id, c.quantity, p.name, p.price, (c.quantity * p.price) as subtotal, p.stock as available_stock
       FROM catalog.cart_items c JOIN catalog.products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [req.user.id]
    );
    return res.status(200).json({ cart: result.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const parsed = cartSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

    const { productId, quantity } = parsed.data;
    const userId = req.user.id;

    const productCheck = await pool.query("SELECT stock FROM catalog.products WHERE id = $1", [productId]);
    if (productCheck.rows.length === 0) return res.status(404).json({ error: "Product not found" });
    if (productCheck.rows[0].stock < quantity) return res.status(400).json({ error: "Insufficient stock" });

    const existingItem = await pool.query(
      "SELECT id, quantity FROM catalog.cart_items WHERE user_id = $1 AND product_id = $2",
      [userId, productId]
    );

    if (existingItem.rows.length > 0) {
      const newQuantity = existingItem.rows[0].quantity + quantity;
      if (productCheck.rows[0].stock < newQuantity) return res.status(400).json({ error: "Insufficient stock" });
      await pool.query("UPDATE catalog.cart_items SET quantity = $1 WHERE id = $2", [newQuantity, existingItem.rows[0].id]);
    } else {
      await pool.query("INSERT INTO catalog.cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)", [userId, productId, quantity]);
    }

    return res.status(200).json({ message: "Item added to cart" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete("/:productId", requireAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM catalog.cart_items WHERE user_id = $1 AND product_id = $2", [req.user.id, req.params.productId]);
    return res.status(200).json({ message: "Item removed from cart" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;