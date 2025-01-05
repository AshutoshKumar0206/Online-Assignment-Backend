const userModel = require("../models/User");
const jwt = require("jsonwebtoken");
const notConfirmedModel = require("../models/notConfirmed");
const pendingUserModel = require("../models/pendingUser");
const bcrypt = require("bcrypt");
const BlacklistModel = require("../models/blacklist.model");
const otpGenerator = require("otp-generator");
const OTP = require("../models/Otp");
const emailTemplate = require("../mail/emailVerificationTemplate");
const resetTemplate = require("../mail/resetPassOtp")
const mailSender = require("../utils/mailSender");
const passwordUpdated = require("../mail/PasswordUpdate");
const Subject = require('../models/Subject');
const mongoose = require('mongoose');
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
      const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });

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
      resetTemplate(otp)
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
		// if (!(userDetails.resetPasswordExpires > Date.now())) {
		// 	return res.status(403).json({
		// 		success: false,
		// 		message: `Token is Expired, Please Regenerate Your Token`,
		// 	});
		// }
		const encryptedPassword = await bcrypt.hash(password, 10);
		await userModel.findOneAndUpdate(
			{ email: email },
			{ password: encryptedPassword },
			{ new: true }
		);
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

module.exports.dashboard = async (req, res, next) => {
  try {
    const { id } = req.params;
    console.log("ID GOT ");
    console.log(id);
    
    const user = await userModel
    .findById(id)
    .select("-password") // Exclude the password field
    .populate({
      path: "subjects",
      select: "subject_name teacher_name teacher_id subject_id", // Fetch specific fields from subjects
    })
    .exec();
    
    console.log("USER GOT ");
    console.log(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(" IN DASHBOARD ");
    console.log(user);

    const subjectDetails = user.subjects.map(subject => ({
      subjectName: subject.subject_name,
      teacherName: subject.teacher_name,
      subjectId: subject.subject_id,
    }));

    console.log("SUB DEETS");
    console.log(subjectDetails);

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
    console.error("Error fetching user dashboard:", err);

    // Prevent sending another response if headers were already sent
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Internal Server Error",
      });
    }

    // Optionally pass the error to the next middleware
    // next(err);
  }
};

module.exports.Profile = async (req, res, next) => {
  let userId = req.params.id;
  userId = new mongoose.Types.ObjectId(userId); 
  
  try{
      const user = await userModel.findById(userId).select("-password -subjects");
      console.log('User:', user);
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
      })

  }catch(err){
    res.status(500).json({ 
      success: false,
      message: "Error fetching User Profile",
    });
  }
}

module.exports.updateProfile = async (req, res, next) => {
  let userId = req.params.id;
  userId = new mongoose.Types.ObjectId(userId);
  console.log('body', req.body);
  let email = req.body.email;
  // let userName = req.body.profileInput.userName;
  let firstName = req.body.profileInput.firstName;
  let lastName = req.body.profileInput.lastName;
  let rollNo = req.body.profileInput.rollNo;
  let branch = req.body.profileInput.branch;
  let semester = req.body.profileInput.semester;
  let contact = req.body.profileInput.contact;
  let section = req.body.profileInput.section;
  let exprerience = req.body.profileInput.exprerience;
  let employeeId = req.body.profileInput.employeeId;
  // userName = userName.trim().split(' ');

  try{
    const updatedUser = await userModel.findByIdAndUpdate(userId, { email, firstName : firstName, lastName : lastName, 
                                                                   rollNo, contact, 
                                                                  section, branch, 
                                                                   semester, exprerience,employeeId}, {new: true});
    console.log('Updated User:', updatedUser); 
    if(!updatedUser){
      res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.status(200).json({
      success: true,
      message: "User Profile Updated Successfully",
      email: updatedUser.email,
      // userName: updatedUser.firstName + " " + updatedUser.lastName,
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
    })
  } catch(err){
      res.status(500).json({ 
        success: false, 
        message: "Error updating User Profile", 
      });
  }  
}



// Controller for Changing Password
// exports.changePassword = async (req, res) => {
//   try {
//     const userDetails = await userModel.findById(req.user.id)

//     const { oldPassword, newPassword } = req.body

//     const isPasswordMatch = await bcrypt.compare(
//       oldPassword,
//       userDetails.password
//     )
//     if (!isPasswordMatch) {
//       return res
//         .status(401)
//         .json({ success: false, message: "The password is incorrect" })
//     }

//     // Update password
//     const encryptedPassword = await bcrypt.hash(newPassword, 10)
//     const updatedUserDetails = await userModel.findByIdAndUpdate(
//       req.user.id,
//       { password: encryptedPassword },
//       { new: true }
//     )

//     // Send notification email
//     try {
//       const emailResponse = await mailSender(
//         updatedUserDetails.email,
//         "Password for your account has been updated",
//         passwordUpdated(
//           updatedUserDetails.email,
//           `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
//         )
//       )
//       console.log("Email sent successfully:", emailResponse.response)
//     } catch (error) {
//       console.error("Error occurred while sending email:", error)
//       return res.status(500).json({
//         success: false,
//         message: "Error occurred while sending email",
//         error: error.message,
//       })
//     }

//     return res.status(200).json({ success: true, message: "Password updated successfully" })
//   } catch (error) {
//     console.error("Error occurred while updating password:", error)
//     return res.status(500).json({
//       success: false,
//       message: "Error occurred while updating password",
//       error: error.message,
//     })
//   }
// }






