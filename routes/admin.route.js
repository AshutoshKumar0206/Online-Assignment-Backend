const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");


// Route for Admin login, returns token and pending users upon successful login
router.post("/signin", adminController.adminLogin);

// Route for Admin logout, clears the token and logs out the admin
router.post("/logout", adminController.verifyAdmin, adminController.adminLogout);

// Admin Routes for Pending Users
// Route to fetch pending users (only accessible by verified admins)
router.get("/check", adminController.verifyAdmin, adminController.getPendingUsers);

// Route to approve a pending user (only accessible by verified admins)
router.post("/approve", adminController.verifyAdmin, adminController.approveUser);

//Route to delete pending users
router.delete("/deletependinguser/:id", adminController.verifyAdmin, adminController.deletePendingUser);

//Route to get all the existing users
router.get("/user", adminController.verifyAdmin, adminController.getUser);

//Route to delete a particular user (only accessible to verified admins)
router.delete('/user/:id', adminController.verifyAdmin, adminController.deleteUser);

//Route to get details of a particular user (only accessible to verified admins)
router.get("/user/:id", adminController.verifyAdmin, adminController.viewUser);

//Feedback Fetch Route
router.get("/feedback", adminController.verifyAdmin, adminController.getFeedback);

module.exports = router;
