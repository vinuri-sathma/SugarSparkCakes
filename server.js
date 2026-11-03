const express = require('express');
const path = require('path');
require('dotenv').config();

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

// Get all cake products
app.get('/api/products', async (req, res) => {
    try {
        const [products] = await db.query(
            'SELECT * FROM products ORDER BY product_id DESC'
        );

        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error.message);
        res.status(500).json({
            message: 'Failed to retrieve products'
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Sugar Spark Cakes server running at http://localhost:${PORT}`);
    connectDatabase();
});
