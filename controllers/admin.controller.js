const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const adminEmail = process.env.ADMIN_EMAIL; 
const adminPassword = process.env.ADMIN_PASSWORD; // Store hashed password in .env file
const pendingUserModel = require("../models/pendingUser");
const userModel = require("../models/User");
const approveUserTemplate = require("../mail/approveUserTemplate");
const mailSender = require("../utils/mailSender");
const mongoose = require('mongoose');

require('dotenv').config();
// Admin Login
module.exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    if (email !== adminEmail) {
      return res.status(401).json({
        success: false,
        message: "Invalid email",
      });
    }

    if (password !== adminPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid password",
      });
    }
    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    
    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };


    // Fetch pending users
    const pendingUsers = await pendingUserModel.find({}, { password: 0 });

    res.cookie("token", token, options).status(200).json({
      success: true,
      token,
      message: "Admin login successful.",
      pendingUsers, // Send pending users data
    });
  } catch (err) {
    next(err);
  }
};

// Admin Logout
module.exports.adminLogout = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    res.clearCookie("token");
    res.status(200).json({
      success:true,
      message: "Admin logout successful",
    });
  } catch (err) {
    next(err);
  }
};

// Middleware to Verify Admin
module.exports.verifyAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Not an admin.",
      });
    }

    next();
  } catch (err) {
    res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};


// Fetch Pending Users
module.exports.getPendingUsers = async (req, res, next) => {
  try {
    const pendingUsers = await pendingUserModel.find({}, { password: 0 });
    res.status(200).json(pendingUsers);
  } catch (err) {
    next(err);
  }
};


// Approve User
module.exports.approveUser = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const currUser = await pendingUserModel.findById(userId);
    if (!currUser) {
      return res.status(404).json({
        message: "User not found in pending list.",
      });
    }

    const approvedUser = new userModel({
      firstName: currUser.firstName,
      lastName: currUser.lastName,
      email: currUser.email,
      password: currUser.password,
      role,
    });

    await approvedUser.save();
    await pendingUserModel.findByIdAndDelete(userId);
    const mailResponse = await mailSender(
      approvedUser.email,
      `${approvedUser.firstName + " " + approvedUser.lastName} approved as ${approvedUser.role}`,
      approveUserTemplate(approvedUser.firstName, approvedUser.lastName, approvedUser.role)
    )

    res.status(200).json({
      success:true,
      message: "User approved successfully.",
    });
  } catch (err) {
    next(err);
  }
};

//To delete a specific user not verified by admin
module.exports.deletePendingUser = async(req, res, next) => {
  const userId = req.params.id;
  try {
    const deletedUser = await pendingUserModel.findByIdAndDelete(userId);
    if (deletedUser) {
      res.status(200).json({
        success:true,
        message: "User deleted successfully", 
        user: deletedUser });
    } else {
      res.status(404).json({
        success:false,
        message: "User not found" 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      message: "Error in Deleting User"
    });
  }
};


module.exports.getUser = async (req, res, next) => {
  try {
    // Fetch all users and project only the required fields
    const users = await userModel.find({}, 'firstName lastName email role _id');

    // Transform the data to include full name
    const formattedUsers = users.map(user => ({
      _id: user._id,
      name: user.firstName + " " + user.lastName,
      email: user.email,
      role: user.role,
    }));

    // Separate users into two arrays based on their roles
    const students = formattedUsers.filter(user => user.role === 'student');
    const teachers = formattedUsers.filter(user => user.role === 'teacher');

    res.status(200).json({
      success: true,
      students,
      teachers,
    });
  } catch (error) {
    res.status(500).json({ message: "Error in Fetching Users detail" });
  }
};



module.exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Find and delete the user by ID
    const deletedUser = await userModel.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error in deleting user" });
  }
};


module.exports.viewUser = async (req, res,next) => {
  let userId = req.params.id;
    userId = new mongoose.Types.ObjectId(userId); 
    
    try{
        const user = await userModel.findById(userId).select("-password");
        if(!user){
            res.status(404).json({
              success: false,
              message: "User not found",
            })
        }
        res.status(200).json({
          success: true,
          message: "User Profile",
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          rollNo: user.rollNo,
          role: user.role,
          branch: user.branch,
          semester: user.semester,
          contact: user.contact,
          section: user.section,
          updatedAt: user.updatedAt,
          exprerience: user.exprerience,
          employeeId: user.employeeId,
          image: user.image,
          subjects: user.subjects,
        })
  
    }catch(err){
      res.status(500).json({ 
        success: false,
        message: "Error fetching User Profile",
      });
    }
}