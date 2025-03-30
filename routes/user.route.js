const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const subjectController = require("../controllers/subject.controller");
const { isAuthenticated } = require("../middlewares/auth.middleware"); 

// User Authentication Routes
router.post("/signup", userController.signup);
router.post("/signin", userController.signin);
router.post("/logout",isAuthenticated, userController.logout);

// OTP Routes
router.post("/sendotp", userController.sendotp);
router.post("/verifyotp", userController.verifyotp);

//Reset Password Routes
router.post("/sendresetotp", userController.sendresetpasswordotp);
router.post("/resetpassword", userController.resetPassword);

// User Dashboard Route
router.get("/dashboard/:id",isAuthenticated, userController.dashboard);
router.get("/profile/:id",isAuthenticated, userController.Profile);
router.put("/updateprofile/:id",isAuthenticated, userController.updateProfile);
router.put("/updatedisplaypicture/:id",isAuthenticated, userController.updateDisplayPicture);
router.get("/getProfile/:id",isAuthenticated, userController.getProfile);

//Subject Routes
router.post("/addsubject/:id",isAuthenticated, subjectController.createSubject);
router.get("/getsubject/:id",isAuthenticated, subjectController.getSubject);
router.post("/addstudent/:id",isAuthenticated, subjectController.addStudent);
router.post("/removestudent/:id",isAuthenticated, subjectController.removeStudent);
router.post('/join/:id',isAuthenticated, subjectController.joinSubject);

//ContactUs Route
router.post("/contactus",isAuthenticated, userController.contactUs);

module.exports = router;
