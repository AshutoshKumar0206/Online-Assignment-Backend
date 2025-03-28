const User = require("../models/User.js");
const {getReceiverSocketId, io} = require("../lib/socket.js");
const Notification = require("../models/Notification.js")

module.exports.createNotification = async(req,res) => {
    try {
        const { senderId, receiverId, content } = req.body;
        if (!senderId || !receiverId) {
          return res.status(400).json({ error: "Sender ID and Receiver ID are required" });
        }
    
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);
    
        if (!sender || !receiver) {
          return res.status(404).json({ error: "Sender or Receiver not found" });
        }
    
        const notification = new Notification({ senderId, receiverId, content });
        await notification.save();
    
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("updateNotifications", { senderId, content, createdAt: notification.createdAt });
        }
    
        res.status(201).json(notification);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    };


    module.exports.getNotifications = async (req, res) => {
        try {
            const notifications = await Notification.find({ receiverId: req.params.userId })
              .populate("senderId", "_id firstName lastName")
              .sort({ createdAt: -1 });
              
            // Mark notifications as "read"
            await Notification.updateMany(
                { receiverId: req.params.userId, status: "unread" },
                { $set: { status: "read" } }
            );
    
            res.json(notifications);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };

    module.exports.getUnreadNotifications = async (req, res) => {
         try{
          const notifications = await Notification.find({receiverId: req.params.userId, status: "unread"})
          .populate("senderId", "_id firstName lastName")
          .sort({ createdAt: -1 });

          res.status(200).send({ 
            success: true, 
            notifications
          });
         }catch ( error ){
          res.status(500).json({ error: error.message });
         }
    }
    

module.exports.deleteNotification = async(req,res) => {
    try {
        await Notification.deleteMany({ receiverId: req.params.userId, status: "read" });
        res.json({ message: "Read notifications deleted" });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
};