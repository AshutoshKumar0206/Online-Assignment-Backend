const express = require("express");
const router = express.Router();
const assignmentController = require("../controllers/assignment.controller");
const { isAuthenticated } = require("../middlewares/auth.middleware"); // Move middleware to a separate file for modularity

//Assignment Routes
router.post('/new/:id', isAuthenticated, assignmentController.createAssignment);

module.exports = router;