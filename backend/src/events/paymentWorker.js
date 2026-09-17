const { subscriber } = require('./redisClient');
const { razorpayInstance } = require('../config/razorpay');
const { pool } = require('../db/pool'); // Fixed: Added curly braces for destructuring

async function startPaymentWorker() {
    try {
        if (!subscriber.isOpen) {
            await subscriber.connect();
        }
        console.log('[Payment Worker] Connected to Redis. Listening for events...');

        await subscriber.subscribe('order.created', async (message) => {
            try {
                const payload = JSON.parse(message);
                const { orderId, userId, totalAmount } = payload;
                console.log(`[Payment Worker] Received 'order.created' for Order ID: ${orderId}`);

                // 1. Create order in Razorpay (amount in paise)
                const options = {
                    amount: Math.round(totalAmount * 100), 
                    currency: 'INR',
                    receipt: `receipt_order_${orderId}`
                };
                const razorpayOrder = await razorpayInstance.orders.create(options);
                console.log(`[Payment Worker] Razorpay Order generated: ${razorpayOrder.id}`);

                // 2. Insert pending payment row into PostgreSQL
                const query = `
                    INSERT INTO payment.payments (order_id, user_id, amount, status, razorpay_order_id)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id;
                `;
                const values = [orderId, userId, totalAmount, 'pending', razorpayOrder.id];
                await pool.query(query, values);

                console.log(`[Payment Worker] Database row inserted for Order ID: ${orderId}`);

            } catch (err) {
                console.error('[Payment Worker] Error processing event:', err.message);
            }
        });
    } catch (err) {
        console.error('[Payment Worker] Fatal Redis connection error:', err);
    }
}

startPaymentWorker();