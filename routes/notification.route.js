const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { isAuthenticated } = require("../middlewares/auth.middleware");

// Route to create a new notification
router.post("/new", isAuthenticated, notificationController.createNotification);

// Route to get all notifications for a user
router.get("/:userId", isAuthenticated, notificationController.getNotifications);

// Route to delete all read notifications for a user
router.delete("/delete/:userId", isAuthenticated, notificationController.deleteNotification);

// Route to get all unread notifications for a user
router.get("/unread/:userId", isAuthenticated, notificationController.getUnreadNotifications);

module.exports = router;