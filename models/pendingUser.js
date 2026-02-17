const mongoose = require("mongoose");

const pendingUserSchema = new mongoose.Schema({
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
    sparse: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'teacher'],
    default: "student",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  rollNo:{
    type: String,
    default: 'BTECH/XXXXX/XX',
  },
});

module.exports = mongoose.model("PendingUser", pendingUserSchema);
