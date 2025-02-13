const express = require("express");
const router = express.Router();
const subjectController = require("../controllers/subject.controller");
const { isAuthenticated } = require("../middlewares/auth.middleware"); 


//Route for deleting the subject
router.delete('/:id', isAuthenticated, subjectController.deleteSubject);

//Route for adding new notice to the subject
router.post('/notice', isAuthenticated, subjectController.createNotice);

//Route for getting notice of the subject
router.get('/notice', isAuthenticated, subjectController.getSubjectNotices);

//Route for editing notice to the subject
router.put('/notice', isAuthenticated, subjectController.editNotice);

//Route for deleting notice to the subject
router.delete('/notice/:id', isAuthenticated, subjectController.deleteNotice);

module.exports = router;