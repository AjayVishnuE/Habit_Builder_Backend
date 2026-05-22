const Habit = require('../models/Habit');

const createHabit = async (req, res) => {

    try {

        const { title, description } = req.body;

        const habit = await Habit.create({

            user: req.user._id,
            title,
            description

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
        const alreadyCompletedToday = habit.completedDates.some((date) => {
            return new Date(date).toDateString() === today.toDateString();
        });

        if (alreadyCompletedToday) {
            return res.status(400).json({
                message: 'Habit already completed today'
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
    completeHabit
};