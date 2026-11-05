
const express = require('express');
const path = require('path');
require('dotenv').config();

const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files from the public folder
app.use(express.static(path.join(__dirname, 'public')));


// Test MySQL connection
async function connectDatabase() {
    try {
        const connection = await db.getConnection();
        console.log('MySQL connected successfully!');
        connection.release();
    } catch (error) {
        console.error('MySQL connection failed:', error.message);
    }
}


// Test API route
app.get('/api/health', (req, res) => {
    res.json({
        message: 'Sugar Spark Cakes server is running!'
    });
});


// Get all cake products with category names
app.get('/api/products', async (req, res) => {
    try {
        const [products] = await db.query(`
            SELECT
                p.product_id,
                p.product_name,
                p.description,
                p.price,
                p.image,
                p.category_id,
                c.category_name AS category,
                p.created_at
            FROM products p
            LEFT JOIN categories c
            ON p.category_id = c.category_id
            ORDER BY p.product_id DESC
        `);

        res.json(products);

    } catch (error) {
        console.error('Error fetching products:', error.message);

        res.status(500).json({
            message: 'Failed to retrieve products'
        });
    }
});


// Customer Registration API
app.post('/api/register', async (req, res) => {
    try {
        const {
            fullName,
            email,
            phone,
            password,
            confirmPassword,
            terms
        } = req.body;

        // Check required fields
        if (
            !fullName ||
            !email ||
            !phone ||
            !password ||
            !confirmPassword
        ) {
            return res.status(400).json({
                message: 'Please fill in all required fields.'
            });
        }

        // Validate email format
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            return res.status(400).json({
                message: 'Please enter a valid email address.'
            });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password must contain at least 8 characters.'
            });
        }

        // Check password confirmation
        if (password !== confirmPassword) {
            return res.status(400).json({
                message: 'Passwords do not match.'
            });
        }

        // Check terms and conditions
        if (terms !== true && terms !== 'on') {
            return res.status(400).json({
                message: 'Please accept the terms and conditions.'
            });
        }

        // Check whether email already exists
        const [existingCustomers] = await db.query(
            'SELECT customer_id FROM customers WHERE email = ?',
            [email.trim().toLowerCase()]
        );

        if (existingCustomers.length > 0) {
            return res.status(409).json({
                message: 'This email address is already registered.'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert customer into database
        const [result] = await db.query(
            `INSERT INTO customers
            (full_name, email, phone, password)
            VALUES (?, ?, ?, ?)`,
            [
                fullName.trim(),
                email.trim().toLowerCase(),
                phone.trim(),
                hashedPassword
            ]
        );

        res.status(201).json({
            message: 'Your account has been created successfully!',
            customerId: result.insertId
        });

    } catch (error) {
        console.error('Registration error:', error.message);

        res.status(500).json({
            message: 'Registration failed. Please try again.'
        });
    }
});


// Customer Login API
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check required fields
        if (!email || !password) {
            return res.status(400).json({
                message: 'Please enter your email and password.'
            });
        }

        // Find customer by email
        const [customers] = await db.query(
            `SELECT customer_id, full_name, email, phone, password
             FROM customers
             WHERE email = ?`,
            [email.trim().toLowerCase()]
        );

        // Check whether customer exists
        if (customers.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const customer = customers[0];

        // Compare entered password with hashed password
        const passwordMatch = await bcrypt.compare(
            password,
            customer.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        // Successful login
        res.status(200).json({
            message: 'Login successful! Welcome back.',
            customer: {
                customerId: customer.customer_id,
                fullName: customer.full_name,
                email: customer.email,
                phone: customer.phone
            }
        });

    } catch (error) {
        console.error('Login error:', error.message);

        res.status(500).json({
            message: 'Login failed. Please try again later.'
        });
    }
});


// Customer Order Placement API
app.post('/api/orders', async (req, res) => {

    let connection;

    try {

        const {
            customerId,
            deliveryDate,
            deliveryAddress,
            deliveryNote,
            paymentMethod,
            items
        } = req.body;

        // Validate customer ID
        const parsedCustomerId = Number(customerId);

        if (
            !Number.isInteger(parsedCustomerId) ||
            parsedCustomerId <= 0
        ) {
            return res.status(400).json({
                message: 'Invalid customer information.'
            });
        }

        // Validate delivery details
        if (!deliveryDate || !deliveryAddress || !paymentMethod) {
            return res.status(400).json({
                message: 'Please complete all required delivery details.'
            });
        }

        // Validate delivery date format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) {
            return res.status(400).json({
                message: 'Please enter a valid delivery date.'
            });
        }

        const dateParts = deliveryDate.split('-').map(Number);
        const dateCheck = new Date(
            Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2])
        );

        if (
            dateCheck.getUTCFullYear() !== dateParts[0] ||
            dateCheck.getUTCMonth() !== dateParts[1] - 1 ||
            dateCheck.getUTCDate() !== dateParts[2]
        ) {
            return res.status(400).json({
                message: 'Please enter a valid delivery date.'
            });
        }

        // Validate payment method
        const allowedPaymentMethods = [
            'Cash on Delivery',
            'Bank Transfer',
            'Card Payment (Demo)'
        ];

        if (!allowedPaymentMethods.includes(paymentMethod)) {
            return res.status(400).json({
                message: 'Invalid payment method.'
            });
        }

        // Validate order items
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: 'Your cart is empty.'
            });
        }

        for (const item of items) {

            const productId = Number(item.productId);
            const quantity = Number(item.quantity);

            if (
                !Number.isInteger(productId) ||
                productId <= 0 ||
                !Number.isInteger(quantity) ||
                quantity <= 0 ||
                !item.size
            ) {
                return res.status(400).json({
                    message: 'Invalid product information in your cart.'
                });
            }

        }

        // Check whether customer exists
        const [customers] = await db.query(
            'SELECT customer_id FROM customers WHERE customer_id = ?',
            [parsedCustomerId]
        );

        if (customers.length === 0) {
            return res.status(404).json({
                message: 'Customer account not found.'
            });
        }

        // Get product details from database
        const productIds = items.map(item => Number(item.productId));
        const uniqueProductIds = [...new Set(productIds)];

        const placeholders = uniqueProductIds.map(() => '?').join(',');

        const [products] = await db.query(
            `SELECT product_id, product_name, price
             FROM products
             WHERE product_id IN (${placeholders})`,
            uniqueProductIds
        );

        if (products.length !== uniqueProductIds.length) {
            return res.status(400).json({
                message: 'One or more products in your cart are unavailable.'
            });
        }

        // Calculate totals using database prices
        const productMap = new Map();

        products.forEach(product => {
            productMap.set(Number(product.product_id), product);
        });

        let subtotal = 0;

        const orderItems = items.map(item => {

            const product = productMap.get(Number(item.productId));
            const quantity = Number(item.quantity);
            const price = Number(product.price);
            const itemTotal = price * quantity;

            subtotal += itemTotal;

            return {
                productId: Number(product.product_id),
                productName: product.product_name,
                price: price,
                size: String(item.size).trim(),
                quantity: quantity,
                itemTotal: itemTotal
            };

        });

        const deliveryFee = 0;
        const total = subtotal + deliveryFee;

        // Start database transaction
        connection = await db.getConnection();

        await connection.beginTransaction();

        // Insert main order
        const [orderResult] = await connection.query(
            `INSERT INTO orders (
                customer_id,
                delivery_date,
                delivery_address,
                delivery_note,
                payment_method,
                subtotal,
                delivery_fee,
                total,
                order_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                parsedCustomerId,
                deliveryDate,
                deliveryAddress.trim(),
                deliveryNote ? deliveryNote.trim() : null,
                paymentMethod,
                subtotal,
                deliveryFee,
                total,
                'Pending'
            ]
        );

        const orderId = orderResult.insertId;

        // Insert order items
        for (const item of orderItems) {

            await connection.query(
                `INSERT INTO order_items (
                    order_id,
                    product_id,
                    product_name,
                    product_price,
                    cake_size,
                    quantity,
                    item_total
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    orderId,
                    item.productId,
                    item.productName,
                    item.price,
                    item.size,
                    item.quantity,
                    item.itemTotal
                ]
            );

        }

        // Complete transaction
        await connection.commit();

        res.status(201).json({
            message: 'Your order has been placed successfully!',
            orderId: orderId,
            subtotal: subtotal,
            deliveryFee: deliveryFee,
            total: total
        });

    } catch (error) {

        // Roll back incomplete order
        if (connection) {
            await connection.rollback();
        }

        console.error('Order placement error:', error.message);

        res.status(500).json({
            message: 'Unable to place your order. Please try again.'
        });

    } finally {

        if (connection) {
            connection.release();
        }

    }

});


// Start the server
app.listen(PORT, () => {
    console.log(`Sugar Spark Cakes server running at http://localhost:${PORT}`);
    connectDatabase();
});
