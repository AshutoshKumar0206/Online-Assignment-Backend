const mongoose = require('mongoose');
const Subject = require('../models/Subject'); // Ensure this path points to your Subject model
const userModel = require('../models/User'); // Ensure this path points to your User model
const assignmentModel = require("../models/Assignment");
const fileUpload = require('express-fileupload');
const { uploadDocsToCloudinary } = require('../utils/docsUploader');

// Helper function to generate a unique subject code
async function generateUniqueSubjectCode() {
  let code;
  let isUnique = false;

  do {
    code = Array.from({ length: 8 }, () =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        .charAt(Math.floor(Math.random() * 62))
    ).join('');
    const existing = await Subject.findOne({ subject_code: code });
    isUnique = !existing;
  } while (!isUnique);

  return code;
}

module.exports.createSubject = async (req, res) => {
  const { id } = req.params;
  // const id = req.user.id;
  const { subject_name } = req.body;

  try {
     if(id !== req.user.id){
        return res.status(404).send({
          success: false,
          message: 'User is unauthorized to check other persons data'
        })
      }
    // Fetch the user by ID
    const user = await userModel.findById(id);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Ensure only teachers can create subjects
    if (user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Only teachers can create subjects.' });
    }

    // Generate a unique subject_code
    const subject_code = await generateUniqueSubjectCode();

    // Create a new Subject object
    const newSubject = new Subject({
      subject_name: subject_name,
      teacher_id: id,
      subject_id: new mongoose.Types.ObjectId(),
      teacher_name: `${user.firstName} ${user.lastName}`, // Concatenate first and last name
      subject_code: subject_code, // Add the generated subject_code
    });


    // Save the new Subject to the database
    const savedSubject = await newSubject.save();

    // Update the teacher's subjects array
    const userSubjects = await userModel.findByIdAndUpdate(
      id, 
      { $push: { subjects: savedSubject.id } }, 
      { new: true }
    );

    // Return the response
    return res.status(201).json({
      user: userSubjects,
      success: true,
      message: 'Subject created successfully.',
    });
  } catch (err) {
    return res.status(500).json({
      error: err.message,
      success: false,
      message: "Internal Server Error",
    });
  }
};


// Controller for getting all subjects of a user
module.exports.getSubject = async (req, res, next) => {
  const { id } = req.params; 
  try {
    
    // Find the subject using the `subject_id`
    const subject = await Subject.findOne({ subject_id: id });

    // Check if the subject exists
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not created. Please create the subject.',
      });
    }


    const teacherId = subject.teacher_id;

    // Check if the teacher ID exists
    if (!teacherId) {
      return res.status(404).json({
        success: false,
        message: 'Teacher is not registered.',
      });
    }

    // Fetch teacher details, excluding the password
    const teacher = await userModel.findById(teacherId).select('-password');

    // Check if the teacher exists
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found.',
      });
    }


    let assignments = [];
    if (subject.assignments_id && subject.assignments_id.length > 0) {
      assignments = await assignmentModel.find({ _id: { $in: subject.assignments_id } })
        .select('_id title') // Only include ID and title
        .lean(); // Return plain JavaScript objects
    }

    // Construct and return the response
    return res.status(200).json({
      success: true,
      message: 'Subject fetched successfully.',
      subject_id: subject.subject_id,
      subject_code: subject.subject_code, // Include the subject_code
      subject_name: subject.subject_name, // Correctly fetch from `subject`
      teacher_name: `${teacher.firstName} ${teacher.lastName}`, // Full teacher name
      teacher_id: subject.teacher_id,
      students: subject.students_id, // Include associated students if applicable
      assignments: assignments.length > 0 ? assignments : [], // Include associated assignments if applicable
    });
  } catch (err) {
    next(err);
  }
};

//Controller for including students
module.exports.addStudent = async (req, res, next) => {
  const { id } = req.params;//fetch subjectId from url
  const emails  = req.body.email;
  try{
    let subjectId = await Subject.findOne({subject_id: id});

    subjectId = subjectId._id; 
    if(!emails){
      let studentsAdded = await Subject.findById(subjectId).populate({ path: 'students_id', select: '-password -subjects',});
      return res.status(200).json({ 
        success: true, 
        message: 'Existing students returned.' ,
        notFoundStudents : "",
        students_id: studentsAdded.students_id
      });
    }
    let listOfEmails = emails.split(',').map(email => email.trim());
     let notFoundStudents = [];
     
     for(const email of listOfEmails){
      // Check if the email is empty
      if (!email) {
        continue; // Skip further processing for this email
      }
      
       let student = await userModel.findOne({email});
       if(student && student.role === 'student'){
        let studentId = await Subject.findByIdAndUpdate(
          subjectId, { $addToSet: { students_id: student._id.toString() } },{ new: true }
        );
        let subjects = await userModel.findByIdAndUpdate(
          student._id, { $addToSet: { subjects: subjectId.toString() } },{ new: true }
        );
        } else{
          let notStudent = notFoundStudents.push(email);
        }
      }
      
      let studentsAdded = await Subject.findById(subjectId).populate({ path: 'students_id', select: '-password -subjects',});
    res.status(200).json({ 
      success: true,
      message: "Students added successfully.",
      notFoundStudents,
      students_id: studentsAdded.students_id,
  });

  } catch(err){
    next(err);
  }
}

//Controller for removing students
module.exports.removeStudent = async (req, res, next) => {
  let subjectId = req.params.id;
  let studentId = req.body.studentId;
  const email = req.body.studentEmail;
  try{
    // Remove studentId from subject's studentIds array
    let subject = await Subject.findOne({subject_id : subjectId});
    
    await Subject.findOneAndUpdate({subject_id : subjectId}, {
      $pull: { students_id: studentId },
    });
    subjectId = subject._id;
      // Remove subjectId from student's subjects array
      await userModel.findOneAndUpdate({email : email}, {
          $pull: { subjects: subjectId.toString() },
      });

      res.status(200).send({ 
        success: true, 
        message: 'Student removed successfully'
      });

  } catch(err){
    res.status(500).send({ 
      success: false, 
      message: 'Internal Server Error', 
    });
  }
}


module.exports.joinSubject = async (req, res, next) => {
  const { id } = req.params; // Student ID from the URL
  const { subject_code } = req.body; // Subject code from the request body

  try {
    // Validate the input
    if (!subject_code) {
      return res.status(400).json({
        success: false,
        message: 'Subject code is required.',
      });
    }

    // Find the subject by subject_code
    const subject = await Subject.findOne({ subject_code });

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found. Please check the subject code.',
      });
    }

    // Check if the student is already enrolled in the subject
    if (subject.students_id.includes(id)) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this subject.',
      });
    }

    // Add the student to the subject's students_id array
    await Subject.findByIdAndUpdate(
      subject._id,
      { $addToSet: { students_id: id } },
      { new: true }
    );

    // Add the subject to the student's subjects array
    await userModel.findByIdAndUpdate(
      id,
      { $addToSet: { subjects: subject._id.toString() } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Successfully joined the subject.',
      subject: {
        subject_name: subject.subject_name,
        teacher_name: subject.teacher_name,
      },
    });
  } catch (error) {
    next(error);
  }
};


module.exports.deleteSubject = async (req, res) => {
  const { id } = req.params; // Subject ID

  try {
    // Find the subject by subject_id
    const subject = await Subject.findOne({ subject_id: id });
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found.',
      });
    }

    // Remove subject from students' subject list
    await userModel.updateMany(
      { subjects: subject._id.toString() },
      { $pull: { subjects: subject._id.toString() } }
    );

    // Delete all assignments associated with the subject
    const assignments = subject.assignments_id || [];
    if (assignments.length > 0) {
      // Delete all submissions related to these assignments
      await submissionModel.deleteMany({ assignment_id: { $in: assignments } });
      // Delete the assignments themselves
      await assignmentModel.deleteMany({ _id: { $in: assignments } });
    }

    // Remove subject from teacher's subject list
    await userModel.updateOne(
      { role: 'teacher', subjects: subject._id.toString() },
      { $pull: { subjects: subject._id.toString() } }
    );
    

    // Delete the subject itself
    await Subject.findByIdAndDelete(subject._id);

    res.status(200).json({
      success: true,
      message: 'Subject and its related data deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};