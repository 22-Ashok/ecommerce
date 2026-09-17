// src/modules/auth/auth.routes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { z } = require("zod");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
const { pool } = require("../../db/pool");
const requireAuth = require("../../middleware/requireAuth");
require("dotenv").config();

const router = express.Router();

const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "7d" }
  );
  return { accessToken, refreshToken };
}

// Validation Schemas
const emailSchema = z.object({
  email: z.string().email("Invalid email format").transform((str) => str.trim().toLowerCase()),
});

const verifySchema = z.object({
  email: z.string().email().transform((str) => str.trim().toLowerCase()),
  otpCode: z.string().length(6, "OTP must be exactly 6 digits"),
});

// 1. POST /auth/send-otp
router.post("/send-otp", async (req, res) => {
  try {
    const parsed = emailSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }
    const { email } = parsed.data;

    // Rate Limiting: Check for cooldown (60 seconds)
    const recentCheck = await pool.query(
      `SELECT created_at FROM auth.otps WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (recentCheck.rows.length > 0) {
      const timeSinceLast = Date.now() - new Date(recentCheck.rows[0].created_at).getTime();
      const cooldownMs = 60000;
      if (timeSinceLast < cooldownMs) {
        return res.status(429).json({ error: "Please wait 60 seconds before requesting another OTP." });
      }
    }

    // Cryptographically secure OTP generation
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete existing OTPs and insert the new one
    await pool.query("DELETE FROM auth.otps WHERE email = $1", [email]);
    await pool.query(
      `INSERT INTO auth.otps (email, otp_code, expires_at, attempts) VALUES ($1, $2, $3, 0)`,
      [email, otpCode, expiresAt]
    );

    // Send email using AWS SES
    const params = {
      Source: process.env.AWS_SES_FROM_EMAIL,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: "Your E-Commerce Verification Code" },
        Body: { Text: { Data: `Your OTP code is: ${otpCode}. It expires in 5 minutes.` } },
      },
    };

    await sesClient.send(new SendEmailCommand(params));
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

// 2. POST /auth/verify-otp
router.post("/verify-otp", async (req, res) => {
  try {
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }
    const { email, otpCode } = parsed.data;

    // Fetch active OTP record
    const otpResult = await pool.query(
      `SELECT * FROM auth.otps WHERE email = $1 AND expires_at > CURRENT_TIMESTAMP`,
      [email]
    );

    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: "OTP expired or does not exist" });
    }

    const otpRecord = otpResult.rows[0];

    // Brute-force protection check
    if (otpRecord.attempts >= 3) {
      await pool.query("DELETE FROM auth.otps WHERE email = $1", [email]);
      return res.status(429).json({ error: "Maximum attempts reached. Request a new OTP." });
    }

    // Code mismatch
    if (otpRecord.otp_code !== otpCode) {
      await pool.query("UPDATE auth.otps SET attempts = attempts + 1 WHERE id = $1", [otpRecord.id]);
      return res.status(401).json({ error: "Invalid OTP code" });
    }

    // Code matches: Clean up OTP table
    await pool.query("DELETE FROM auth.otps WHERE email = $1", [email]);

    // Proceed with Authentication logic
    let userResult = await pool.query("SELECT * FROM auth.users WHERE email = $1", [email]);
    let user;

    if (userResult.rows.length === 0) {
      const newUserQuery = await pool.query(
        `INSERT INTO auth.users (email, role, is_verified) VALUES ($1, $2, $3) RETURNING id, email, role, is_verified, created_at`,
        [email, "customer", true]
      );
      user = newUserQuery.rows[0];
    } else {
      user = userResult.rows[0];
      if (!user.is_verified) {
        await pool.query("UPDATE auth.users SET is_verified = TRUE WHERE id = $1", [user.id]);
        user.is_verified = true;
      }
    }

    const tokens = generateTokens(user);
    res.status(200).json({ message: "Authentication successful", user, ...tokens });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /auth/refresh
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token required" });
  }

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired refresh token" });
    }

    try {
      const result = await pool.query("SELECT * FROM auth.users WHERE id = $1", [decoded.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = result.rows[0];
      const tokens = generateTokens(user);
      res.status(200).json(tokens);
    } catch (dbErr) {
      res.status(500).json({ error: dbErr.message });
    }
  });
});

const addressRoutes = require("./address.routes");
router.use("/", addressRoutes);

router.get("/profile", requireAuth, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, email, role, is_verified, created_at FROM auth.users WHERE id = $1", [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });
    return res.status(200).json({ user: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;