const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { adminLogin, adminLogout, verifyAdmin } = require("../controllers/admin.controller");

// Admin Login and Logout Routes
router.post("/login", adminLogin); // Admin login
router.post("/logout", verifyAdmin, adminLogout); // Admin logout

// Admin Routes for Pending Users
router.get("/check", verifyAdmin, userController.getPendingUsers); // View pending users
router.post("/approve", verifyAdmin, userController.approveUser); // Approve pending users

module.exports = router;
