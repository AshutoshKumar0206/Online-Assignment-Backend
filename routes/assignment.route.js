const express = require("express");
const router = express.Router();
const assignmentController = require("../controllers/assignment.controller");
const { isAuthenticated } = require("../middlewares/auth.middleware"); // Move middleware to a separate file for modularity


// post route to create a new assignment
router.post('/new/:id', isAuthenticated, assignmentController.createAssignment);

//route to get details of an assignment
router.get("/:id", isAuthenticated, assignmentController.getAssignmentDetails);

//rote to submit assignment of the 
router.post("/submitassignment/:id", isAuthenticated, assignmentController.submitAssignment);

//route to get all submissions of the assignment
router.get("/submission/:id", isAuthenticated, assignmentController.getAllAssignments);

//route to update the assignment details
router.put("/updateassignment/:id", isAuthenticated, assignmentController.updateAssignment);

//route to get the submission of a particular student in the assignment
router.get("/:assignmentId/:studentId", isAuthenticated, assignmentController.getAssignmentSubmission);
router.post("/checkplagiarism/:id", isAuthenticated, assignmentController.checkPlagiarism);
router.post("/submission/save/:studentId/:id", isAuthenticated, assignmentController.marksAndFeedback);

module.exports = router;