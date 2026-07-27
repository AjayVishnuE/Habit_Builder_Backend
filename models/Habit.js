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
    frequency: {
        type: String,
        enum: ['Daily', 'Weekly', 'Monthly'],
        default: 'Daily'
    },
    completedHistory: [
        {
            completedAt: {
                type: Date,
                required: true
            },
            remark: {
                type: String,
                default: ''
            },
            mood: {
                type: String,
                enum: ['Excellent', 'Good', 'Okay', 'Bad'],
                default: 'Good'
            },
            duration: {
                type: Number,
                default: 0
            }
        }
    ],
}, {
    timestamps: true
});

module.exports = mongoose.model('Habit', habitSchema);