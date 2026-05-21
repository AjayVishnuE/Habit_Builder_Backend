const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

app.use(cors());

app.use(express.json());

const userRoutes = require('./routes/userRoutes');
const habitRoutes = require('./routes/habitRoutes');

app.use('/api/users', userRoutes);
app.use('/api/habits', habitRoutes);

app.get('/', (req, res) => {
    res.send('Backend Running');
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Server Started on ${PORT}`);
});