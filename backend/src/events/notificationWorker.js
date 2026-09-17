const { subscriber } = require('./redisClient'); // Verify path to your Redis client

async function startNotificationWorker() {
    try {
        if (!subscriber.isOpen) {
            await subscriber.connect();
        }
        console.log('[Notification Worker] Connected to Redis. Listening for events...');

        await subscriber.subscribe('payment.success', (message) => {
            try {
                const payload = JSON.parse(message);
                const { orderId } = payload;
                
                // Exact required log output
                console.log(`[NOTIFICATION]: Would send SMS/Email for Order ID ${orderId} indicating payment success.`);
            } catch (err) {
                console.error('[Notification Worker] Error parsing message:', err.message);
            }
        });
    } catch (err) {
        console.error('[Notification Worker] Fatal Redis connection error:', err);
    }
}

startNotificationWorker();