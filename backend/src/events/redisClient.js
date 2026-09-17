// src/events/redisClient.js
const { createClient } = require("redis");
require("dotenv").config();

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// 1. Publisher Client
const publisher = createClient({ url: redisUrl });

// 2. Subscriber Client (Cloned or instantiated separately)
const subscriber = createClient({ url: redisUrl });

publisher.on("error", (err) => console.error("Redis Publisher Error:", err));
subscriber.on("error", (err) => console.error("Redis Subscriber Error:", err));

async function connectRedis() {
  try {
    if (!publisher.isOpen) await publisher.connect();
    if (!subscriber.isOpen) await subscriber.connect();
    console.log("Redis Publisher and Subscriber connected successfully.");
  } catch (err) {
    console.error("Redis Connection Error:", err);
  }
}

connectRedis();

module.exports = {
  publisher,
  subscriber,
  connectRedis,
};
