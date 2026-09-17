const express = require("express");
const productRoutes = require("./products.routes");
const cartRoutes = require("./cart.routes");
const orderRoutes = require("./orders.routes");
const { pool } = require("../../db/pool");

const router = express.Router();

router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);

router.get("/categories", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM catalog.categories ORDER BY name ASC");
    return res.status(200).json({ categories: result.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;