const { uploadDocsToCloudinary } = require('../utils/docsUploader');
const Assignment = require('../models/Assignment'); // Assignment model
const Subject = require('../models/Subject'); // Subject model

module.exports.createAssignment = async (req, res) => {
  const { subjectId } = req.params; // The subject ID passed as a parameter
  const { title, description, deadline, createdBy, minVal, maxVal } = req.body;

  // Validate file upload
  if (!req.files || !req.files.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  const file = req.files.file;
  const folder = 'assignments'; // Folder name for Cloudinary
  const formatOptions = {
    allowedFormats: ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'],
    useFilename: true,
    resourceType: 'raw',
  };

  try {
    // Step 1: Upload the file to Cloudinary
    const uploadResults = await uploadDocsToCloudinary(file, folder, formatOptions);

    // Step 2: Create a new assignment object
    const newAssignment = new Assignment({
      title,
      description,
      deadline,
      createdBy,
      subjectId,
      minVal,
      maxVal,
      fileLink: uploadResults.secure_url, // File URL from Cloudinary
      filePublicId: uploadResults.public_id, // Public ID from Cloudinary
    });

    const savedAssignment = await newAssignment.save();

    // Step 3: Update the subject to add the assignment ID
    const updatedSubject = await Subject.findByIdAndUpdate(
      subjectId,
      { $push: { assignmentId: savedAssignment._id } }, // Push the new assignment's ID to the subject
      { new: true } // Return the updated document
    );

    if (!updatedSubject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    // Step 4: Respond with success
    return res.status(201).json({
      success: true,
      message: 'Assignment created and linked to subject successfully',
      assignment: savedAssignment,
    });
  } catch (err) {
    console.error('Error creating assignment:', err);

    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    });
  }
};
