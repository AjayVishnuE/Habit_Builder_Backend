const Diary = require('../models/Diary');

// CREATE DIARY
// CREATE DIARY
const createDiary = async (req, res) => {
    try {
        const { title, content } = req.body;
        if (!title || !title.trim()) {
            return res.status(400).json({
                message: 'Diary title is required'
            });
        }
        if (!content || !content.trim()) {
            return res.status(400).json({
                message: 'Diary content is required'
            });
        }
        // Get today's date range
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Check whether user already has a diary today
        const existingDiary = await Diary.findOne({
            user: req.user._id,
            createdAt: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });
        if (existingDiary) {
            return res.status(400).json({
                message: 'You have already written a diary for today.'
            });
        }
        const diary = await Diary.create({
            user: req.user._id,
            title: title.trim(),
            content
        });
        res.status(201).json(diary);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// GET ALL DIARIES
const getDiaries = async (req, res) => {
    try {
        const diaries = await Diary.find({
            user: req.user._id
        }).sort({
            createdAt: -1
        });

        res.json(diaries);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// GET DIARY BY ID
const getDiaryById = async (req, res) => {
    try {
        const diary = await Diary.findById(req.params.id);

        if (!diary) {
            return res.status(404).json({
                message: 'Diary not found'
            });
        }

        if (diary.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                message: 'Not authorized'
            });
        }

        res.json(diary);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// UPDATE DIARY
const updateDiary = async (req, res) => {
    try {
        const diary = await Diary.findById(req.params.id);

        if (!diary) {
            return res.status(404).json({
                message: 'Diary not found'
            });
        }

        if (diary.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                message: 'Not authorized'
            });
        }

        const { title, content } = req.body;

        if (title !== undefined) {
            if (!title.trim()) {
                return res.status(400).json({
                    message: 'Diary title cannot be empty'
                });
            }

            diary.title = title.trim();
        }

        if (content !== undefined) {
            if (!content.trim()) {
                return res.status(400).json({
                    message: 'Diary content cannot be empty'
                });
            }

            diary.content = content;
        }

        const updatedDiary = await diary.save();

        res.json(updatedDiary);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


// DELETE DIARY
const deleteDiary = async (req, res) => {
    try {
        const diary = await Diary.findById(req.params.id);

        if (!diary) {
            return res.status(404).json({
                message: 'Diary not found'
            });
        }

        if (diary.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                message: 'Not authorized'
            });
        }

        await diary.deleteOne();

        res.json({
            message: 'Diary deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


module.exports = {
    createDiary,
    getDiaries,
    getDiaryById,
    updateDiary,
    deleteDiary
};