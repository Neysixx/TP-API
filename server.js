const express = require('express');
const db = require('./db'); // Database connection pool
const tasksRoutes = require('./routes/tasks'); // Task routing module

// Initialize Express application
const app = express();

// Middleware configuration for JSON request parsing
app.use(express.json());

// Database connection function with retry mechanism
const connectWithRetry = async () => {
    const MAX_RETRIES = 5;
    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            const connection = await db.getConnection();
            console.log('Successfully connected to MySQL database');

            // Verify database connection by fetching tasks
            const [rows] = await db.query('SELECT * FROM tasks');
            console.log('Tasks in database:', rows);

            connection.release(); // Return connection to pool
            return true;
        } catch (err) {
            retries++;
            console.log(`MySQL connection attempt ${retries}/${MAX_RETRIES} failed: ${err.message}`);

            if (retries === MAX_RETRIES) {
                console.error('Failed to connect to MySQL database after maximum retry attempts');
                return false;
            }

            // Delay between retry attempts
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

// Root endpoint definition
app.get('/', (req, res) => {
    res.send('Welcome to Task Manager API');
});

// Register task routes
app.use('/api/tasks', tasksRoutes);

// Server configuration
const port = process.env.PORT || 3000;

// Server initialization
const startServer = async () => {
    // Attempt database connection before starting server
    await connectWithRetry();

    // Start server regardless of database connection status
    app.listen(port, () => {
        console.log(`Express server running on port ${port}`);
    });
};

startServer();