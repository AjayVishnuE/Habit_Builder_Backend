const Habit = require('../models/Habit');
const { calculateCurrentStreak,calculateLongestStreak } = require('../utils/streak.util');

const createHabit = async (req, res) => {
    try {
        const { title, description, frequency } = req.body;
        const habit = await Habit.create({
            user: req.user._id,
            title,
            description,
            frequency
        });
        res.status(201).json({
            ...habit._doc,
            currentStreak: 0,
            longestStreak: 0
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getHabits = async (req, res) => {
    try {
        const habits = await Habit.find({
            user: req.user._id
        });
        const response = habits.map(habit => ({
            ...habit._doc,
            currentStreak: calculateCurrentStreak( habit.completedHistory, habit.frequency ),
            longestStreak: calculateLongestStreak( habit.completedHistory, habit.frequency )
        }));
        res.json(response);
    }
    catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const completeHabit = async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);
        if (!habit) {
            return res.status(404).json({
                message: 'Habit not found'
            });
        }
        if (habit.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                message: 'Not authorized'
            });
        }
        const today = new Date();
        let alreadyCompleted = false;
        switch (habit.frequency) {
            case 'Daily':
                alreadyCompleted = habit.completedHistory.some(entry =>
                    new Date(entry.completedAt).toDateString() === today.toDateString()
                );
                break;
            case 'Weekly':
                alreadyCompleted = habit.completedHistory.some(entry => {
                    const completedDate = new Date(entry.completedAt);
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - today.getDay());
                    startOfWeek.setHours(0, 0, 0, 0);
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    endOfWeek.setHours(23, 59, 59, 999);
                    return (
                        completedDate >= startOfWeek &&
                        completedDate <= endOfWeek
                    );
                });
                break;
            case 'Monthly':
                alreadyCompleted = habit.completedHistory.some(entry => {
                    const completedDate = new Date(entry.completedAt);
                    return (
                        completedDate.getMonth() === today.getMonth() &&
                        completedDate.getFullYear() === today.getFullYear()
                    );
                });
                break;
            default:
                alreadyCompleted = false;
        }
        if (alreadyCompleted) {
            return res.status(400).json({
                message: `Habit already completed for this ${habit.frequency.toLowerCase()}`
            });
        }
        habit.completedHistory.push({
            completedAt: today,
            remark: req.body.remark || '',
            mood: req.body.mood || 'Good',
            duration: req.body.duration || 0
        });
        await habit.save();
        res.json({
            ...habit._doc,
            currentStreak: calculateCurrentStreak( habit.completedHistory, habit.frequency ),
            longestStreak: calculateLongestStreak( habit.completedHistory, habit.frequency )
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const deleteHabit = async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);
        if (!habit) {
            return res.status(404).json({
                message: "Habit not found"
            });
        }
        if (habit.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                message: "Not authorized"
            });
        }
        await habit.deleteOne();
        res.json({
            message: "Habit deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const updateHabit = async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);
        if (!habit) {
            return res.status(404).json({
                message: "Habit not found"
            });
        }
        if (habit.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({
                message: "Not authorized"
            });
        }
        const { title, description, frequency } = req.body;
        if (title !== undefined) {
            habit.title = title;
        }
        if (description !== undefined) {
            habit.description = description;
        }
        if (frequency !== undefined) {
            habit.frequency = frequency;
        }
        const updatedHabit = await habit.save();
        res.json({
            ...updatedHabit._doc,
            currentStreak: calculateCurrentStreak( updatedHabit.completedHistory, updatedHabit.frequency ),
            longestStreak: calculateLongestStreak( updatedHabit.completedHistory, updatedHabit.frequency )
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getHabitById = async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);
        if (!habit) {
            return res.status(404).json({ message: 'Habit not found' });
        }
        if (habit.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        res.json({
            ...habit._doc,
            currentStreak: calculateCurrentStreak( habit.completedHistory, habit.frequency ),
            longestStreak: calculateLongestStreak( habit.completedHistory, habit.frequency )
        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }
};



module.exports = {
    createHabit,
    getHabits,
    completeHabit,
    deleteHabit,
    updateHabit,
    getHabitById
};