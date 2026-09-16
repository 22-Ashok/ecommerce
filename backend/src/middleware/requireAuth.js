// src/middleware/requireAuth.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

function requireAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token missing or malformed" });
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired access token" });
    }
    req.user = user;
    next();
  });
}

module.exports = requireAuth;