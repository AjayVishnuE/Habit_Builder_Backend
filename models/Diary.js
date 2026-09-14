const mongoose = require('mongoose');

const diarySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        content: {
            type: String,
            required: true
        },
        diaryDate: {
            type: Date,
            default: Date.now
        }

    },
    {
        timestamps: true
    }
);

diarySchema.index(
    { user: 1, diaryDate: 1 },
    { unique: true, sparse: true }
);

module.exports = mongoose.model('Diary', diarySchema);