const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const subjectController = require("../controllers/subject.controller");
const { isAuthenticated } = require("../middlewares/auth.middleware"); // Move middleware to a separate file for modularity

// User Authentication Routes
router.post("/signup", userController.signup);
router.post("/signin", userController.signin);
router.post("/logout", userController.logout);

// OTP Routes
router.post("/sendotp", userController.sendotp);
router.post("/verifyotp", userController.verifyotp);

//Reset Password Routes
router.post("/sendresetotp", userController.sendresetpasswordotp);
router.post("/resetpassword", userController.resetPassword);

// User Dashboard Route
router.get("/dashboard/:id", userController.dashboard);
router.get("/profile/:id", userController.Profile);
router.put("/updateprofile/:id", userController.updateProfile);
router.put("/updatedisplaypicture/:id", userController.updateDisplayPicture);
router.get("/getProfile/:id", userController.getProfile);

//Subject Routes
router.post("/addsubject/:id", subjectController.createSubject);
router.get("/getsubject/:id", subjectController.getSubject);
router.post("/addstudent/:id", subjectController.addStudent);
router.post("/removestudent/:id", subjectController.removeStudent);
router.post('/join/:id', subjectController.joinSubject);

//ContactUs Route
router.post("/contactus", userController.contactUs);

module.exports = router;
