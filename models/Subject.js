const mongoose = require('mongoose');

// Function to generate a unique 8-character subject code
async function generateUniqueSubjectCode() {
  const Subject = mongoose.model('Subject');
  let code;
  let isUnique = false;

  do {
    code = Array.from({ length: 8 }, () =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        .charAt(Math.floor(Math.random() * 62))
    ).join('');
    const existing = await Subject.findOne({ subject_code: code });
    isUnique = !existing;
  } while (!isUnique);

  return code;
}

const SubjectSchema = new mongoose.Schema({
  subject_name: {
    type: String,
    required: true
  },
  subject_id: {
    type: String,
    required: true
  },
  teacher_name: {
    type: String,
    required: true
  },
  teacher_id: {
    type: String,
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
  },
  notices_id: {
    type: [mongoose.Schema.Types.ObjectId], // Array of notice IDs
    ref: 'Notice', // References the Notice model
    default: []
  },
  subject_code: {
    type: String,
    required: true,
    unique: true,
    minlength: 8,
    maxlength: 8,
    match: /^[a-zA-Z0-9]{8}$/ // Ensures it matches the format
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Pre-save hook to generate subject_code if not provided
SubjectSchema.pre('save', async function (next) {
  if (!this.subject_code) {
    this.subject_code = await generateUniqueSubjectCode();
  }
  next();
});

module.exports = mongoose.model('Subject', SubjectSchema);
