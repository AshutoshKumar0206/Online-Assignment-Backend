const userModel = require("../models/User");
const adminModel = require("../models/Admin");
const notConfirmedModel = require("../models/notConfirmed");
const bcrypt = require("bcrypt");
const BlacklistModel = require("../models/blacklist.model");
const otpGenerator = require("otp-generator");
const OTP = require("../models/Otp");

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
      role, // Default role; admin will confirm
    });

    await newUser.save();

    res.status(201).json({
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

    const checkUserPresent = await userModel.findOne({ email });

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
      message: "Logout successful",
    });
  } catch (err) {
    next(err);
  }
};

module.exports.getPendingUsers = async (req, res, next) => {
  try {
    const pendingUsers = await notConfirmedModel.find({}, { password: 0 });
    res.status(200).json(pendingUsers);
  } catch (err) {
    next(err);
  }
};

module.exports.approveUser = async (req, res, next) => {
  try {
    const { userId, role } = req.body;

    const pendingUser = await notConfirmedModel.findById(userId);
    if (!pendingUser) {
      return res.status(404).json({
        message: "User not found in pending list.",
      });
    }

    const approvedUser = new userModel({
      firstName: pendingUser.firstName,
      lastName: pendingUser.lastName,
      email: pendingUser.email,
      password: pendingUser.password,
      role,
    });

    await approvedUser.save();
    await notConfirmedModel.findByIdAndDelete(userId);

    res.status(200).json({
      message: "User approved successfully.",
    });
  } catch (err) {
    next(err);
  }
};
