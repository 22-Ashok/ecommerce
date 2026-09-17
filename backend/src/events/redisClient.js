// src/events/redisClient.js
const { createClient } = require("redis");
require("dotenv").config();

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// 1. Publisher Client
const publisherClient = createClient({ url: redisUrl });

// 2. Subscriber Client (Cloned or instantiated separately)
const subscriber = createClient({ url: redisUrl });

publisherClient.on("error", (err) => console.warn("Redis Publisher Warning (offline):", err.message));
subscriber.on("error", (err) => console.warn("Redis Subscriber Warning (offline):", err.message));

async function connectRedis() {
  try {
    if (!publisherClient.isOpen) await publisherClient.connect();
    if (!subscriber.isOpen) await subscriber.connect();
    console.log("Redis Publisher and Subscriber connected successfully.");
  } catch (err) {
    console.warn("Redis is not running or unreachable. Running without Redis features:", err.message);
  }
}

// Safe publisher wrapper
const publisher = {
  async publish(channel, message) {
    try {
      if (publisherClient.isOpen) {
        return await publisherClient.publish(channel, message);
      } else {
        console.warn(`[Redis Skipped] Publisher not connected. Message to channel '${channel}' not published.`);
      }
    } catch (err) {
      console.warn(`[Redis Publish Error]: ${err.message}`);
    }
  }
};

connectRedis();

module.exports = {
  publisher,
  subscriber,
  connectRedis,
};
