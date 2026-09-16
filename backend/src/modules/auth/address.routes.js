const express = require("express");
const { z } = require("zod");
const pool = require("../../db/pool").pool || require("../../db/pool");
const requireAuth = require("../../middleware/requireAuth");

const router = express.Router();

const addressSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  addressLine1: z.string().min(5, "Address Line 1 is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().min(4, "Postal code is required"),
  country: z.string().min(2, "Country is required"),
  isDefault: z.boolean().default(false),
});

router.post("/address", requireAuth, async (req, res) => {
  try {
    const parsed = addressSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });

    const {
      fullName, phoneNumber, addressLine1, addressLine2,
      city, state, postalCode, country, isDefault
    } = parsed.data;

    const userId = req.user.id;

    if (isDefault) {
      await pool.query("UPDATE auth.addresses SET is_default = FALSE WHERE user_id = $1", [userId]);
    }

    const result = await pool.query(
      `INSERT INTO auth.addresses (
        user_id, full_name, phone_number, address_line1, address_line2,
        city, state, postal_code, country, is_default
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [userId, fullName, phoneNumber, addressLine1, addressLine2 || null, city, state, postalCode, country, isDefault]
    );

    return res.status(201).json({ message: "Address saved", address: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/address", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM auth.addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
      [req.user.id]
    );
    return res.status(200).json({ addresses: result.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete("/address/:id", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM auth.addresses WHERE id = $1 AND user_id = $2 RETURNING id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Address not found or unauthorized" });
    }

    return res.status(200).json({ message: "Address deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


module.exports = router;