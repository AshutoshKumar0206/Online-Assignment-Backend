const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

router.post("/signup", userController.signup);
router.post("/signin", userController.signin);
router.post("/logout", userController.logout);
router.post("/sentotp", userController.sendotp);
router.post("/verifyotp", userController.verifyotp);
module.exports = router;