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

  const file = req.files.file;

  // Check file type
  const allowedMimeTypes = [
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
  ];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Unsupported file type. Allowed formats: pdf, doc, docx, txt, xls, xlsx, ppt, pptx',
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
    const folder = 'assignments';
    const formatOptions = {
      allowedFormats: ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'],
      useFilename: true,
      resourceType: 'auto',
    };
    const uploadResults = await uploadDocsToCloudinary(file, folder, formatOptions);
    console.log('Uploaded file:', uploadResults);
    const publicId = uploadResults.public_id;
    const fileUrl = uploadResults.secure_url;
    
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
    subject.assignments_id.push(savedAssignment._id.toString());
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



module.exports.getAssignmentDetails = async (req, res, next) => {
  const { id } = req.params; // Get assignment ID from request params

  try {
    // Find the assignment by ID
    const assignment = await Assignment.findById(id);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found.',
      });
    }

    

    // Respond with the assignment and subject details
    return res.status(200).json({
      success: true,
      message: 'Assignment fetched successfully.',
      assignment: {
        ...assignment.toObject(), // Convert assignment to plain object
      },
    });
  } catch (error) {
    console.error('Error fetching assignment details:', error);
    next(error); // Pass the error to the next middleware for handling
  }
};
