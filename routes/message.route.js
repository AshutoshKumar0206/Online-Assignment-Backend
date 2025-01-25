const express = require("express");
const router = express.Router();
const messageController = require("../controllers/message.controller")
const { isAuthenticated } = require("../middlewares/auth.middleware");

// const middle=(req,res,next) => {
//     console.log(req.params.id);
//     console.log(`sender id: ${req.body}`);
//     next();
// }

router.post("/send/:id", isAuthenticated, messageController.sendMessage);
router.get("/get/:id",isAuthenticated, messageController.getMessages);

module.exports = router;