const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    attachments: {
        type: [String],
        validate: [arrayLimit, 'Attachments cannot exceed 2 files'],
        default: []
    },
    status: {
        type: String,
        enum: ['active', 'new', 'resolved'],
        default: 'new'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

function arrayLimit(val) {
    return val.length <= 2;
}

// Update the updatedAt field on save
feedbackSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;