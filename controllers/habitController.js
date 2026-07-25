const Habit = require('../models/Habit');

const createHabit = async (req, res) => {
    try {
        const { title, description, frequency } = req.body;
        const habit = await Habit.create({
            user: req.user._id,
            title,
            description,
            frequency
        });
        res.status(201).json(habit);
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
        const habitsWithStreak = habits.map(habit => {
            return {
                ...habit._doc,
                streak: calculateStreak(habit.completedDates)
            };
        });
        res.json(habitsWithStreak);
    } catch (error) {
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
                alreadyCompleted = habit.completedDates.some(date => new Date(date).toDateString() === today.toDateString() );
                break;
            case 'Weekly':
                alreadyCompleted = habit.completedDates.some(date => {
                    const completedDate = new Date(date);
                    const startOfWeek = new Date(today);
                    startOfWeek.setDate(today.getDate() - today.getDay());
                    startOfWeek.setHours(0, 0, 0, 0);
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    endOfWeek.setHours(23, 59, 59, 999);
                    return completedDate >= startOfWeek && completedDate <= endOfWeek;
                });
                break;
            case 'Monthly':
                alreadyCompleted = habit.completedDates.some(date => {
                    const completedDate = new Date(date);
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
        habit.completedDates.push(today);
        await habit.save();
        res.json(habit);
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
        const { title, description } = req.body;
        if (title !== undefined) {
            habit.title = title;
        }
        if (description !== undefined) {
            habit.description = description;
        }
        const updatedHabit = await habit.save();
        res.json(updatedHabit);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const calculateStreak = (completedDates) => {
    if (completedDates.length === 0) {
        return 0;
    }
    const sortedDates = completedDates
        .map(date => new Date(date))
        .sort((a, b) => b - a);
    let streak = 1;
    for (let i = 0; i < sortedDates.length - 1; i++) {
        const current = new Date(sortedDates[i]);
        const previous = new Date(sortedDates[i + 1]);

        current.setHours(0,0,0,0);
        previous.setHours(0,0,0,0);

        const diffTime = current - previous;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
};

module.exports = {
    createHabit,
    getHabits,
    completeHabit,
    deleteHabit,
    updateHabit
};