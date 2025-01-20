const userModel = require("../models/User");
const jwt = require("jsonwebtoken");
const blacklistModel = require("../models/blacklist.model");
// const cookieParser = require("cookie-parser");
// app.use(cookieParser());

// Configuring dotenv to load environment variables from .env file
require('dotenv').config();
module.exports.isAuthenticated = async (req, res, next) => {
  try {
    console.log("AUTH REACHED");
    
    const token = req.headers.authorization?.split(" ")[1];
    console.log("TOKEN REACHED", token);
    if (!token) {
      return res.status(401).json({ success: false, message: "Token Missing" });
    }
    
    const userId = req.params.id;
    console.log(userId);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('hello baby:', decoded);
      
      req.user = decoded;
    } catch (error) {
      return res.status(401).json({ success: false, message: "Token is invalid" });
    }
    
    const isBlackListed = await blacklistModel.findOne({ token });
    if (isBlackListed) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    
      const user = await userModel.findById(decoded._id);
      console.log('user:', user);
      if (!user) {
        return res.status(401).json({ success: false, message: "Unauthenticated" });
      } else if(userId !== decoded._id) {
        return res.status(401).json({ success: false, message: "You are not Authenticated" });
      }
      
      next();
    } catch (err) {
      console.error(err);
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
		console.log(userDetails);

		console.log(userDetails.role);

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