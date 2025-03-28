const Message = require("../models/Message.model.js");
const User = require("../models/User.js")
const cloudinary = require("../lib/cloudinary.js");
const { getReceiverSocketId, io } =require("../lib/socket.js");

module.exports.getMessages = async (req, res) => {
    try {
      const id = req.params.id
      const myId = req.user.id;
      
      const messages = await Message.find({
        $or: [
          { senderId: myId, receiverId: id },
          { senderId: id, receiverId: myId },
        ],
      });
  
      res.status(200).json(messages);
    } catch (error) {
      //console.log("Error in getMessages controller: ", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };

module.exports.sendMessage = async (req, res) => {
    try {
      const { text, image } = req.body;
      const {  id:receiverId } = req.params;
      const senderId = req.body.senderId;
      // console.log("receiverId");
      // console.log(receiverId);
      // console.log(`senderId: ${senderId}`);
      
      let imageUrl;
      if (image) {
        // Upload base64 image to cloudinary
        const uploadResponse = await cloudinary.uploader.upload(image);
        imageUrl = uploadResponse.secure_url;
      }
  
      const newMessage = new Message({
        senderId,
        receiverId,
        text,
        image: imageUrl,
        isRead:false
      });
  
      await newMessage.save();
  
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }
  
      res.status(201).json(newMessage);
    } catch (error) {
      //console.log("Error in sendMessage controller: ", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  module.exports.deleteMessage = async (req, res) => {
    try {
      const { id } = req.params; 
      const userId = req.user.id; 
      //console.log(`userId: ${userId}`);
  
      const message = await Message.findById(id);
      //console.log(`messageId: ${message.senderId}`);
  
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      
      if (message.senderId != userId) {
        return res.status(403).json({ error: "Unauthorized to delete this message" });
      }
  
      await Message.findByIdAndDelete(id);
  
      res.status(200).json({ success: true, message: "Message deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  };

  module.exports.unreadMessages = async (req, res) => {
    try {
      const currentUserId = req.user.id;
  
      // Fetch all users
      const users = await User.find();
  
      // Fetch unread messages for the current user
      const unreadMessagesCheck = await Message.find({
        receiverId: currentUserId,
        isRead: false,
      });
  
      // console.log("Unread Messages Check:", unreadMessagesCheck);
  
      // Group unread messages by senderId and count them
      const unreadMessages = unreadMessagesCheck.reduce((acc, message) => {
        const senderId = message.senderId.toString();
        if (!acc[senderId]) {
          acc[senderId] = 0;
        }
        acc[senderId] += 1;
        return acc;
      }, {});
  
      // Map unread message counts to users
      const userList = users.map((user) => {
        const unreadCount = unreadMessages[user._id.toString()] || 0;
        return {
          ...user.toObject(),
          unreadMessages: unreadCount,
        };
      });
  
      res.status(200).json(userList);
    } catch (error) {
      //console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
   
  module.exports.markAsRead = async(req,res) => {
    try {
      const { senderId } = req.body; // ID of the sender whose messages are being marked as read
      const receiverId = req.user.id;
  
      await Message.updateMany(
        { senderId, receiverId, isRead: false },
        { $set: { isRead: true } }
      );
  
      res.status(200).json({ message: 'Messages marked as read' });
    } catch (error) {
      //console.error('Error marking messages as read:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }