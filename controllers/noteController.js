const Note = require('../models/Note');


// CREATE NOTE
const createNote = async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({
                message: 'Note title is required'
            });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({
                message: 'Note content is required'
            });
        }

        const note = await Note.create({
            user: req.user._id,
            title: title.trim(),
            content
        });

        res.status(201).json(note);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// GET ALL NOTES
const getNotes = async (req, res) => {
    try {
        const notes = await Note.find({
            user: req.user._id
        }).sort({
            updatedAt: -1
        });

        res.json(notes);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// GET NOTE BY ID
const getNoteById = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({
                message: 'Note not found'
            });
        }

        if (
            note.user.toString() !==
            req.user._id.toString()
        ) {
            return res.status(401).json({
                message: 'Not authorized'
            });
        }

        res.json(note);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// UPDATE NOTE
const updateNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({
                message: 'Note not found'
            });
        }

        if (
            note.user.toString() !==
            req.user._id.toString()
        ) {
            return res.status(401).json({
                message: 'Not authorized'
            });
        }

        const { title, content } = req.body;

        if (title !== undefined) {
            if (!title.trim()) {
                return res.status(400).json({
                    message: 'Note title cannot be empty'
                });
            }

            note.title = title.trim();
        }

        if (content !== undefined) {
            if (!content.trim()) {
                return res.status(400).json({
                    message: 'Note content cannot be empty'
                });
            }

            note.content = content;
        }

        const updatedNote = await note.save();

        res.json(updatedNote);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// DELETE NOTE
const deleteNote = async (req, res) => {
    try {
        const note = await Note.findById(req.params.id);

        if (!note) {
            return res.status(404).json({
                message: 'Note not found'
            });
        }

        if (
            note.user.toString() !==
            req.user._id.toString()
        ) {
            return res.status(401).json({
                message: 'Not authorized'
            });
        }

        await note.deleteOne();

        res.json({
            message: 'Note deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


module.exports = {
    createNote,
    getNotes,
    getNoteById,
    updateNote,
    deleteNote
};