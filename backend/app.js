// app.js or server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db'); // Assuming you have a database connection file
require('dotenv').config();

const app = express();

// Use CORS to allow requests from the frontend
app.use(cors({
    origin: 'http://localhost:3000' // Replace this with the frontend URL
}));

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Connect to MongoDB
connectDB();

// Import and use your routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
