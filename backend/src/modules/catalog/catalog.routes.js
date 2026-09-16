const express = require("express");
const productRoutes = require("./products.routes");
const cartRoutes = require("./cart.routes");
const orderRoutes = require("./orders.routes");

const router = express.Router();

router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);

module.exports = router;