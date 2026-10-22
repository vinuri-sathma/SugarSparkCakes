
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve frontend files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Test API route
app.get('/api/health', (req, res) => {
    res.json({
        message: 'Sugar Spark Cakes server is running!'
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Sugar Spark Cakes server running at http://localhost:${PORT}`);
});
