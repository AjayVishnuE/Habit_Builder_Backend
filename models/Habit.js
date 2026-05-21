const mongoose = require('mongoose');

const habitSchema = mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },

    title: {
        type: String,
        required: true
    },

    description: {
        type: String
    },

    completedDates: [
        {
            type: Date
        }
    ]

}, {
    timestamps: true
});

module.exports = mongoose.model('Habit', habitSchema);