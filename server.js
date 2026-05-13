const express = require('express');
const dotenv = require('dotenv');

const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

app.get('/', (req, res) => {
    res.send('Backend Running');
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Server Started on ${PORT}`);
});