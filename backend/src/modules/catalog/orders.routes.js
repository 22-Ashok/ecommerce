const express = require("express");
const { pool } = require("../../db/pool");
const requireAuth = require("../../middleware/requireAuth");
const requireRole = require("../../middleware/requireRole");
const { publisher } = require("../../events/redisClient");
const { ORDER_CREATED } = require("../../events/eventNames");

const router = express.Router();

router.post("/", requireAuth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userId = req.user.id;

    const cartItems = await client.query(
      `SELECT c.product_id, c.quantity, p.price, p.stock 
       FROM catalog.cart_items c JOIN catalog.products p ON c.product_id = p.id
       WHERE c.user_id = $1 FOR UPDATE`, 
      [userId]
    );

    if (cartItems.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Cart is empty" });
    }

    let totalAmount = 0;
    for (const item of cartItems.rows) {
      if (item.stock < item.quantity) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: `Insufficient stock for product ID ${item.product_id}` });
      }
      totalAmount += parseFloat(item.price) * item.quantity;
    }

    const orderResult = await client.query(
      `INSERT INTO catalog.orders (user_id, total_amount, status) VALUES ($1, $2, $3) RETURNING id`,
      [userId, totalAmount, "pending"]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of cartItems.rows) {
      await client.query(
        `INSERT INTO catalog.order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, item.quantity, item.price]
      );
      await client.query(
        `UPDATE catalog.products SET stock = stock - $1 WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    await client.query("DELETE FROM catalog.cart_items WHERE user_id = $1", [userId]);
    await client.query("COMMIT");

    // Publish the order.created event via Redis
    await publisher.publish(
      ORDER_CREATED,
      JSON.stringify({
        orderId,
        userId,
        totalAmount,
        timestamp: new Date().toISOString(),
      })
    );

    console.log(`[REDIS PUBLISHED]: ${ORDER_CREATED} - Order ID: ${orderId}`);
    return res.status(201).json({ message: "Order placed successfully", orderId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Order Checkout Error:", err);
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Admin: Update order status ('pending', 'paid', 'shipped', 'delivered')
router.patch("/:id/status", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStates = ["pending", "paid", "shipped", "delivered"];
    if (!allowedStates.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed states: ${allowedStates.join(", ")}` });
    }

    const orderId = req.params.id;
    const result = await pool.query(
      `UPDATE catalog.orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(200).json({ message: "Order status updated successfully", order: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// User: Track orders with status and history timeline
router.get("/track", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const ordersQuery = await pool.query(
      `SELECT * FROM catalog.orders WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    const ordersWithTimeline = [];
    for (const order of ordersQuery.rows) {
      const itemsQuery = await pool.query(
        `SELECT o.product_id, o.quantity, o.price, p.name FROM catalog.order_items o
         JOIN catalog.products p ON o.product_id = p.id WHERE o.order_id = $1`,
        [order.id]
      );

      const statusFlow = ["pending", "paid", "shipped", "delivered"];
      const currentIndex = statusFlow.indexOf(order.status);
      const timeline = statusFlow.map((st, index) => ({
        status: st,
        completed: index <= currentIndex,
        timestamp: index <= currentIndex ? order.created_at : null,
      }));

      ordersWithTimeline.push({
        order,
        items: itemsQuery.rows,
        timeline,
      });
    }

    return res.status(200).json({ orders: ordersWithTimeline });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// User: Get Order Invoice
router.get("/:id/invoice", requireAuth, async (req, res) => {
  try {
    const orderQuery = await pool.query("SELECT * FROM catalog.orders WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
    if (orderQuery.rows.length === 0) return res.status(404).json({ error: "Order not found" });

    const itemsQuery = await pool.query(
      `SELECT o.product_id, o.quantity, o.price, p.name FROM catalog.order_items o
       JOIN catalog.products p ON o.product_id = p.id WHERE o.order_id = $1`,
      [req.params.id]
    );

    const userQuery = await pool.query("SELECT email FROM auth.users WHERE id = $1", [req.user.id]);
    const addressQuery = await pool.query("SELECT * FROM auth.addresses WHERE user_id = $1 ORDER BY is_default DESC LIMIT 1", [req.user.id]);

    return res.status(200).json({
      invoiceNumber: `INV-${orderQuery.rows[0].id}`,
      date: orderQuery.rows[0].created_at,
      customerEmail: userQuery.rows[0]?.email,
      shippingAddress: addressQuery.rows[0] || null,
      order: orderQuery.rows[0],
      items: itemsQuery.rows,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const orderQuery = await pool.query("SELECT * FROM catalog.orders WHERE id = $1 AND user_id = $2", [req.params.id, req.user.id]);
    if (orderQuery.rows.length === 0) return res.status(404).json({ error: "Order not found" });

    const itemsQuery = await pool.query(
      `SELECT o.product_id, o.quantity, o.price, p.name FROM catalog.order_items o
       JOIN catalog.products p ON o.product_id = p.id WHERE o.order_id = $1`,
      [req.params.id]
    );

    return res.status(200).json({ order: orderQuery.rows[0], items: itemsQuery.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;