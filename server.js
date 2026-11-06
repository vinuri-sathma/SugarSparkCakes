
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
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


// ==========================================
// IMAGE UPLOAD CONFIGURATION
// ==========================================

// Create uploads folder if it does not exist
const uploadDirectory = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Configure image storage
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, uploadDirectory);
    },

    filename: (req, file, callback) => {
        const uniqueName =
            Date.now() + '-' +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname).toLowerCase();

        callback(null, uniqueName);
    }
});

// Allow image files only, maximum 5MB per image
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: (req, file, callback) => {
        if (file.mimetype.startsWith('image/')) {
            callback(null, true);
        } else {
            callback(new Error('Only image files are allowed.'));
        }
    }
});


// ==========================================
// TEST MYSQL CONNECTION
// ==========================================

async function connectDatabase() {
    try {
        const connection = await db.getConnection();
        console.log('MySQL connected successfully!');
        connection.release();
    } catch (error) {
        console.error('MySQL connection failed:', error.message);
    }
}


// ==========================================
// HEALTH CHECK API
// ==========================================

app.get('/api/health', (req, res) => {
    res.json({
        message: 'Sugar Spark Cakes server is running!'
    });
});


// ==========================================
// GET ALL PRODUCTS WITH MULTIPLE IMAGES
// ==========================================

app.get('/api/products', async (req, res) => {
    try {
        const [products] = await db.query(`
            SELECT
                p.product_id,
                p.product_name,
                p.description,
                p.price,
                p.image,
                p.flavour,
                p.status,
                p.category_id,
                c.category_name AS category,
                p.created_at
            FROM products p
            LEFT JOIN categories c
                ON p.category_id = c.category_id
            ORDER BY p.product_id DESC
        `);

        const [images] = await db.query(`
            SELECT product_id, image_path
            FROM product_images
            ORDER BY image_id ASC
        `);

        const imageMap = {};

        images.forEach(item => {
            if (!imageMap[item.product_id]) {
                imageMap[item.product_id] = [];
            }

            imageMap[item.product_id].push(item.image_path);
        });

        const result = products.map(product => {
            const productImages = imageMap[product.product_id] || [];

            // Use the main image if no gallery images exist
            if (
                productImages.length === 0 &&
                product.image
            ) {
                productImages.push(product.image);
            }

            return {
                ...product,
                available: product.status === 'Available',
                images: productImages
            };
        });

        res.json(result);

    } catch (error) {
        console.error('Error fetching products:', error.message);

        res.status(500).json({
            message: 'Failed to retrieve products'
        });
    }
});


// ==========================================
// ADMIN - ADD PRODUCT WITH MULTIPLE IMAGES
// ==========================================

app.post(
    '/api/admin/products',
    upload.array('images', 10),
    async (req, res) => {
        let connection;

        try {
            const {
                name,
                price,
                category,
                flavour,
                description,
                available
            } = req.body;

            if (!name || !price || !category || !flavour) {
                return res.status(400).json({
                    message: 'Please complete all required product details.'
                });
            }

            const numericPrice = Number(price);

            if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
                return res.status(400).json({
                    message: 'Please enter a valid price.'
                });
            }

            const [categories] = await db.query(
                'SELECT category_id FROM categories WHERE category_name = ?',
                [category]
            );

            if (categories.length === 0) {
                return res.status(400).json({
                    message: 'Invalid product category.'
                });
            }

            const imagePaths = (req.files || []).map(
                file => '/uploads/' + file.filename
            );

            const mainImage = imagePaths.length > 0
                ? imagePaths[0]
                : null;

            connection = await db.getConnection();
            await connection.beginTransaction();

            const [productResult] = await connection.query(
                `INSERT INTO products
                (
                    product_name,
                    description,
                    price,
                    image,
                    category_id,
                    flavour,
                    status
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    name.trim(),
                    description ? description.trim() : null,
                    numericPrice,
                    mainImage,
                    categories[0].category_id,
                    flavour,
                    available === 'true' ? 'Available' : 'Unavailable'
                ]
            );

            const productId = productResult.insertId;

            for (const imagePath of imagePaths) {
                await connection.query(
                    `INSERT INTO product_images
                    (product_id, image_path)
                    VALUES (?, ?)`,
                    [productId, imagePath]
                );
            }

            await connection.commit();

            res.status(201).json({
                message: 'Product added successfully.',
                productId: productId
            });

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }

            console.error('Error adding product:', error.message);

            res.status(500).json({
                message: 'Failed to add product.'
            });

        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
);


// ==========================================
// ADMIN - UPDATE PRODUCT
// ==========================================

app.put(
    '/api/admin/products/:id',
    upload.array('images', 10),
    async (req, res) => {
        let connection;

        try {
            const productId = Number(req.params.id);

            if (!Number.isInteger(productId) || productId <= 0) {
                return res.status(400).json({
                    message: 'Invalid product ID.'
                });
            }

            const {
                name,
                price,
                category,
                flavour,
                description,
                available
            } = req.body;

            const numericPrice = Number(price);

            if (
                !name ||
                !category ||
                !flavour ||
                !Number.isFinite(numericPrice) ||
                numericPrice <= 0
            ) {
                return res.status(400).json({
                    message: 'Please enter valid product details.'
                });
            }

            const [existingProducts] = await db.query(
                `SELECT product_id, image
                 FROM products
                 WHERE product_id = ?`,
                [productId]
            );

            if (existingProducts.length === 0) {
                return res.status(404).json({
                    message: 'Product not found.'
                });
            }

            const [categories] = await db.query(
                'SELECT category_id FROM categories WHERE category_name = ?',
                [category]
            );

            if (categories.length === 0) {
                return res.status(400).json({
                    message: 'Invalid product category.'
                });
            }

            connection = await db.getConnection();
            await connection.beginTransaction();

            let mainImage = existingProducts[0].image;

            // Replace gallery images only if new images are uploaded
            if (req.files && req.files.length > 0) {
                const imagePaths = req.files.map(
                    file => '/uploads/' + file.filename
                );

                mainImage = imagePaths[0];

                await connection.query(
                    'DELETE FROM product_images WHERE product_id = ?',
                    [productId]
                );

                for (const imagePath of imagePaths) {
                    await connection.query(
                        `INSERT INTO product_images
                        (product_id, image_path)
                        VALUES (?, ?)`,
                        [productId, imagePath]
                    );
                }
            }

            await connection.query(
                `UPDATE products
                 SET
                    product_name = ?,
                    description = ?,
                    price = ?,
                    image = ?,
                    category_id = ?,
                    flavour = ?,
                    status = ?
                 WHERE product_id = ?`,
                [
                    name.trim(),
                    description ? description.trim() : null,
                    numericPrice,
                    mainImage,
                    categories[0].category_id,
                    flavour,
                    available === 'true' ? 'Available' : 'Unavailable',
                    productId
                ]
            );

            await connection.commit();

            res.json({
                message: 'Product updated successfully.'
            });

        } catch (error) {
            if (connection) {
                await connection.rollback();
            }

            console.error('Error updating product:', error.message);

            res.status(500).json({
                message: 'Failed to update product.'
            });

        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
);


// ==========================================
// ADMIN - DELETE PRODUCT
// ==========================================

app.delete('/api/admin/products/:id', async (req, res) => {
    try {
        const productId = Number(req.params.id);

        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({
                message: 'Invalid product ID.'
            });
        }

        const [result] = await db.query(
            'DELETE FROM products WHERE product_id = ?',
            [productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Product not found.'
            });
        }

        res.json({
            message: 'Product deleted successfully.'
        });

    } catch (error) {
        console.error('Error deleting product:', error.message);

        res.status(500).json({
            message: 'Failed to delete product.'
        });
    }
});

// ==========================================
// ADMIN - DASHBOARD STATISTICS
// ==========================================

app.get('/api/admin/dashboard-stats', async (req, res) => {
    try {
        const [stats] = await db.query(`
            SELECT
                (SELECT COUNT(*) FROM products) AS totalProducts,
                (SELECT COUNT(*) FROM orders) AS totalOrders,
                (SELECT COUNT(*) FROM orders
                 WHERE order_status = 'Pending') AS pendingOrders,
                (SELECT COUNT(*) FROM customers) AS totalCustomers
        `);

        res.json(stats[0]);

    } catch (error) {
        console.error('Error fetching dashboard statistics:', error.message);

        res.status(500).json({
            message: 'Failed to retrieve dashboard statistics.'
        });
    }
});

// ==========================================
// CUSTOMER REGISTRATION API
// ==========================================

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

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(email)) {
            return res.status(400).json({
                message: 'Please enter a valid email address.'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password must contain at least 8 characters.'
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                message: 'Passwords do not match.'
            });
        }

        if (terms !== true && terms !== 'on') {
            return res.status(400).json({
                message: 'Please accept the terms and conditions.'
            });
        }

        const [existingCustomers] = await db.query(
            'SELECT customer_id FROM customers WHERE email = ?',
            [email.trim().toLowerCase()]
        );

        if (existingCustomers.length > 0) {
            return res.status(409).json({
                message: 'This email address is already registered.'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

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


// ==========================================
// CUSTOMER LOGIN API
// ==========================================

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Please enter your email and password.'
            });
        }

        const [customers] = await db.query(
            `SELECT customer_id, full_name, email, phone, password
             FROM customers
             WHERE email = ?`,
            [email.trim().toLowerCase()]
        );

        if (customers.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

        const customer = customers[0];

        const passwordMatch = await bcrypt.compare(
            password,
            customer.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Invalid email or password.'
            });
        }

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


// ==========================================
// CUSTOMER ORDER PLACEMENT API
// ==========================================

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

        const parsedCustomerId = Number(customerId);

        if (
            !Number.isInteger(parsedCustomerId) ||
            parsedCustomerId <= 0
        ) {
            return res.status(400).json({
                message: 'Invalid customer information.'
            });
        }

        if (!deliveryDate || !deliveryAddress || !paymentMethod) {
            return res.status(400).json({
                message: 'Please complete all required delivery details.'
            });
        }

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

        const [customers] = await db.query(
            'SELECT customer_id FROM customers WHERE customer_id = ?',
            [parsedCustomerId]
        );

        if (customers.length === 0) {
            return res.status(404).json({
                message: 'Customer account not found.'
            });
        }

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

        connection = await db.getConnection();

        await connection.beginTransaction();

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

        await connection.commit();

        res.status(201).json({
            message: 'Your order has been placed successfully!',
            orderId: orderId,
            subtotal: subtotal,
            deliveryFee: deliveryFee,
            total: total
        });

    } catch (error) {
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

// ==========================================
// ADMIN - GET ALL CUSTOMER ORDERS
// ==========================================

app.get('/api/admin/orders', async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT
                o.order_id,
                o.customer_id,
                c.full_name,
                c.email,
                c.phone,
                o.order_date,
                o.delivery_date,
                o.delivery_address,
                o.delivery_note,
                o.payment_method,
                o.subtotal,
                o.delivery_fee,
                o.total,
                o.order_status
            FROM orders o
            INNER JOIN customers c
                ON o.customer_id = c.customer_id
            ORDER BY o.order_date DESC
        `);

        const [orderItems] = await db.query(`
            SELECT
                order_item_id,
                order_id,
                product_id,
                product_name,
                product_price,
                cake_size,
                quantity,
                item_total
            FROM order_items
            ORDER BY order_item_id ASC
        `);

        const itemsMap = {};

        orderItems.forEach(item => {
            if (!itemsMap[item.order_id]) {
                itemsMap[item.order_id] = [];
            }

            itemsMap[item.order_id].push(item);
        });

        const result = orders.map(order => ({
            ...order,
            items: itemsMap[order.order_id] || []
        }));

        res.json(result);

    } catch (error) {
        console.error('Error fetching orders:', error.message);

        res.status(500).json({
            message: 'Failed to retrieve customer orders.'
        });
    }
});

// ==========================================
// ADMIN - GET SINGLE ORDER BY ID
// ==========================================

app.get('/api/admin/orders/:id', async (req, res) => {
    try {
        const orderId = Number(req.params.id);

        // Validate order ID
        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                message: 'Invalid order ID.'
            });
        }

        // Get order and customer details
        const [orders] = await db.query(`
            SELECT
                o.order_id,
                o.customer_id,
                c.full_name,
                c.email,
                c.phone,
                o.order_date,
                o.delivery_date,
                o.delivery_address,
                o.delivery_note,
                o.payment_method,
                o.subtotal,
                o.delivery_fee,
                o.total,
                o.order_status
            FROM orders o
            INNER JOIN customers c
                ON o.customer_id = c.customer_id
            WHERE o.order_id = ?
        `, [orderId]);

        // Check whether order exists
        if (orders.length === 0) {
            return res.status(404).json({
                message: 'Order not found.'
            });
        }

        // Get items belonging to this order
        const [items] = await db.query(`
            SELECT
                order_item_id,
                order_id,
                product_id,
                product_name,
                product_price,
                cake_size,
                quantity,
                item_total
            FROM order_items
            WHERE order_id = ?
            ORDER BY order_item_id ASC
        `, [orderId]);

        // Return order with its items
        const result = {
            ...orders[0],
            items: items
        };

        res.json(result);

    } catch (error) {
        console.error('Error fetching single order:', error.message);

        res.status(500).json({
            message: 'Failed to retrieve order details.'
        });
    }
});

// ==========================================
// ADMIN - UPDATE ORDER STATUS
// ==========================================

app.put('/api/admin/orders/:id/status', async (req, res) => {
    try {
        const orderId = Number(req.params.id);
        const { orderStatus } = req.body;

        // Validate order ID
        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                message: 'Invalid order ID.'
            });
        }

        // Allow only Pending and Completed statuses
        const allowedStatuses = ['Pending', 'Completed'];

        if (!allowedStatuses.includes(orderStatus)) {
            return res.status(400).json({
                message: 'Invalid order status. Only Pending and Completed are allowed.'
            });
        }

        // Check whether order exists
        const [orders] = await db.query(
            'SELECT order_id FROM orders WHERE order_id = ?',
            [orderId]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                message: 'Order not found.'
            });
        }

        // Update order status
        await db.query(
            `UPDATE orders
             SET order_status = ?
             WHERE order_id = ?`,
            [orderStatus, orderId]
        );

        res.json({
            message: 'Order status updated successfully.',
            orderId: orderId,
            orderStatus: orderStatus
        });

    } catch (error) {
        console.error('Error updating order status:', error.message);

        res.status(500).json({
            message: 'Failed to update order status.'
        });
    }
});

// ==========================================
// IMAGE UPLOAD ERROR HANDLER
// ==========================================

app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({
            message: 'Image upload failed. Each image must be 5MB or smaller, with a maximum of 10 images.'
        });
    }

    if (error) {
        return res.status(400).json({
            message: error.message
        });
    }

    next();
});


// ==========================================
// START THE SERVER
// ==========================================

app.listen(PORT, () => {
    console.log(`Sugar Spark Cakes server running at http://localhost:${PORT}`);
    connectDatabase();
});
