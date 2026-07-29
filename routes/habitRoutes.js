const express = require('express');

const router = express.Router();

const {
    createHabit,
    getHabits,
    completeHabit,
    deleteHabit,
    updateHabit,
    getHabitById,
} = require('../controllers/habitController');

const {
    protect
} = require('../middleware/authMiddleware');

router.post('/', protect, createHabit);
router.get('/', protect, getHabits);
router.put('/:id/complete', protect, completeHabit);
router.delete('/:id', protect, deleteHabit);
router.put('/:id', protect, updateHabit);
router.get('/:id', protect, getHabitById);

module.exports = router;