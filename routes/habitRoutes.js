const express = require('express');

const router = express.Router();

const {
    createHabit,
    getHabits
} = require('../controllers/habitController');

const {
    protect
} = require('../middleware/authMiddleware');

router.post('/', protect, createHabit);
router.get('/', protect, getHabits);

module.exports = router;