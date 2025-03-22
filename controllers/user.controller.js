const userModel = require("../models/User");
const jwt = require("jsonwebtoken");
const notConfirmedModel = require("../models/notConfirmed");
const pendingUserModel = require("../models/pendingUser");
const bcrypt = require("bcrypt");
const BlacklistModel = require("../models/blacklist.model");
const otpGenerator = require("otp-generator");
const OTP = require("../models/Otp");
const MobileOTP = require("../models/MobileOtp");
const emailTemplate = require("../mail/emailVerificationTemplate");
const resetTemplate = require("../mail/resetPassOtp")
const mailSender = require("../utils/mailsender");
const passwordUpdateTemplate = require("../mail/PasswordUpdate");
const Subject = require('../models/Subject');
const contactUs = require('../models/ContactUs');
const mongoose = require('mongoose');
const { uploadImageToCloudinary } = require('../utils/imageUploader')
const twilio = require('twilio')
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);
const twilioNumber = process.env.CONTACT;
const RECAPTCHA_SECRET_KEY = process.env.CAPTCHA_SECRET;
require('dotenv').config();
const axios = require('axios')

module.exports.signup = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, role, recaptchaToken } = req.body;
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Password validation regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*])[A-Za-z\d@#$%^&*]{8,}$/;
    // Check if password meets the criteria
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character (@, #, $, %, ^, &, *).",
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
    const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
    const response = await axios.post(
      verifyUrl,
      new URLSearchParams({
        secret: RECAPTCHA_SECRET_KEY,
        response: recaptchaToken
      })
    );
    if (!response.data.success) {
      return res.status(403).json({
        success: false,
        message: "reCAPTCHA verification failed. Please try again.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new notConfirmedModel({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
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
    const { email, password, recaptchaToken, failedAttempts } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }
    if (failedAttempts >= 3) {
      if (!recaptchaToken) {
        return res.status(401).json({
          success: false,
          message: "Please complete the reCAPTCHA verification.",
        });
      }
      const verifyUrl = "https://www.google.com/recaptcha/api/siteverify";
      const response = await axios.post(
        verifyUrl,
        new URLSearchParams({
          secret: RECAPTCHA_SECRET_KEY,
          response: recaptchaToken
        })
      );
      if (!response.data.success) {
        return res.status(403).json({
          success: false,
          message: "reCAPTCHA verification failed. Please try again.",
        });
      }
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
      const token = jwt.sign({ email: user.email, id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });

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
    const { otp, email } = req.body;

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
      role: currUser.role || "student", // Default to "student" if role is not provided    
    });

    await approvedUser.save();
    await notConfirmedModel.findByIdAndDelete(currUser._id); // Delete from notConfirmedModel
    await OTP.deleteOne({ email, otp }); // Delete the OTP after successful verification

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. User moved to pending list.",
    });
  } catch (err) {
    return res.status(500).json({ message: "OTP verification failed" });
  }
};

module.exports.logout = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
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

module.exports.sendresetpasswordotp = async (req, res) => {
  try {
    const { email } = req.body;

    const checkUserPresent = await userModel.findOne({ email: email });

    if (!checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: `User is not Registered`,
      });
    }

    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // Keep generating new OTP until we get a unique one
    let result = await OTP.findOne({ otp: otp });
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp: otp });
    }

    // Delete any existing OTP for this email
    await OTP.deleteOne({ email: email });

    const otpPayload = { email, otp };
    const otpBody = await OTP.create(otpPayload);
    
    const mailResponse = await mailSender(
      email,
      "Password Reset OTP",
      resetTemplate(otp)
    );
    console.log(`mailResponse: ${mailResponse}`);

    res.status(200).json({
      success: true,
      message: `OTP Sent Successfully`,
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword, otp, email } = req.body;

    if (!otp || !email) {
      return res.status(400).json({
        success: false,
        message: "OTP and email are required",
      });
    }
    //check if otp matches with otp send on mail
    const otpEntry = await OTP.findOne({ email, otp });
    if (!otpEntry) {
      return res.status(401).json({ message: "Invalid OTP." });
    }

    // Password validation regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&*])[A-Za-z\d@#$%^&*]{8,}$/;

    // Check if password meets the criteria
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character (@, #, $, %, ^, &, *).",
      });
    }

    if (confirmPassword !== password) {
      return res.json({
        success: false,
        message: "Password and Confirm Password does not Match",
      });
    }
    const userDetails = await userModel.findOne({ email: email });
    if (!userDetails) {
      return res.json({
        success: false,
        message: "User is not Registered",
      });
    }

    const encryptedPassword = await bcrypt.hash(password, 10);
    await userModel.findOneAndUpdate(
      { email: email },
      { password: encryptedPassword },
      { new: true }
    );
    const mailResponse = await mailSender(
      userDetails.email,
      `Password Reset email`,
      passwordUpdateTemplate(userDetails.email, userDetails.firstName, userDetails.lastName)
    )
    res.json({
      success: true,
      message: `Password Reset Successful`,
    });
  } catch (error) {
    return res.json({
      error: error.message,
      success: false,
      message: `Some Error in Updating the Password`,
    });
  }
};

module.exports.verifyMobileOtp = async (req, res, next) => {
  try {
    const { contact, otp } = req.body;
    if (!otp || !contact) {
      return res.status(400).json({
        success: false,
        message: "OTP and contact are required",
      });
    }

    const otpEntry = await OTP.findOne({ contact, otp });
    if (!otpEntry) {
      return res.status(401).json({ message: "Invalid OTP." });
    }

    // Send confirmation message
    await twilioClient.messages.create({
      body: "Your phone number has been successfully updated.",
      from: twilioNumber,
      to: `+${contact}`, // Ensure it's in international format
    });
    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error in Verifying OTP",
    })
  }
}

module.exports.dashboard = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id !== req.user.id) {
      return res.status(404).send({
        success: false,
        message: 'User is unauthorized to check other persons data'
      })
    } else if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(200).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await userModel
      .findById(id)
      .select("-password") // Exclude the password field
      .populate({
        path: "subjects",
        select: "subject_name teacher_name teacher_id subject_id", // Fetch specific fields from subjects
      })
      .exec();

    if (!user) {
      return res.status(200).json({
        success: false,
        message: "User not found",
      });
    }


    const subjectDetails = user.subjects.map(subject => ({
      subjectName: subject.subject_name,
      teacherName: subject.teacher_name,
      subjectId: subject.subject_id,
    }));



    res.status(200).json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        subjectDetails, // Include the mapped subject details
      },
      success: true,
    });
  } catch (err) {

    // Prevent sending another response if headers were already sent
  
      res.status(500).json({
        success: false,
        message: err.message,
      });
    

  }
};

module.exports.getProfile = async (req, res, next) => {
  let userId = req.params.id;

  // console.log(userId);
  try {
    userId = new mongoose.Types.ObjectId(userId);

    const user = await userModel.findById(userId).select("firstName lastName image");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User Profile",
      name: `${user.firstName} ${user.lastName}`,
      image: user.image,
    });
  } catch (err) {
    // console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports.Profile = async (req, res, next) => {
  let userId = req.params.id;
  try {
    if (userId !== req.user.id) {
      return res.status(404).send({
        success: false,
        message: 'User is unauthorized to check other persons data'
      })
    }
    userId = new mongoose.Types.ObjectId(userId);
    const user = await userModel.findById(userId).select("-password -subjects");
    if (!user) {
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
    })

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching User Profile",
    });
  }
}

module.exports.updateProfile = async (req, res, next) => {
  let userId = req.params.id;

  if (userId !== req.user.id) {
    return res.status(404).send({
      success: false,
      message: 'User is unauthorized to check other persons data'
    })
  } if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(200).json({
      success: false,
      message: "Invalid user ID",
    });
  }
  userId = new mongoose.Types.ObjectId(userId);
  let email = req.body.email;
  let firstName = req.body.profileInput.firstName;
  let lastName = req.body.profileInput.lastName;
  let rollNo = req.body.profileInput.rollNo;
  let branch = req.body.profileInput.branch;
  let semester = req.body.profileInput.semester;
  let contact = req.body.profileInput.contact;
  let section = req.body.profileInput.section;
  let exprerience = req.body.profileInput.exprerience;
  let employeeId = req.body.profileInput.employeeId;

  //for phone number
  // contact = parseInt(contact, 10)
  // contact = contact.replace(/\D/g, "");
  // console.log(contact)
  // if (!/^\d{10,15}$/.test(contact)) {
  //   return res.status(400).json({
  //     success: false,
  //     message: "Invalid phone number format"
  //   });
  // }
  // let otp = otpGenerator.generate(6, {
  //   upperCaseAlphabets: false,
  //   lowerCaseAlphabets: false,
  //   specialChars: false,
  // });

  // const result = await MobileOTP.findOne({ otp: otp });

  // while (result) {
  //   otp = otpGenerator.generate(6, {
  //     upperCaseAlphabets: false,
  //   });
  // }

  // const otpPayload = { contact, otp };
  // const otpBody = await MobileOTP.create(otpPayload);
  // await twilioClient.messages.create({
  //   body: `Your otp for updating your Phone Number: ${otp}.`,
  //   from: twilioNumber,
  //   to: `+91${contact}`, // Ensure it's in international format
  // });

  try {
    const user = await userModel.findById(userId).select("-password");
    let updatedUser;
    if (user.role == "student") {
      updatedUser = await userModel.findByIdAndUpdate(userId, {
        email, firstName: firstName, lastName: lastName,
        rollNo, contact,
        section, branch,
        semester
      }, { new: true }).select("-password");
    } else {
      updatedUser = await userModel.findByIdAndUpdate(userId, {
        email, firstName: firstName, lastName: lastName,
        contact, exprerience, employeeId
      }, { new: true }).select("-password");
    }
    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.status(200).json({
      success: true,
      message: "User Profile Updated Successfully",
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      rollNo: updatedUser.rollNo,
      branch: updatedUser.branch,
      semester: updatedUser.semester,
      contact: updatedUser.contact,
      section: updatedUser.section,
      role: updatedUser.role,
      exprerience: updatedUser.exprerience,
      employeeId: updatedUser.employeeId,
      image: updatedUser.secure_url,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error updating User Profile",
    });
  }
}
module.exports.updateDisplayPicture = async (req, res, next) => {
  let userId = req.params.id;
  try {
    if (userId !== req.user.id) {
      return res.status(404).send({
        success: false,
        message: 'User is unauthorized to check other persons data'
      })
    } else if (!req.files || !req.files.displayPicture) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const displayPicture = req.files.displayPicture;
    userId = new mongoose.Types.ObjectId(userId);
    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    )
    const updatedProfile = await userModel.findByIdAndUpdate(
      userId,
      { image: image.secure_url },
      { new: true }
    )
    res.send({
      success: true,
      message: `Image Updated successfully`,
      data: updatedProfile,
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

module.exports.contactUs = async (req, res, next) => {
  try {
    const name = req.body.name;
    const email = req.body.email;
    const feedback = req.body.feedback;
    let userFeedback = await contactUs.findOne({ email });
    if (userFeedback) {
      userFeedback.feedback.push(feedback);
      await userFeedback.save();
      res.status(200).json({
        success: true,
        message: 'Feedback Sent successfully!',
      })
    }
    else {
      const newFeedback = await contactUs.create({
        name,
        email,
        feedback: [feedback],
      })
      await newFeedback.save();
      res.status(200).json({
        success: true,
        message: 'Feedback Sent successfully!',
      })
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Some problem occured in processing your request",
    })
  }
}