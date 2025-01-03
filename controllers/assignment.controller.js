const Subject = require('../models/Subject'); // Import Subject model
const Assignment = require('../models/Assignment'); // Import Assignment model
const { uploadDocsToCloudinary } = require('../utils/docsUploader'); // Utility for file upload

module.exports.createAssignment = async (req, res) => {
  const { id } = req.params; // Subject ID from route parameters
  const { title, description, deadline, createdBy, minVal, maxVal } = req.body;

  if (!req.files || !req.files.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded',
    });
  }

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Subject ID is required',
    });
  }

  try {
    // Step 1: Find the Subject by `subject_id`
    const subject = await Subject.findOne({ subject_id: id });
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    // Step 2: Upload the file to Cloudinary
    const file = req.files.file;
    const folder = 'assignments';
    const formatOptions = {
      allowedFormats: ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'],
      useFilename: true,
      resourceType: 'raw',
    };
    const uploadResults = await uploadDocsToCloudinary(file, folder, formatOptions);

    // Step 3: Create the Assignment
    const newAssignment = new Assignment({
      title,
      description,
      deadline,
      createdBy,
      subjectId: subject._id, // Link assignment to the subject's `_id`
      minVal,
      maxVal,
      fileLink: uploadResults.secure_url,
      filePublicId: uploadResults.public_id,
    });

    const savedAssignment = await newAssignment.save();

    // Step 4: Update the Subject's `assignments_id` field
    subject.assignments_id.push(savedAssignment._id.toString()); // Add the assignment's ID to the `assignments_id` array
    await subject.save();

    // Step 5: Respond with success
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
