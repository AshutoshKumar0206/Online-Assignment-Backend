require('dotenv').config();
const Subject = require('../models/Subject'); // Import Subject model
const userModel = require('../models/User'); // Import User model
const Assignment = require('../models/Assignment'); // Import Assignment model
const { uploadDocsToCloudinary } = require('../utils/docsUploader'); // Utility for file upload
const multer = require('multer');
const Submission = require('../models/Submission');
const upload = multer({ dest: 'uploads/' }); // Temporary storage before cloud upload
const mongoose = require('mongoose');
const { response } = require('express');
// const mlUrl = process.env.NODE_URL || "http://localhost:8081"
const axios = require('axios')

module.exports.createAssignment = async (req, res) => {
  const { id } = req.params; // Subject ID from route parameters

  const { title, description, deadline,  minVal, maxVal } = req.body;
  // console.log(`created by: ${createdBy}`);

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
    const folder = process.env.FOLDER_NAME;
    const formatOptions = {
      allowedFormats: ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'],
      useFilename: true,
      resourceType: 'auto',
    };
    const uploadResults = await uploadDocsToCloudinary(file, folder, formatOptions);
    const publicId = uploadResults.public_id;
    const fileUrl = uploadResults.secure_url; 

    // Step 3: Create the Assignment
    const newAssignment = new Assignment({
      title,
      description,
      deadline,

      createdBy: subject.teacher_id,
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
    next(error); // Pass the error to the next middleware for handling
  }
};

// const Assignment = require('path-to-your-assignment-model'); // Import the Assignment model

module.exports.submitAssignment = async (req, res) => {
  const assignmentId = req.params.id;
  const studentId = req.user.id; // Assuming JWT-based authentication

  try {
    // Fetch the assignment details
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found',
      });
    }

    // Check if a submission already exists
    const existingSubmission = await Submission.findOne({ assignmentId, studentId });

    const currentTime = new Date();
    const isLate = currentTime > new Date(assignment.deadline);

    const file = req.files.fileupload;

    // Check file type
    const allowedMimeTypes = [
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type. Allowed formats: pdf, doc, docx, txt, xls, xlsx, ppt, pptx',
      });
    }

    const folder = process.env.FOLDER_NAME;
    const formatOptions = {
      allowedFormats: ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'],
      useFilename: true,
      resourceType: 'auto',
    };
    const uploadFile = await uploadDocsToCloudinary(file, folder, formatOptions);

    if (existingSubmission) {
      // Update existing submission with the new file URL
      existingSubmission.fileURL = uploadFile.secure_url;
      existingSubmission.submissionDate = currentTime;
      existingSubmission.status = isLate ? 'late' : 'submitted';
      await existingSubmission.save();

      // console.log(`existing submission ${existingSubmission}`);

      return res.status(200).json({
        success: true,
        message: isLate
          ? 'Late resubmission successful. Your submission is marked as late.'
          : 'Resubmission successful.',
        submission: existingSubmission,
      });
    } else {
      // Create a new submission document in the database
      const submission = new Submission({
        assignmentId,
        studentId,
        fileURL: uploadFile.secure_url,
        submissionDate: currentTime,
        status: isLate ? 'late' : 'submitted',
      });

      await submission.save();

      return res.status(201).json({
        success: true,
        message: isLate
          ? 'Late submission successful. Your submission is marked as late.'
          : 'Submission successful.',
        submission,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit assignment',
    });
  }
};



module.exports.getAllAssignments = async (req, res) => {
  try {
    let id = req.params.id;
    id = new mongoose.Types.ObjectId(id);

    // Fetch submissions for the given assignmentId and populate student details (name, rollNo)
    const submissions = await Submission.find({ assignmentId: id })
      .populate("studentId", "firstName lastName rollNo")
      .select("fileURL status");


    // Separate submissions into two arrays based on their status
    const submittedSubmissions = [];
    const lateSubmissions = [];

    submissions.forEach((submission) => {
      const formattedSubmission = {
        studentId: submission.studentId._id,
        firstName: submission.studentId.firstName,
        lastName: submission.studentId.lastName,
        rollNo: submission.studentId.rollNo,
        fileURL: submission.fileURL,
      };

      if (submission.status === "submitted") {
        submittedSubmissions.push(formattedSubmission);
      } else if (submission.status === "late") {
        lateSubmissions.push(formattedSubmission);
      }
    });

    res.status(200).json({
      success: true,
      message: "Assignment submissions fetched successfully.",
      submissions: {
        submitted: submittedSubmissions,
        late: lateSubmissions,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
};

module.exports.updateAssignment = async (req, res, next) => {
let assignmentId = req.params.id;
assignmentId = new mongoose.Types.ObjectId(assignmentId);
let title = req.body.assignment.title;
let description = req.body.assignment.description;
let deadline = req.body.assignment.deadline;
let maxVal = req.body.assignment.maxVal;
let minVal = req.body.assignment.minVal;
try{
  const updatedAssignmentDetails = await Assignment.findByIdAndUpdate(assignmentId, {title: title, description : description, 
                                                                                      deadline: deadline, minVal : minVal, maxVal: maxVal}, 
                                                                                        {new : true});
  
    if(!updatedAssignmentDetails){
      res.status(404).json({
        success: false,
        message: "Assignment not found",
      })
    }

    res.status(200).json({
    success: true,
    message: "Assignment updated successfully",
    title: updatedAssignmentDetails.title,
    description: updatedAssignmentDetails.description,
    deadline: updatedAssignmentDetails.deadline,
    minVal: updatedAssignmentDetails.minVal,
    maxVal: updatedAssignmentDetails.maxVal,
    createdBy: updatedAssignmentDetails.createdBy,
  });  

} catch(err) {
   res.status(500).json({ 
    success: false,
    message: "Error in Updating Assignment",
  });
}
}

module.exports.getAssignmentSubmission = async (req, res) => {
  const assignmentId = req.params.assignmentId;
  const studentId = req.params.studentId;

  try {
    // Find the submission with the given assignmentId and studentId
    const submission = await Submission.findOne({ assignmentId, studentId });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found',
      });
    }

    // Return the file URL to the frontend
    res.status(200).json({
      success: true,
      message: 'Submission found',
      fileURL: submission.fileURL,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submission',
    });
  }
};

module.exports.checkPlagiarism = async (req, res, next) => {
  const assignment_id = req.params.id;
  // const mlUrl = req.hostname === 'localhost'
  // ? "http://localhost:8081" : process.env.NODE_URL;
  const mlUrl = process.env.NODE_URL
  // console.log(assignment_id);
  if (!mongoose.Types.ObjectId.isValid(assignment_id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid assignment ID',
    });
  }

  try {
    // Fetch submissions
    const submissions = await Submission.find({ assignmentId: new mongoose.Types.ObjectId(assignment_id) });
    if (!submissions.length) {
      return res.status(404).json({
        success: false,
        message: 'No submissions found for this assignment',
      });
    }
    console.log(submissions);
    let late=0, submitted=0, notSubmitted=0;
    submissions.map((submission) => {
      if(submission.status === 'submitted') {
          submitted+=1;
      } else if(submission.status === 'late') {
          late+=1;       
      } else {
          
      }
    })
    // // Fetch the subject using the subjectId
    const assignm = await Assignment.findOne({ _id: new mongoose.Types.ObjectId(assignment_id) });
if (!assignm) {
  return res.status(404).json({
    success: false,
    message: 'Assignment not found',
  });
}

// Fetch the subject using the subjectId from the assignment
const subject = await Subject.findOne({ _id: new mongoose.Types.ObjectId(assignm.subjectId) });
if (!subject) {
  return res.status(404).json({
    success: false,
    message: 'Subject not found',
  });
}

// Calculate not submitted count
notSubmitted = subject.students_id.length - submitted - late;
    // notSubmitted=submitted+late;
    // Create a mapping of studentId to fileUrl
    const fileUrlMap = submissions.reduce((map, submission) => {
      map[submission.studentId] = submission.fileURL;
      return map;
    }, {});
    
    // Prepare file details
    const fileDetails = submissions.map((submission) => ({
      studentId: submission.studentId,
      fileUrl: submission.fileURL,
    }));
    console.log(fileDetails);
    let mlResponse;
    try {
      mlResponse = await axios.post(
        `${mlUrl}/upload`,
        { fileDetails },
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to ML model',
      });
    }
    
    const results = await Promise.all(
      mlResponse.data.results.map(async (response) => {
        const student1 = await userModel
          .findById(new mongoose.Types.ObjectId(response.studentId1))
          .select('firstName lastName')
          .exec();
        const student2 = await userModel
          .findById(new mongoose.Types.ObjectId(response.studentId2))
          .select('firstName lastName')
          .exec();

        return {
          Assignment1: response.Assignment1,
          Assignment2: response.Assignment2,
          CosineSimilarity: response['Cosine Similarity (%)'],
          JaccardSimilarity: response['Jaccard Similarity (%)'],
          CombinedSimilarity: response['Combined Similarity (%)'],
          studentId1: student1
            ? {
                name: `${student1.firstName} ${student1.lastName}`,
                fileUrl: fileUrlMap[response.studentId1],
                id: response.studentId1,
              }
            : { name: response.studentId1, fileUrl: null, id: response.studentId1},
          studentId2: student2
            ? {
                name: `${student2.firstName} ${student2.lastName}`,
                fileUrl: fileUrlMap[response.studentId2],
                id: response.studentId2,
              }
            : { name: response.studentId2, fileUrl: null, id: response.studentId2},
        };
      })
    );

    // Send response
    return res.status(200).json({
      success: true,
      message: 'Submitted files sent to check Plagiarism',
      mlResponse: { ...mlResponse.data, results },
      submitted,
      late,
      notSubmitted,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
