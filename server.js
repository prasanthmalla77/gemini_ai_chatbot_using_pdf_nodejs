// Import required modules
import express from 'express';
import { run } from './main.js';

// Create an Express application
const app = express();
const port = process.env.PORT || 3000; // Set port

// Define routes
app.get('/', (req, res) => {
  res.send('Hello, World! This is Express.js.');
});
app.post('/chatbot/:id', (req, res) => {
    const question = req.body;
    console.log(question);
    res.json({
        message: "received"
    });
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
