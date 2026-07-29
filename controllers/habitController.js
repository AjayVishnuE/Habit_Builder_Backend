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
        const habitsWithStreak = habits.map(habit => ({
            ...habit._doc,
            streak: calculateStreak(habit.completedHistory)
        }));
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
        res.json(updatedHabit);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const calculateStreak = (completedHistory, frequency) => {
    if (!completedHistory || completedHistory.length === 0) {
        return 0;
    }
    const dates = completedHistory.map(entry => { const d = new Date(entry.completedAt);
        d.setHours(0, 0, 0, 0);
        return d;
    }).sort((a, b) => b.getTime() - a.getTime());
    let expected = new Date();
    expected.setHours(0, 0, 0, 0);
    if (!matchesPeriod(dates[0], expected, frequency)) {
        expected = moveBack(expected, frequency);
    }
    let streak = 0;
    for (const date of dates) {
        if (matchesPeriod(date, expected, frequency)) {
            streak++;
            expected = moveBack(expected, frequency);
        } else {
            break;
        }
    }
    return streak;
};

const calculateLongestStreak = (completedHistory) => {
    if (!completedHistory || completedHistory.length === 0) {
        return 0;
    }
    const dates = completedHistory.map(item => new Date(item.completedAt)).sort((a, b) => a - b);
    let longest = 1;
    let current = 1;
    for (let i = 1; i < dates.length; i++) {
        const previous = new Date(dates[i - 1]);
        const currentDate = new Date(dates[i]);
        previous.setHours(0,0,0,0);
        currentDate.setHours(0,0,0,0);
        const diff = (currentDate - previous) / (1000 * 60 * 60 * 24);
        if (diff === 1) {
            current++;
        } else {
            current = 1;
        }
        longest = Math.max(longest, current);
    }
    return longest;
};

const moveBack = (date, frequency) => {
    const d = new Date(date);
    switch (frequency) {
        case 'Daily':
            d.setDate(d.getDate() - 1);
            break;
        case 'Weekly':
            d.setDate(d.getDate() - 7);
            break;
        case 'Monthly':
            d.setMonth(d.getMonth() - 1);
            break;
    }
    d.setHours(0, 0, 0, 0);
    return d;
};

const matchesPeriod = (date1, date2, frequency) => {
    switch (frequency) {
        case 'Daily':
            return date1.toDateString() === date2.toDateString();
        case 'Weekly':
            return isSameWeek(date1, date2);
        case 'Monthly':
            return (
                date1.getMonth() === date2.getMonth() &&
                date1.getFullYear() === date2.getFullYear()
            );
        default:
            return false;
    }
};

const isSameWeek = (date1, date2) => {
    const startOfWeek = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        d.setDate(d.getDate() + diff);
        d.setHours(0, 0, 0, 0);
        return d;
    };
    return (
        startOfWeek(date1).getTime() === startOfWeek(date2).getTime()
    );
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
            streak: calculateStreak( habit.completedHistory, habit.frequency ),            
            longestStreak: calculateLongestStreak(habit.completedHistory)
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