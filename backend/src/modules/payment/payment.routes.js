const express = require('express');
const crypto = require('crypto');
const { pool } = require('../../db/pool'); // Verify path to your DB pool
const { publisher } = require('../../events/redisClient'); // Verify path to your Redis client
const { razorpayInstance } = require('../../config/razorpay');

const router = express.Router();

// 1. POST /order/:orderId/initiate - Create or fetch Razorpay order synchronously for checkout
router.post('/order/:orderId/initiate', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const orderRes = await pool.query('SELECT total_amount, user_id FROM catalog.orders WHERE id = $1', [orderId]);
        if (orderRes.rows.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const { total_amount, user_id } = orderRes.rows[0];

        let paymentRes = await pool.query('SELECT * FROM payment.payments WHERE order_id = $1', [orderId]);
        let razorpayOrderId = paymentRes.rows.length > 0 ? paymentRes.rows[0].razorpay_order_id : null;

        if (!razorpayOrderId) {
            const currency = process.env.CURRENCY || 'INR';
            const options = {
                amount: Math.round(Number(total_amount) * 100),
                currency: currency,
                receipt: `receipt_order_${orderId}`
            };
            const razorpayOrder = await razorpayInstance.orders.create(options);
            razorpayOrderId = razorpayOrder.id;

            if (paymentRes.rows.length > 0) {
                await pool.query('UPDATE payment.payments SET razorpay_order_id = $1 WHERE order_id = $2', [razorpayOrderId, orderId]);
            } else {
                await pool.query(
                    'INSERT INTO payment.payments (order_id, user_id, amount, status, razorpay_order_id) VALUES ($1, $2, $3, $4, $5)',
                    [orderId, user_id, total_amount, 'pending', razorpayOrderId]
                );
            }
        }

        res.status(200).json({
            razorpayOrderId,
            amount: Math.round(Number(total_amount) * 100),
            currency: process.env.CURRENCY || 'INR',
            keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkey'
        });
    } catch (err) {
        console.error('[Payment Initiate] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 1. GET /order/:orderId - Frontend polling to check payment status
router.get('/order/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const query = 'SELECT * FROM payment.payments WHERE order_id = $1';
        const result = await pool.query(query, [orderId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payment record not found' });
        }
        
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error('[Payment Routes] Error fetching payment:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. POST /order/:orderId/confirm - Manual confirmation & Redis publish
router.post('/order/:orderId/confirm', async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const query = `
            UPDATE payment.payments 
            SET status = 'completed', confirmed_at = CURRENT_TIMESTAMP
            WHERE order_id = $1 
            RETURNING *;
        `;
        const result = await pool.query(query, [orderId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payment record not found' });
        }

        // Automatically transition order status to 'paid'
        await pool.query(
            `UPDATE catalog.orders SET status = 'paid' WHERE id = $1 AND status = 'pending'`,
            [orderId]
        );

        const payload = JSON.stringify({ orderId, status: 'completed' });
        await publisher.publish('payment.success', payload);
        
        res.status(200).json({ message: 'Payment confirmed', payment: result.rows[0] });
    } catch (err) {
        console.error('[Payment Routes] Error confirming payment:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. POST /webhook - Razorpay Server-to-Server Webhook Receiver
router.post('/webhook', async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];
        
        if (webhookSecret && signature) {
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(JSON.stringify(req.body))
                .digest('hex');

            if (expectedSignature !== signature) {
                console.error('[Payment Webhook] Invalid signature detected.');
                return res.status(400).json({ error: 'Invalid signature' });
            }
        }

        const event = req.body.event;
        console.log(`[Payment Webhook] Valid Event Received: ${event}`);

        if (event === 'payment.captured' || event === 'order.paid') {
            const entity = req.body.payload?.payment?.entity || req.body.payload?.order?.entity;
            const rzpOrderId = entity?.order_id || entity?.id;

            if (rzpOrderId) {
                const paymentRes = await pool.query(
                    'UPDATE payment.payments SET status = \'completed\', confirmed_at = CURRENT_TIMESTAMP WHERE razorpay_order_id = $1 RETURNING order_id',
                    [rzpOrderId]
                );

                if (paymentRes.rows.length > 0) {
                    const orderId = paymentRes.rows[0].order_id;
                    await pool.query(
                        'UPDATE catalog.orders SET status = \'paid\' WHERE id = $1 AND status = \'pending\'',
                        [orderId]
                    );
                    console.log(`[Payment Webhook] Order #${orderId} automatically transitioned to 'paid'.`);
                }
            }
        }

        res.status(200).json({ status: 'ok' });
    } catch (err) {
        console.error('[Payment Webhook] Error processing webhook:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;