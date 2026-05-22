const express = require('express');

const router = express.Router();

const {
    createHabit,
    getHabits,
    completeHabit
} = require('../controllers/habitController');

const {
    protect
} = require('../middleware/authMiddleware');

router.post('/', protect, createHabit);
router.get('/', protect, getHabits);
router.put('/:id/complete', protect, completeHabit);

module.exports = router;