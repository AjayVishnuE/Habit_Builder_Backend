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

        res.json(habits);

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};

module.exports = {
    createHabit,
    getHabits
};