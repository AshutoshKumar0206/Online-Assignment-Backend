const Feedback = require('../models/Feedback');
const User = require('../models/User');


    // Create new feedback
    module.exports.createFeedback= async (req, res) => {
        try {
            const { userId, message } = req.body;
            let attachments = [];

            // Handle file uploads if present
            if (req.files) {
                const files = Array.isArray(req.files.attachments) 
                    ? req.files.attachments 
                    : [req.files.attachments];

                // Limit to 2 files
                if (files.length > 2) {
                    return res.status(400).json({
                        success: false,
                        message: "Maximum 2 files are allowed"
                    });
                }

                // Upload each file to Cloudinary
                for (const file of files) {
                    const uploadedFile = await uploadImageToCloudinary(
                        file,
                        process.env.FOLDER_NAME,
                        1000,
                        1000
                    );
                    attachments.push(uploadedFile.secure_url);
                }
            }

            const feedback = new Feedback({
                userId,
                message,
                attachments
            });
            
            await feedback.save();
            res.status(201).json({ success: true, data: feedback });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    // Get feedback by ID
    module.exports.getFeedbackById= async (req, res) => {
        try {
            const feedback = await Feedback.findById(req.params.id)
                .populate('userId', 'name email');
            
            if (!feedback) {
                return res.status(404).json({ success: false, error: 'Feedback not found' });
            }

            // Check if user is authorized to view this feedback
            if ( feedback.userId.toString() !== req.params.id.toString()) {
                return res.status(403).json({ success: false, error: 'Not authorized to view this feedback' });
            }

            res.status(200).json({ success: true, data: feedback });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    // Get feedbacks for specific user
    module.exports.getFeedbacks = async (req, res) => {
        try {
            const userId = req.params.userId;

            // Check if user is requesting their own feedbacks
            if (userId !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "Not authorized to view other user's feedbacks"
                });
            }

            const feedbacks = await Feedback.find({ userId })
                .populate('userId', 'name email')
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                data: feedbacks
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    };

    // Get all feedbacks (admin only)
    module.exports.getAllFeedbacks = async (req, res) => {
        try {
            const feedbacks = await Feedback.find()
                .populate('userId', 'name email')
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                data: feedbacks,
                count: feedbacks.length
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    };

    // Update feedback status (admin only)
    module.exports.updateFeedbackStatus= async (req, res) => {
        try {

            const { status } = req.body;
            const feedback = await Feedback.findByIdAndUpdate(
                req.params.id,
                { status },
                { new: true }
            ).populate('userId', 'name email');

            if (!feedback) {
                return res.status(404).json({ success: false, error: 'Feedback not found' });
            }

            res.status(200).json({ success: true, data: feedback });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    },

    // Delete feedback (admin only)
    module.exports.deleteFeedback= async (req, res) => {
        try {
            const feedback = await Feedback.findByIdAndDelete(req.params.id);
            if (!feedback) {
                return res.status(404).json({ success: false, error: 'Feedback not found' });
            }
            
            res.status(200).json({ success: true, data: {} });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    }

