const userModel = require("../models/User");
const jwt = require("jsonwebtoken");
const blacklistModel = require("../models/blacklist.model");

// Configuring dotenv to load environment variables from .env file
require('dotenv').config();
module.exports.isAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, message: "Token Missing" });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      req.user = decoded;
    } catch (error) {
      return res.status(401).json({ success: false, message: "Token is invalid" });
    }
    
    const isBlackListed = await blacklistModel.findOne({ token });
    if (isBlackListed) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    
      const user = await userModel.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ success: false, message: "Unauthenticated" });
      }
      
      next();
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong while validating the token",
      });
    }
  };
  


module.exports.isStudent = async (req, res, next) => {
	try {
		const userDetails = await User.findOne({ email: req.user.email });

		if (userDetails.role !== "Student") {
			return res.status(401).json({
				success: false,
				message: "This is a Protected Route for Students",
			});
		}
		next();
	} catch (error) {
		return res
			.status(500)
			.json({ success: false, message: `User Role Can't be Verified` });
	}
};

module.exports.isInstructor = async (req, res, next) => {
	try {
		const userDetails = await User.findOne({ email: req.user.email });

		if (userDetails.role !== "Teacher") {
			return res.status(401).json({
				success: false,
				message: "This is a Protected Route for Teachers",
			});
		}
		next();
	} catch (error) {
		return res
			.status(500)
			.json({ success: false, message: `User Role Can't be Verified` });
	}
};