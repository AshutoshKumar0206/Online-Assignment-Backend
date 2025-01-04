const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  rollNo:{
    type: String,
    default: 'BTECH/XXXXX/XX',
  },
  branch:{
    type: String,
    default: 'XXXXXXXXXXXXXXXXX',
  },
  semester:{
    type: String,
    default: 'X',    
  },
  section:{
    type: String,
    default: 'X',     
  },
  contact:{
    type: String,
    default: "XXXXXXXXXX"
  },
  password: {
    type: String,
    required: true,
  },
  token: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    default: 'student',
  },
  subjects: {
    type: [String], // Array of subject IDs the user is associated with
    ref: 'Subject', // References the Subject model
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', UserSchema);
