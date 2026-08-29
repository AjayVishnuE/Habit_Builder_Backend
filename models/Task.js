const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200
        },

        description: {
            type: String,
            default: '',
            trim: true
        },

        dueDate: {
            type: Date,
            required: false
        },

        priority: {
            type: String,
            enum: ['Low', 'Medium', 'High'],
            default: 'Medium'
        },

        completed: {
            type: Boolean,
            default: false
        },

        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Task', taskSchema);