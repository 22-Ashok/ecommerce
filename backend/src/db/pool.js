// src/db/pool.js
const { Pool } = require("pg");
require("dotenv").config();

// One pool, shared by auth/catalog/payment modules. Each module is
// responsible for schema-qualifying its own table names.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function ensureSchema() {
  await pool.query(`
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE SCHEMA IF NOT EXISTS catalog;
    CREATE SCHEMA IF NOT EXISTS payment;

    CREATE TABLE IF NOT EXISTS auth.users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'customer',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS catalog.products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      price NUMERIC(10, 2) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS catalog.cart_items (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      product_id INT NOT NULL REFERENCES catalog.products(id) ON DELETE CASCADE,
      quantity INT NOT NULL CHECK (quantity > 0)
    );

    CREATE TABLE IF NOT EXISTS catalog.orders (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      total_amount NUMERIC(10, 2) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS catalog.order_items (
      id SERIAL PRIMARY KEY,
      order_id INT NOT NULL REFERENCES catalog.orders(id) ON DELETE CASCADE,
      product_id INT NOT NULL REFERENCES catalog.products(id),
      quantity INT NOT NULL CHECK (quantity > 0),
      price NUMERIC(10, 2) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payment.payments (
      id SERIAL PRIMARY KEY,
      order_id INT NOT NULL REFERENCES catalog.orders(id) ON DELETE CASCADE,
      user_id INT NOT NULL REFERENCES auth.users(id),
      amount NUMERIC(10, 2) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      confirmed_at TIMESTAMP WITH TIME ZONE
    );
  `);
}

module.exports = { pool, ensureSchema };