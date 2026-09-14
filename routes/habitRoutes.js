const express = require('express');

const router = express.Router();

const {
    createHabit,
    getHabits,
    completeHabit,
    deleteHabit,
    updateHabit,
    getHabitById,
    updateCompletion
} = require('../controllers/habitController');

const {
    protect
} = require('../middleware/authMiddleware');

router.post('/', protect, createHabit);
router.get('/', protect, getHabits);
router.put('/:id/complete', protect, completeHabit);
router.put('/:id/completion', protect, updateCompletion);
router.patch( '/:id/completions/:completionId', protect, updateCompletion );
router.delete('/:id', protect, deleteHabit);
router.put('/:id', protect, updateHabit);
router.get('/:id', protect, getHabitById);

module.exports = router;