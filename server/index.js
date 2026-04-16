const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models'); // This pulls from models/index.js
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const uploadRoutes = require('./routes/upload');
const householdRoutes = require('./routes/households');
const insightsRoutes = require('./routes/insights');
app.use('/api/upload', uploadRoutes);
app.use('/api/households', householdRoutes);
app.use('/api/insights', insightsRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        householdsProcessed: 0,
        errors: [error.message]
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
        householdsProcessed: 0,
        errors: ['Route not found']
    });
});

app.listen(process.env.PORT, async () => {
    console.log(`server is running on port ${process.env.PORT}`);
    
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
        
        // Sync models
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully.');
    } catch (error) {
        console.error('Unable to connect/sync the database:', error);
    }
});