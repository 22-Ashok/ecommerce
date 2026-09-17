// src/events/testListener.js
const { subscriber } = require("./redisClient");
const { ORDER_CREATED } = require("./eventNames");

async function listen() {
  try {
    let retries = 0;
    const maxRetries = 50; // 5 seconds timeout
    while (!subscriber.isReady && retries < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      retries++;
    }

    if (!subscriber.isReady) {
      console.error("Redis subscriber failed to connect within timeout.");
      return;
    }

    await subscriber.subscribe(ORDER_CREATED, (message) => {
      try {
        const parsed = JSON.parse(message);
        console.log(`[REDIS RECEIVED EVENT]:`, parsed);
      } catch (e) {
        console.log(`[REDIS RECEIVED EVENT]:`, message);
      }
    });
    
    console.log(`Listening for Redis events on channel: ${ORDER_CREATED}...`);
  } catch (error) {
    console.error("Subscription Error:", error);
  }
}

listen();
