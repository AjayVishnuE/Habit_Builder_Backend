const express = require('express');

const {
    createNote,
    getNotes,
    getNoteById,
    updateNote,
    deleteNote
} = require('../controllers/noteController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();


// Create note
router.post('/', protect, createNote);

// Get all notes
router.get('/', protect, getNotes);

// Get note by ID
router.get('/:id', protect, getNoteById);

// Update note
router.put('/:id', protect, updateNote);

// Delete note
router.delete('/:id', protect, deleteNote);


module.exports = router;