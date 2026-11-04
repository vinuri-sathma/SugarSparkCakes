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


// Customer login
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

// Start the server
app.listen(PORT, () => {
    console.log(`Sugar Spark Cakes server running at http://localhost:${PORT}`);
    connectDatabase();
});