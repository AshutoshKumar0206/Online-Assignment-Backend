const userModel = require("../models/User");
// const adminModel = require("../models/Admin");
const jwt = require("jsonwebtoken");
const notConfirmedModel = require("../models/notConfirmed");
const pendingUserModel = require("../models/pendingUser");
const bcrypt = require("bcrypt");
const BlacklistModel = require("../models/blacklist.model");
const otpGenerator = require("otp-generator");
const OTP = require("../models/Otp");
const emailTemplate = require("../mail/emailVerificationTemplate");
const mailSender = require("../utils/mailSender");


module.exports.signup = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, role } = req.body;
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password do not match.",
      });
    }

    const isUserAlreadyExist = await userModel.findOne({ email });
    const isPendingUser = await notConfirmedModel.findOne({ email });

    if (isUserAlreadyExist || isPendingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists or requires Admin approval.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new notConfirmedModel({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role, // Default role; admin will confirm the role
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      newUser,
      message: "Signup successful. Admin approval Pending.",
    });
  } catch (err) {
    next(err);
  }
};

module.exports.signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

  const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    } else if (isPasswordCorrect) {
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

      user.token = token;
      user.password = undefined;
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };
      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: `User Login Success`,
      });
    } else {
      return res.status(401).json({
        success: false,
        message: `Password is incorrect`,
      });
    }
  } catch (err) {
    next(err);
  }
};

module.exports.sendotp = async (req, res) => {
  try {
    const { email } = req.body;

    const checkUserPresent = await userModel.findOne({ email: email });

    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: `User is Already Registered`,
      });
    }

    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const result = await OTP.findOne({ otp: otp });

    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
      });
    }

    const otpPayload = { email, otp };
    const otpBody = await OTP.create(otpPayload);
    const mailResponse = await mailSender(
      email,
      "Verification email",
      emailTemplate(otp)
    )
    console.log("mail response:", mailResponse);

    res.status(200).json({
      success: true,
      message: `OTP Sent Successfully`,
      otp,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};



module.exports.verifyotp = async (req, res) => {
  try {
    const { otp, email, role } = req.body;

    if (!otp || !email) {
      return res.status(400).json({
        success: false,
        message: "OTP and email are required",
      });
    }

    const otpEntry = await OTP.findOne({ email, otp });
    if (!otpEntry) {
      return res.status(401).json({ message: "Invalid OTP." });
    }

    // Find the user in notConfirmedModel
    const currUser = await notConfirmedModel.findOne({ email });
    if (!currUser) {
      return res.status(404).json({
        message: "User not found in notConfirmed list.",
      });
    }

    // Create a new entry in pendingUserModel
    const approvedUser = new pendingUserModel({
      firstName: currUser.firstName,
      lastName: currUser.lastName,
      email: currUser.email,
      password: currUser.password,
      role: role || "student", // Default to "student" if role is not provided    
    });

    await approvedUser.save();
    await notConfirmedModel.findByIdAndDelete(currUser._id); // Delete from notConfirmedModel
    await OTP.deleteOne({ email, otp }); // Delete the OTP after successful verification

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. User moved to pending list.",
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "OTP verification failed" });
  }
};




module.exports.logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    const isTokenBlacklisted = await BlacklistModel.findOne({ token });

    if (isTokenBlacklisted) {
      return res.status(400).json({
        message: "Token already blacklisted",
      });
    }

    await BlacklistModel.create({ token });

    res.status(200).json({
      message: "User Logged out",
    });
  } catch (err) {
    next(err);
  }
};




module.exports.dashboard = async (req, res, next) => {
  try {
    const id = req.params.id;
    // Fetch the user from the database
    const user = await userModel.findById(id).select("-password"); // Exclude the password field

    // Check if the user exists
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return the user data
    res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    console.error("Error fetching user dashboard:", err);
    next(err);
  }
};






