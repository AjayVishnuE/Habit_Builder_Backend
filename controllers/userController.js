const User = require('../models/User');
const bcrypt = require('bcryptjs');
const generateToken = require('../utils/generateToken');
const Habit = require('../models/Habit');
const Diary = require('../models/Diary');
const Task = require('../models/Task');
const Note = require('../models/Note');

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                message: 'User already exists'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: generateToken(user._id)
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({
                message: 'Invalid email or password'
            });
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const getMe = async (req, res) => {
    res.json(req.user);
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({
                message: 'Name is required'
            });
        }
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }
        user.name = name.trim();
        await user.save();
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            profileImage: user.profileImage
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


const getProfileStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const habits = await Habit.find({
            user: userId
        });
        /*
         * --------------------------------------------------
         * BASIC HABIT DATA
         * --------------------------------------------------
         */
        const totalHabits = habits.length;
        let totalCompletions = 0;
        habits.forEach(habit => {
            totalCompletions += habit.completedHistory.length;
        });
        /*
         * --------------------------------------------------
         * OLDEST HABIT
         * --------------------------------------------------
         */
        let oldestHabit = null;
        if (habits.length > 0) {
            const habit = [...habits].sort(
                (a, b) => a.createdAt - b.createdAt
            )[0];
            const durationDays = Math.floor(
                (Date.now() - new Date(habit.createdAt).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            oldestHabit = {
                title: habit.title,
                startedAt: habit.createdAt,
                durationDays
            };
        }
        /*
         * --------------------------------------------------
         * MOST COMPLETED HABIT
         * --------------------------------------------------
         */
        let mostCompletedHabit = null;
        if (habits.length > 0) {
            const habit = [...habits].sort(
                (a, b) =>
                    b.completedHistory.length -
                    a.completedHistory.length
            )[0];
            mostCompletedHabit = {
                title: habit.title,
                completions: habit.completedHistory.length
            };
        }
        /*
         * --------------------------------------------------
         * LONGEST MAINTAINED HABIT
         * --------------------------------------------------
         *
         * For now this is based on the span between the
         * habit's first and latest completion.
         *
         * This works directly with your existing
         * completedHistory data.
         */
        let longestMaintainedHabit = null;
        for (const habit of habits) {
            if (habit.completedHistory.length === 0) {
                continue;
            }
            const dates = habit.completedHistory
                .map(entry => new Date(entry.completedAt).getTime())
                .sort((a, b) => a - b);
            const firstCompletion = dates[0];
            const latestCompletion = dates[dates.length - 1];
            const durationDays = Math.floor(
                (latestCompletion - firstCompletion) /
                (1000 * 60 * 60 * 24)
            ) + 1;
            if (
                !longestMaintainedHabit ||
                durationDays > longestMaintainedHabit.durationDays
            ) {
                longestMaintainedHabit = {
                    title: habit.title,
                    durationDays,
                    startedAt: new Date(firstCompletion),
                    latestCompletion: new Date(latestCompletion)
                };
            }
        }
        /*
         * --------------------------------------------------
         * BEST STREAK
         * --------------------------------------------------
         */

        let bestStreak = null;
        for (const habit of habits) {
            if (habit.frequency !== 'Daily') {
                continue;
            }
            const dates = habit.completedHistory
                .map(entry => {
                    const date = new Date(entry.completedAt);

                    return new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate()
                    ).getTime();
                })
                .sort((a, b) => a - b);
            const uniqueDates = [...new Set(dates)];
            let currentStreak = 0;
            let longestStreak = 0;
            let streakStart = null;
            let bestStreakStart = null;
            let bestStreakEnd = null;
            for (let i = 0; i < uniqueDates.length; i++) {
                if (i === 0) {
                    currentStreak = 1;
                    streakStart = uniqueDates[i];
                } else {
                    const difference =
                        (uniqueDates[i] - uniqueDates[i - 1]) /
                        (1000 * 60 * 60 * 24);

                    if (difference === 1) {
                        currentStreak++;
                    } else {
                        currentStreak = 1;
                        streakStart = uniqueDates[i];
                    }
                }
                if (currentStreak > longestStreak) {
                    longestStreak = currentStreak;
                    bestStreakStart = streakStart;
                    bestStreakEnd = uniqueDates[i];
                }
            }
            if (
                !bestStreak ||
                longestStreak > bestStreak.days
            ) {
                bestStreak = {
                    title: habit.title,
                    days: longestStreak,
                    startDate: new Date(bestStreakStart),
                    endDate: new Date(bestStreakEnd)
                };
            }
        }
        /*
         * --------------------------------------------------
         * MOST ACTIVE DAY
         * --------------------------------------------------
         */
        const dayCounts = {
            Sunday: 0,
            Monday: 0,
            Tuesday: 0,
            Wednesday: 0,
            Thursday: 0,
            Friday: 0,
            Saturday: 0
        };
        habits.forEach(habit => {
            habit.completedHistory.forEach(entry => {
                const date = new Date(entry.completedAt);
                const day = date.toLocaleDateString('en-US', {
                    weekday: 'long'
                });
                dayCounts[day]++;
            });
        });
        let mostActiveDay = null;
        Object.entries(dayCounts).forEach(
            ([day, count]) => {
                if (
                    count > 0 &&
                    (!mostActiveDay ||
                    count > mostActiveDay.completions)
                ) {
                    mostActiveDay = {
                        day,
                        completions: count
                    };
                }
            }
        );
        /*
         * --------------------------------------------------
         * MOST CONSISTENT HABIT
         * --------------------------------------------------
         *
         * Consistency is calculated differently according
         * to habit frequency.
         */
        let mostConsistentHabit = null;
        for (const habit of habits) {
            const completions = habit.completedHistory.length;
            if (completions === 0) {
                continue;
            }
            const createdAt = new Date(habit.createdAt);
            const today = new Date();
            const daysSinceCreation = Math.max(
                1,
                Math.floor(
                    (today - createdAt) /
                    (1000 * 60 * 60 * 24)
                ) + 1
            );
            let expected = 1;
            if (habit.frequency === 'Daily') {
                expected = daysSinceCreation;
            }
            if (habit.frequency === 'Weekly') {
                expected = Math.max(
                    1,
                    Math.ceil(daysSinceCreation / 7)
                );
            }
            if (habit.frequency === 'Monthly') {
                expected = Math.max(
                    1,
                    Math.ceil(daysSinceCreation / 30)
                );
            }
            const completionRate = Math.min(
                100,
                (completions / expected) * 100
            );
            if (
                !mostConsistentHabit ||
                completionRate >
                mostConsistentHabit.completionRate
            ) {
                mostConsistentHabit = {
                    title: habit.title,
                    frequency: habit.frequency,
                    completionRate: Math.round(completionRate),
                    completions
                };
            }
        }
        /*
         * --------------------------------------------------
         * OTHER SUMMARY DATA
         * --------------------------------------------------
         */
        const totalDiaries = await Diary.countDocuments({
            user: userId
        });
        const totalTasks = await Task.countDocuments({
            user: userId
        });
        const completedTasks = await Task.countDocuments({
            user: userId,
            completed: true
        });
        const totalNotes = await Note.countDocuments({
            user: userId
        });
        /*
         * --------------------------------------------------
         * RESPONSE
         * --------------------------------------------------
         */
        res.json({
            geekStats: {
                oldestHabit,
                mostConsistentHabit,
                longestMaintainedHabit,
                bestStreak,
                mostCompletedHabit,
                mostActiveDay
            },
            summary: {
                totalHabits,
                totalCompletions,
                totalDiaries,
                totalTasks,
                completedTasks,
                totalNotes
            }
        });
    } catch (error) {
        console.error('Profile stats error:', error);
        res.status(500).json({
            message: error.message
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    getProfile,
    updateProfile,
    getProfileStats
};