const mongoose = require('mongoose');
const Subject = require('../models/Subject'); // Ensure this path points to your Subject model
const userModel = require('../models/User'); // Ensure this path points to your User model

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
  const { subject_name } = req.body;
  
  try {
    // Fetch the user by ID
    const user = await userModel.findById(id);
    console.log('id', id);
    console.log(`subjectName: ${subject_name}`);
    console.log('User', user);

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

    console.log('New Subject', newSubject);

    // Save the new Subject to the database
    const savedSubject = await newSubject.save();
    console.log('A new ID', savedSubject.id);

    // Update the teacher's subjects array
    const userSubjects = await userModel.findByIdAndUpdate(
      id, 
      { $push: { subjects: savedSubject.id } }, 
      { new: true }
    );
    console.log('Updated User', userSubjects.id === id ? userSubjects : null);

    // Return the response
    return res.status(201).json({
      user: userSubjects,
      success: true,
      message: 'Subject created successfully.',
    });
  } catch (err) {
    console.error('Error creating subject:', err);
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
    console.log('id:', id);

    // Find the subject using the `subject_id`
    const subject = await Subject.findOne({ subject_id: id });
    console.log('Subject:', subject);

    // Check if the subject exists
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not created. Please create the subject.',
      });
    }

    console.log('Found subject:', subject);

    const teacherId = subject.teacher_id;
    console.log('Teacher ID:', teacherId);

    // Check if the teacher ID exists
    if (!teacherId) {
      return res.status(404).json({
        success: false,
        message: 'Teacher is not registered.',
      });
    }

    // Fetch teacher details, excluding the password
    const teacher = await userModel.findById(teacherId).select('-password');
    console.log('Teacher:', teacher);

    // Check if the teacher exists
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found.',
      });
    }

    // Log statements for debugging (preserving original logging)
    console.log('User hai mai kya kr lega bei:', subject);
    console.log('Updated User details fetched:', teacher.firstName, teacher.lastName);

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
      assignments: subject.assignments_id, // Include associated assignments if applicable
    });
  } catch (err) {
    console.error('Error fetching subject:', err);
    next(err);
  }
};

//Controller for including students
module.exports.addStudent = async (req, res, next) => {
  const { id } = req.params;//fetch subjectId from url
  const emails  = req.body.email;
  console.log('Emails:', emails);
  try{
    let subjectId = await Subject.findOne({subject_id: id});

    subjectId = subjectId._id; 
    if(!emails){
      let studentsAdded = await Subject.findById(subjectId).populate({ path: 'students_id', select: '-password -subjects',});
      console.log('Students are there:', studentsAdded.students_id); 
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
       let student = await userModel.findOne({email});
       console.log('Student hu bei kya kr lega:', student); 
       if(student && student.role === 'student'){
         let studentId = await Subject.findByIdAndUpdate(subjectId, {$push: { students_id: student._id.toString() } }, { new: true });
         console.log('Student Added:', studentId); 
        } else{
          let notStudent = notFoundStudents.push(email);
          console.log('Not Found Student:', notStudent);
        }
      }
      
      let studentsAdded = await Subject.findById(subjectId).populate({ path: 'students_id', select: '-password -subjects',});
      console.log('Students are there:', studentsAdded.students_id); 
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
  const { id : subjectId  } = req.params;
  const studentId = req.body.studentId;
  try{
      // Remove studentId from subject's studentIds array
      console.log(subjectId, " in remove ", studentId);
      // let subject = await Subject.findOne({subject_id : subjectId});
      // console.log('Before update:', subject);
      await Subject.findOneAndUpdate({subject_id : subjectId}, {
        $pull: { students_id: studentId },
      });
      // subject = await Subject.findOne({subject_id : subjectId});
      // console.log('after update:', subject);
      // Remove subjectId from student's subjects array
      await userModel.findByIdAndUpdate(studentId, {
          $pull: { subjects: subjectId },
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