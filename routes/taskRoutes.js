const express = require('express');

const {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    toggleTask,
    deleteTask
} = require('../controllers/taskController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();


// Create task
router.post('/', protect, createTask);

// Get all tasks
router.get('/', protect, getTasks);

// Get task by ID
router.get('/:id', protect, getTaskById);

// Update task
router.put('/:id', protect, updateTask);

// Toggle completion
router.put('/:id/toggle', protect, toggleTask);

// Delete task
router.delete('/:id', protect, deleteTask);


module.exports = router;