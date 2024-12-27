const userModel = require("../models/User");
const jwt = require("jsonwebtoken");
const blacklistModel = require("../models/blacklist.model");
// Configuring dotenv to load environment variables from .env file
require('dotenv').config();
module.exports.isAuthenticated = async (req, res, next) => {
    try {
		const token = req.headers.authorization.split(" ")[1] || req.cookies.token || req.body.token;
			console.log(token);
		// If JWT is missing, return 401 Unauthorized response
		if (!token) {
			return res.status(401).json({ success: false, message: `Token Missing` });
		}

		try {
			// Verifying the JWT using the secret key stored in environment variables
			const decode = await jwt.verify(token, process.env.JWT_SECRET);
			console.log(decode);

			// Storing the decoded JWT payload in the request object for further use
			req.user = decode;
		} catch (error) {
			
			// If JWT verification fails, return 401 Unauthorized response
			return res.status(401).json({ success: false, message: "token is invalid" });
		}
		
		// If JWT is valid, move on to the next middleware or request handler
		next();

        const isBlackListed = await blacklistModel.findOne({token});
        if(isBlackListed) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            })
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded._id);

        if(!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            })
        }

        req.user = user;
        next();
    } catch (err) {
		// If there is an error during the authentication process
		console.error(err);
		return res.status(401).json({
			success: false,
			message: "Something Went Wrong While Validating the Token",
		});
	}
}

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