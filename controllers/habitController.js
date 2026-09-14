const Habit = require('../models/Habit');
const { calculateCurrentStreak, calculateLongestStreak } = require('../utils/streak.util');

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
/*
 * Complete a habit.
 *
 * This supports both:
 *
 * 1. Normal completion:
 *    completedAt is omitted
 *    -> current date/time is used
 *
 * 2. Historical completion:
 *    completedAt is supplied
 *    -> selected past date is used
 *
 * Frequency rules remain:
 *
 * Daily   -> one completion per calendar day
 * Weekly  -> one completion per Monday-Sunday week
 * Monthly -> one completion per calendar month
 */
const completeHabit = async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);

        if (!habit) {
            return res.status(404).json({
                message: 'Habit not found'
            });
        }

        if (
            habit.user.toString() !==
            req.user._id.toString()
        ) {
            return res.status(401).json({
                message: 'Not authorized'
            });
        }

        const {
            remark,
            mood,
            duration,
            completedAt
        } = req.body;


        /*
         * If completedAt is supplied, this is a historical
         * completion. Otherwise use the current date/time.
         */
        const completionDate = completedAt
            ? new Date(completedAt)
            : new Date();


        if (isNaN(completionDate.getTime())) {
            return res.status(400).json({
                message: 'Invalid completion date'
            });
        }


        /*
         * Future dates are never allowed.
         */
        const today = new Date();

        if (completionDate > today) {
            return res.status(400).json({
                message:
                    'You cannot complete a habit for a future date'
            });
        }


        /*
         * A habit cannot be completed before the habit itself
         * was created.
         *
         * This matters mainly for historical entries.
         */
        if (
            habit.createdAt &&
            completionDate < new Date(habit.createdAt)
        ) {
            return res.status(400).json({
                message:
                    'You cannot complete a habit before it was created'
            });
        }


        /*
         * Validate mood when supplied.
         */
        const allowedMoods = [
            'Excellent',
            'Great',
            'Good',
            'Okay',
            'Bad'
        ];

        const finalMood = mood || 'Good';

        if (!allowedMoods.includes(finalMood)) {
            return res.status(400).json({
                message: 'Invalid mood'
            });
        }


        /*
         * Validate duration.
         */
        const finalDuration = Number(duration) || 0;

        if (finalDuration < 0) {
            return res.status(400).json({
                message: 'Duration cannot be negative'
            });
        }


        /*
         * Prevent duplicate completion according to
         * the habit frequency.
         */
        let alreadyCompleted = false;


        switch (habit.frequency) {

            case 'Daily':

                alreadyCompleted =
                    habit.completedHistory.some(entry => {

                        const completedDate =
                            new Date(entry.completedAt);

                        return (
                            completedDate.getFullYear() ===
                                completionDate.getFullYear()
                            &&
                            completedDate.getMonth() ===
                                completionDate.getMonth()
                            &&
                            completedDate.getDate() ===
                                completionDate.getDate()
                        );

                    });

                break;


            case 'Weekly': {

                /*
                 * Monday -> Sunday week.
                 */
                const startOfWeek =
                    new Date(completionDate);

                const day =
                    startOfWeek.getDay();

                const diff =
                    day === 0
                        ? -6
                        : 1 - day;

                startOfWeek.setDate(
                    startOfWeek.getDate() + diff
                );

                startOfWeek.setHours(
                    0,
                    0,
                    0,
                    0
                );


                const endOfWeek =
                    new Date(startOfWeek);

                endOfWeek.setDate(
                    endOfWeek.getDate() + 7
                );


                alreadyCompleted =
                    habit.completedHistory.some(entry => {

                        const completedDate =
                            new Date(entry.completedAt);

                        return (
                            completedDate >= startOfWeek
                            &&
                            completedDate < endOfWeek
                        );

                    });

                break;
            }


            case 'Monthly':

                alreadyCompleted =
                    habit.completedHistory.some(entry => {

                        const completedDate =
                            new Date(entry.completedAt);

                        return (
                            completedDate.getMonth() ===
                                completionDate.getMonth()
                            &&
                            completedDate.getFullYear() ===
                                completionDate.getFullYear()
                        );

                    });

                break;


            default:

                alreadyCompleted = false;
        }


        if (alreadyCompleted) {
            return res.status(400).json({
                message:
                    `Habit already completed for this ${habit.frequency.toLowerCase()}`
            });
        }


        /*
         * Create the completion.
         *
         * Mongoose automatically creates an _id for this
         * subdocument, which is what the edit functionality uses.
         */
        habit.completedHistory.push({
            completedAt: completionDate,
            remark: remark || '',
            mood: finalMood,
            duration: finalDuration
        });


        await habit.save();


        res.json({
            ...habit._doc,

            currentStreak:
                calculateCurrentStreak(
                    habit.completedHistory,
                    habit.frequency
                ),

            longestStreak:
                calculateLongestStreak(
                    habit.completedHistory,
                    habit.frequency
                )
        });

    } catch (error) {

        console.error(
            'Complete habit error:',
            error
        );

        res.status(500).json({
            message: error.message
        });
    }
};
/*
 * Update an existing completion.
 *
 * Supports BOTH:
 *
 * PUT  /api/habits/:id/completion
 * body: { completionId, mood, duration, remark }
 *
 * and
 *
 * PATCH /api/habits/:id/completions/:completionId
 *
 * This keeps your already-working edit functionality intact
 * while also making the PATCH route actually work.
 */
const updateCompletion = async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);
        if (!habit) {
            return res.status(404).json({
                message: 'Habit not found'
            });
        }
        if (
            habit.user.toString() !== req.user._id.toString()
        ) {
            return res.status(401).json({
                message: 'Not authorized'
            });
        }
        /*
         * Prefer the URL completionId when supplied.
         * Otherwise use the existing body-based completionId.
         */
        const completionId = req.params.completionId || req.body.completionId;
        const { mood, duration, remark } = req.body;
        if (!completionId) {
            return res.status(400).json({
                message: 'Completion ID is required'
            });
        }
        const completion = habit.completedHistory.id( completionId );
        if (!completion) {
            return res.status(404).json({
                message: 'Completion entry not found'
            });
        }
        if (mood !== undefined) {
            const allowedMoods = [
                'Excellent',
                'Great',
                'Good',
                'Okay',
                'Bad'
            ];
            if (!allowedMoods.includes(mood)) {
                return res.status(400).json({
                    message: 'Invalid mood'
                });
            }
            completion.mood = mood;
        }
        if (duration !== undefined) {
            const numericDuration = Number(duration);
            if ( Number.isNaN(numericDuration) || numericDuration < 0 ) {
                return res.status(400).json({
                    message: 'Duration must be a valid non-negative number'
                });
            }
            completion.duration = numericDuration;
        }
        if (remark !== undefined) {
            if ( typeof remark === 'string' && remark.length > 250 ) {
                return res.status(400).json({
                    message: 'Remark cannot exceed 250 characters'
                });
            }
            completion.remark = remark;
        }
        await habit.save();
        res.json({ ...habit._doc,
            currentStreak:
                calculateCurrentStreak(
                    habit.completedHistory,
                    habit.frequency
                ),
            longestStreak:
                calculateLongestStreak(
                    habit.completedHistory,
                    habit.frequency
                )
        });
    } catch (error) {
        console.error(
            'Update completion error:',
            error
        );
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
    getHabitById,
    updateCompletion
};