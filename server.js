const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cors = require('cors'); // Add cors package
const pool = require('./db');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Register a new user
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
            [username, email, hashedPassword]
        );
        res.json(newUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get all products
app.get('/products', async (req, res) => {
    try {
        const products = await pool.query('SELECT * FROM products');
        res.json(products.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Purchase a product
app.post('/purchase', async (req, res) => {
    const { user_id, product_id, quantity } = req.body;

    try {
        const product = await pool.query('SELECT * FROM products WHERE product_id = $1', [product_id]);
        if (product.rows.length === 0) {
            return res.status(404).json('Product not found');
        }

        const totalAmount = product.rows[0].price * quantity;

        // Start transaction
        await pool.query('BEGIN');

        // Insert into transactions
        const newTransaction = await pool.query(
            'INSERT INTO transactions (user_id, product_id, quantity, total_amount) VALUES ($1, $2, $3, $4) RETURNING *',
            [user_id, product_id, quantity, totalAmount]
        );

        // Decrease product stock
        await pool.query('UPDATE products SET stock_quantity = stock_quantity - $1 WHERE product_id = $2', [
            quantity,
            product_id,
        ]);

        // Commit transaction
        await pool.query('COMMIT');

        res.json(newTransaction.rows[0]);
    } catch (err) {
        // Rollback transaction if error occurs
        await pool.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
