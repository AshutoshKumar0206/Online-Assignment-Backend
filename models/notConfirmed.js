// models/NotConfirmed.js
const mongoose = require("mongoose");

const NotConfirmedSchema = new mongoose.Schema({
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
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "teacher"],
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
  
  module.exports = mongoose.model("NotConfirmed", NotConfirmedSchema);
  