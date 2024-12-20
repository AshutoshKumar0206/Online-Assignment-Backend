const userModel = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const BlacklistModel = require("../models/blacklist.model");
const otpGenerator = require("otp-generator");
const OTP = require("../models/Otp");

module.exports.signup = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, confirmPassword, role } = req.body;
        if(!email || !password || !confirmPassword || !firstName || !lastName) {
            return res.status(400).json({
                message: "All fields are required"
            });
        } 
        //Check if password and confirm password match
        if(password !== confirmPassword) {
            return res.status(400).json({
                success:false,
                message: "Password and confirm password dont match. Please try again",
            })
        }

        //Check if User Exists in database
        const isUserAlreadyExist = await userModel.findOne({email});
        if(isUserAlreadyExist) {
            return res.status(400).json({
                success:false,
                message: "User already exists. Please sign in to continue",
            });
        }
        
        // Find the most recent OTP for the email
        const response = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1)
        console.log(response)
        if (response.length === 0) {
        // OTP not found for the email
        return res.status(400).json({
            success: false,
            message: "The OTP is not valid",
        })
        } else if (otp !== response[0].otp) {
        // Invalid OTP
        return res.status(400).json({
            success: false,
            message: "The OTP is not valid",
        })
        }
        //Hash the Password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new userModel({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role
        });

        const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET, {expiresIn: "1h"});
        
        res.status(201).json({
            message: "User created successfully",
            user, 
            token
        });

    } catch (err) {
        next(err);
    }
}

module.exports.signin = async (req, res, next) => {
    try {
        const {email, password} = req.body;

        if(!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields"
            });
        }

        const user = await userModel.findOne({email});

        if(!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if(!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: "Invalid credentials",
            });
        } else if(isPasswordCorrect){
                const token = jwt.sign({_id: user._id}, 
                    process.env.JWT_SECRET, 
                    {expiresIn: "1h"});
                
                user.token = token
                user.password = undefined
                // Set cookie for token and return success response
                const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true,
                }
                res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: `User Login Success`,
                })
      } else {
        return res.status(401).json({
          success: false,
          message: `Password is incorrect`,
        })
      }

    } catch (err) {
        next(err);
    }
}

// Send OTP For Email Verification
exports.sendotp = async (req, res) => {
    try {
      const { email } = req.body
  
      // Check if user is already present
      // Find user with provided email
      const checkUserPresent = await User.findOne({ email })
      // to be used in case of signup
  
      // If user found with provided email
      if (checkUserPresent) {
        return res.status(401).json({
          success: false,
          message: `User is Already Registered`,
        })
      }
  
      var otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      })
      const result = await OTP.findOne({ otp: otp })
      console.log("Result is Generate OTP Func")
      console.log("OTP", otp)
      console.log("Result", result)
      while (result) {
        otp = otpGenerator.generate(6, {
          upperCaseAlphabets: false,
        })
      }
      const otpPayload = { email, otp }
      const otpBody = await OTP.create(otpPayload)
      console.log("OTP Body", otpBody)
      res.status(200).json({
        success: true,
        message: `OTP Sent Successfully`,
        otp,
      })
    } catch (error) {
      console.log(error.message)
      return res.status(500).json({ success: false, error: error.message })
    }
  }

module.exports.logout = async (req, res, next) => {
    try {
        const {token} = req.headers.authorization.split(" ")[1];

        if(!token) {
            return res.status(401).json({
                message: "No token provided"
            });
        }

        const isTokenBlacklisted = await BlacklistModel.findOne({token});

        if(isTokenBlacklisted) {
            return res.status(400).json({
                message: "Token already blacklisted"
            });
        }

        await BlacklistModel.create({token});

    } catch(err) {
        next(err);
    }
}