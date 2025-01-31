const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  senderId: 
  { type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true },
  receiverId: 
  { type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true },
  content: 
  { type: String, 
    required: true },
  status: 
  { type: String, 
    enum: ["unread", "read"], 
    default: "unread" },
  createdAt: 
  { type: Date, 
    default: Date.now }
});

const Notification = mongoose.model("Notification", NotificationSchema);

module.exports = Notification;