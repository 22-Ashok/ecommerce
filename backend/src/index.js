// src/index.js
const express = require("express");
require("dotenv").config();
const { pool, ensureSchema } = require("./db/pool");
const authRoutes = require("./modules/auth/auth.routes");
const catalogRoutes = require("./modules/catalog/catalog.routes");
const paymentRoutes = require("./modules/payment/payment.routes"); // Fixed path

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS Middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// 1. Health check route (returns 200 to confirm app boots)
app.get("/health", async (req, res) => {
  try {
    // Optional: test the database connection during health check
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", database: "disconnected", error: err.message });
  }
});


// routes 
app.use("/api/auth", authRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/auth", authRoutes);
app.use("/catalog", catalogRoutes);
app.use('/payments', paymentRoutes);

// Start server and initialize tables
async function startServer() {
  try {
    await ensureSchema();
    console.log("Database schema checked/created successfully.");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();