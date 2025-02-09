const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema({
    message: {
        type: String,
        required: true,
        trim: true,
    },
    lastUpdatedAt: {
        type: Date,
        default: Date.now,
    },
    subjectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
        required: true,
    }
});

module.exports = mongoose.model("Notice", noticeSchema);