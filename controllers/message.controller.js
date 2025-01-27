const Message = require("../models/Message.model.js");

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
      console.log("Error in getMessages controller: ", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };

module.exports.sendMessage = async (req, res) => {
    try {
      const { text, image } = req.body;
      const {  id:receiverId } = req.params;
      const senderId = req.body.senderId;
      console.log("receiverId");
      console.log(receiverId);
      console.log(`senderId: ${senderId}`);
      
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
      });
  
      await newMessage.save();
  
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }
  
      res.status(201).json(newMessage);
    } catch (error) {
      console.log("Error in sendMessage controller: ", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };

  module.exports.deleteMessage = async (req, res) => {
    try {
      const { id } = req.params; 
      const userId = req.user.id; 
  
      const message = await Message.findById(id);
  
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      
      // if (message.senderId !== userId) {
      //   return res.status(403).json({ error: "Unauthorized to delete this message" });
      // }
  
      await Message.findByIdAndDelete(id);
  
      res.status(200).json({ success: true, message: "Message deleted successfully" });
    } catch (error) {
      console.log("Error in deleteMessage controller: ", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  };