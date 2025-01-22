const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  deadline: {
    type: Date,
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to Subject as ObjectId
    ref: 'Subject',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  minVal: {
    type: Number,
    default: 0,
  },
  maxVal: {
    type: Number,
    required: true,
  },
  fileLink: {
    type: String,
  },
  filePublicId: {
    type: String, // Cloudinary's public ID for file management
  },
  open: {
    type: Boolean,
    default: true,
  }
});

module.exports = mongoose.model('Assignment', AssignmentSchema);
