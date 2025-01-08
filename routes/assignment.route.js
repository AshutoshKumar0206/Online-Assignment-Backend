const express = require("express");
const router = express.Router();
const assignmentController = require("../controllers/assignment.controller");
const { isAuthenticated } = require("../middlewares/auth.middleware"); // Move middleware to a separate file for modularity


// post route to create a new assignment
router.post('/new/:id', isAuthenticated, assignmentController.createAssignment);

//route to get details of an assignment
router.get("/:id", isAuthenticated, assignmentController.getAssignmentDetails);
router.post("/submitassignment/:id", isAuthenticated, assignmentController.submitAssignment);

module.exports = router;