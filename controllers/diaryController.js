const Diary = require('../models/Diary');
// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------

// Convert YYYY-MM-DD into a local Date.
// This avoids JavaScript's UTC behaviour when parsing
// date-only strings.
const parseDiaryDate = (value) => {
    if (!value) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return today;
    }
    if (typeof value === 'string') {
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (match) {
            const year = Number(match[1]);
            const month = Number(match[2]) - 1;
            const day = Number(match[3]);
            const date = new Date(year, month, day);
            if (
                date.getFullYear() !== year ||
                date.getMonth() !== month ||
                date.getDate() !== day
            ) {
                return null;
            }
            date.setHours(0, 0, 0, 0);
            return date;
        }
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    date.setHours(0, 0, 0, 0);
    return date;
};


const getEndOfDay = (date) => {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
};


const getDiaryDate = (diary) => {
    // New diaries have diaryDate.
    // Older diaries fall back to createdAt.
    return diary.diaryDate || diary.createdAt;
};
// ---------------------------------------------------------
// CREATE DIARY
// ---------------------------------------------------------
const createDiary = async (req, res) => {
    try {
        const { title, content, diaryDate } = req.body;
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
        // If no date was supplied, this means today.
        const selectedDate = parseDiaryDate(diaryDate);
        if (!selectedDate) {
            return res.status(400).json({
                message: 'Please select a valid diary date.'
            });
        }
        // -------------------------------------------------
        // FUTURE DATE PROTECTION
        // -------------------------------------------------
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate > today) {
            return res.status(400).json({
                message: 'You cannot write a diary for a future date.'
            });
        }
        // -------------------------------------------------
        // CHECK WHETHER THIS DATE ALREADY HAS A DIARY
        // -------------------------------------------------
        const existingDiary = await Diary.findOne({
            user: req.user._id,
            $or: [
                {
                    diaryDate: {
                        $gte: selectedDate,
                        $lte: getEndOfDay(selectedDate)
                    }
                },
                {
                    diaryDate: { $exists: false },
                    createdAt: {
                        $gte: selectedDate,
                        $lte: getEndOfDay(selectedDate)
                    }
                }
            ]
        });
        if (existingDiary) {
            return res.status(400).json({
                message: 'You have already written a diary for this day.'
            });
        }
        // -------------------------------------------------
        // CREATE
        // -------------------------------------------------
        const diary = await Diary.create({
            user: req.user._id,
            title: title.trim(),
            content,
            diaryDate: selectedDate
        });
        res.status(201).json(diary);
    } catch (error) {
        console.error('Create diary error:', error);
        res.status(500).json({
            message: 'Unable to create diary.'
        });
    }
};
// ---------------------------------------------------------
// GET ALL DIARIES
// ---------------------------------------------------------

const getDiaries = async (req, res) => {
    try {
        const diaries = await Diary.find({
            user: req.user._id
        }).sort({
            diaryDate: -1, createdAt: -1
        });
        res.json(diaries);
    } catch (error) {
        console.error('Get diaries error:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

// ---------------------------------------------------------
// GET DIARY BY ID
// ---------------------------------------------------------
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
        console.error('Get diary error:', error);
        res.status(500).json({
            message: 'Unable to load diary.'
        });
    }
};
// ---------------------------------------------------------
// UPDATE DIARY
// ---------------------------------------------------------
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
        console.error('Update diary error:', error);
        res.status(500).json({
            message: 'Unable to update diary.'
        });
    }
};

// ---------------------------------------------------------
// DELETE DIARY
// ---------------------------------------------------------
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
        console.error('Delete diary error:', error);
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