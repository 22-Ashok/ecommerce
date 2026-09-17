const express = require('express');
const crypto = require('crypto');
const pool = require('../../db/pool'); // Verify path to your DB pool
const { publisher } = require('../../events/redisClient'); // Verify path to your Redis client

const router = express.Router();

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
            SET status = 'completed' 
            WHERE order_id = $1 
            RETURNING *;
        `;
        const result = await pool.query(query, [orderId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Payment record not found' });
        }

        const payload = JSON.stringify({ orderId, status: 'completed' });
        await publisher.publish('payment.success', payload);
        
        res.status(200).json({ message: 'Payment confirmed', payment: result.rows[0] });
    } catch (err) {
        console.error('[Payment Routes] Error confirming payment:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. POST /webhook - Razorpay Server-to-Server Webhook Receiver
router.post('/webhook', (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];
        
        // Generate HMAC SHA256 signature using the webhook secret
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        // Compare generated signature with Razorpay header signature
        if (expectedSignature !== signature) {
            console.error('[Payment Webhook] Invalid signature detected.');
            return res.status(400).json({ error: 'Invalid signature' });
        }

        console.log(`[Payment Webhook] Valid Event Received: ${req.body.event}`);

        // Return 200 OK immediately so Razorpay knows it was received successfully
        res.status(200).json({ status: 'ok' });
    } catch (err) {
        console.error('[Payment Webhook] Error processing webhook:', err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;