const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileURL: {
      type: String,
      required: true,
    },
    submissionDate: {
      type: Date,
      default: Date.now,
    },
    grade: {
      type: String,
    },
    feedback: {
      type: String,
    },
    status: {
      type: String,
      enum: ['submitted', 'graded', 'late'],
      default: 'submitted',
    },
  });
  
  module.exports = mongoose.model('Submission', SubmissionSchema);