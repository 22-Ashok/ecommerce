// src/db/seed.js
const { pool } = require("./pool");
require("dotenv").config();

async function seedDatabase() {
  try {
    console.log("Starting database seeding...");

    // 1. Seed Categories (Idempotent using ON CONFLICT DO NOTHING)
    const categories = [
      "Electronics",
      "Fashion",
      "Home & Living",
      "Fitness",
      "Books"
    ];

    console.log("Seeding categories...");
    for (const catName of categories) {
      await pool.query(
        `INSERT INTO catalog.categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [catName]
      );
    }
    console.log("Categories seeded successfully.");

    // Fetch categories to map names to IDs
    const catResult = await pool.query("SELECT id, name FROM catalog.categories");
    const categoryMap = {};
    catResult.rows.forEach((row) => {
      categoryMap[row.name] = row.id;
    });

    // 2. Seed Products (15-20 products distributed across categories)
    const products = [
      // Electronics
      {
        name: "Wireless Noise-Canceling Headphones",
        description: "Immersive high-fidelity sound with active noise cancellation and 40-hour battery life.",
        price: 199.99,
        stock: 25,
        category: "Electronics",
        image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
      },
      {
        name: "Ultra-Wide 4K Gaming Monitor",
        description: "34-inch curved IPS display with 144Hz refresh rate and 1ms response time.",
        price: 599.99,
        stock: 15,
        category: "Electronics",
        image_url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500"
      },
      {
        name: "Mechanical RGB Gaming Keyboard",
        description: "Tactile mechanical switches with customizable per-key RGB backlighting.",
        price: 129.99,
        stock: 40,
        category: "Electronics",
        image_url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500"
      },
      {
        name: "Wireless Ergonomic Mouse",
        description: "Precision optical sensor with sculpted ergonomic design for all-day comfort.",
        price: 79.99,
        stock: 50,
        category: "Electronics",
        image_url: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500"
      },

      // Fashion
      {
        name: "Classic Leather Jacket",
        description: "Genuine premium leather jacket with quilted lining and durable metal zips.",
        price: 249.99,
        stock: 20,
        category: "Fashion",
        image_url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500"
      },
      {
        name: "Slim Fit Denim Jeans",
        description: "Stretch denim jeans with a modern slim fit and classic wash.",
        price: 69.99,
        stock: 60,
        category: "Fashion",
        image_url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500"
      },
      {
        name: "Casual Cotton Hoodie",
        description: "Ultra-soft cotton blend fleece hoodie with adjustable drawstring hood.",
        price: 49.99,
        stock: 45,
        category: "Fashion",
        image_url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=500"
      },
      {
        name: "Designer Running Sneakers",
        description: "Lightweight mesh sneakers engineered for breathability and daily urban wear.",
        price: 110.00,
        stock: 35,
        category: "Fashion",
        image_url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500"
      },

      // Home & Living
      {
        name: "Ergonomic Office Chair",
        description: "Breathable mesh design with adjustable lumbar support and 4D armrests.",
        price: 249.99,
        stock: 30,
        category: "Home & Living",
        image_url: "https://images.unsplash.com/photo-1580481077494-e3299ac25e94?w=500"
      },
      {
        name: "Minimalist Wooden Desk Lamp",
        description: "Dimmable LED desk lamp with natural wood finish and touch controls.",
        price: 45.00,
        stock: 50,
        category: "Home & Living",
        image_url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500"
      },
      {
        name: "Ceramic Coffee Pour-Over Set",
        description: "Handcrafted ceramic dripper and server for artisanal morning coffee.",
        price: 39.99,
        stock: 25,
        category: "Home & Living",
        image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500"
      },
      {
        name: "Luxury Scented Soy Candle",
        description: "Hand-poured soy wax candle infused with sandalwood and vanilla notes.",
        price: 24.99,
        stock: 80,
        category: "Home & Living",
        image_url: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500"
      },

      // Fitness
      {
        name: "Smart Fitness Watch",
        description: "Heart rate tracking, GPS, sleep monitoring, and 5ATM water resistance.",
        price: 149.99,
        stock: 50,
        category: "Fitness",
        image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"
      },
      {
        name: "Adjustable Dumbbell Set",
        description: "Space-saving adjustable dumbbells ranging from 5 to 52.5 lbs.",
        price: 299.99,
        stock: 12,
        category: "Fitness",
        image_url: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=500"
      },
      {
        name: "Non-Slip Yoga Mat",
        description: "Eco-friendly extra-thick cushioning mat with alignment lines.",
        price: 35.00,
        stock: 65,
        category: "Fitness",
        image_url: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500"
      },
      {
        name: "Insulated Stainless Steel Water Bottle",
        description: "Double-wall vacuum insulated bottle keeping drinks cold for 24 hours.",
        price: 29.99,
        stock: 90,
        category: "Fitness",
        image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500"
      },

      // Books
      {
        name: "Clean Code: A Handbook of Agile Software Craftsmanship",
        description: "Essential guide for writing maintainable, readable, and robust software.",
        price: 42.99,
        stock: 35,
        category: "Books",
        image_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500"
      },
      {
        name: "Designing Data-Intensive Applications",
        description: "The big ideas behind reliable, scalable, and maintainable data systems.",
        price: 49.99,
        stock: 28,
        category: "Books",
        image_url: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500"
      },
      {
        name: "Atomic Habits: Proven Way to Build Good Habits",
        description: "Tiny changes remarkable results by James Clear.",
        price: 26.00,
        stock: 75,
        category: "Books",
        image_url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500"
      }
    ];

    console.log("Seeding products...");
    for (const p of products) {
      const catId = categoryMap[p.category];
      if (!catId) {
        console.warn(`Category not found for product: ${p.name}`);
        continue;
      }

      const existing = await pool.query(
        "SELECT id FROM catalog.products WHERE name = $1",
        [p.name]
      );

      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO catalog.products (name, description, price, stock, category_id, image_url) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [p.name, p.description, p.price, p.stock, catId, p.image_url]
        );
        console.log(`Inserted product: ${p.name}`);
      } else {
        console.log(`Product already exists: ${p.name}`);
      }
    }

    console.log("Database seeding completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error seeding database:", err);
    process.exit(1);
  }
}

seedDatabase();
