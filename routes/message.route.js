const express = require("express");
const router = express.Router();
const messageController = require("../controllers/message.controller")
const { isAuthenticated } = require("../middlewares/auth.middleware");

router.post("/send/:id", isAuthenticated, messageController.sendMessage);
router.get("/get/:id",isAuthenticated, messageController.getMessages);
router.delete("/delete/:id", isAuthenticated, messageController.deleteMessage);
router.get("/read/:id", isAuthenticated, messageController.unreadMessages);
router.post("/markread", isAuthenticated, messageController.markAsRead);

module.exports = router;