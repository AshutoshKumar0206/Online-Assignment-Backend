const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const { isAuthenticated } = require("../middlewares/auth.middleware"); 
const { verifyAdmin } = require("../controllers/admin.controller");

// User routes
router.post('/', isAuthenticated, feedbackController.createFeedback);
router.get('/user/:userId', isAuthenticated, feedbackController.getFeedbacks);
router.get('/:id', isAuthenticated, feedbackController.getFeedbackById);

// Admin routes
router.get('/admin/all-feedbacks',  verifyAdmin, feedbackController.getAllFeedbacks);
router.patch('/:id/status',  verifyAdmin, feedbackController.updateFeedbackStatus);
router.delete('/:id',  verifyAdmin, feedbackController.deleteFeedback);

module.exports = router;