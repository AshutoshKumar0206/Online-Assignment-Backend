const express = require("express");
const router = express.Router();
const subjectController = require("../controllers/subject.controller");
const { isAuthenticated } = require("../middlewares/auth.middleware"); 


//Route for deleting the subject
router.delete('/:id', isAuthenticated, subjectController.deleteSubject);

module.exports = router;