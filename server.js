import express from 'express';
import bodyParser from 'body-parser';
import { run } from './main.js';
import cors from 'cors';


const app = express();
app.use(cors());
app.use(bodyParser.json());
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello, World! This is Express.js.');
});

app.post('/chatbot', async (req, res) => {
    const {question} = req.body;
    console.log(question);
    const answer = await run(question);
    res.json({
        message: answer
    });
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
