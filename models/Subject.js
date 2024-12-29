const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  subject_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  subject_name: {
    type: String,
    required: true
  },
  teacher_name: {
    type: String,
    required: true,
  },
  teacher_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User' // References the User model (Teacher)
  },
  students_id: {
    type: [String], // Array of student IDs
    ref: 'User', // References the User model (Students)
    default: []
  },
  assignments_id: {
    type: [String], // Array of assignment IDs
    ref: 'Assignment', // References the Assignment model
    default: []
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Subject', SubjectSchema);
