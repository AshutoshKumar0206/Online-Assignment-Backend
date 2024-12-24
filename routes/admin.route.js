const express = require("express");
const router = express.Router();
const { 
  adminLogin, 
  adminLogout, 
  verifyAdmin, 
  getPendingUsers, 
  approveUser,
  deletePendingUser 
} = require("../controllers/admin.controller");

// Admin Login and Logout Routes
// Route for Admin login, returns token and pending users upon successful login
router.post("/signin", adminLogin);

// Route for Admin logout, clears the token and logs out the admin
router.post("/logout", verifyAdmin, adminLogout);

// Admin Routes for Pending Users
// Route to fetch pending users (only accessible by verified admins)
router.get("/check", verifyAdmin, getPendingUsers);

// Route to approve a pending user (only accessible by verified admins)
router.post("/approve", verifyAdmin, approveUser);

//Route to delete pending users
router.delete("/deletependinguser/:id", verifyAdmin, deletePendingUser);

module.exports = router;
