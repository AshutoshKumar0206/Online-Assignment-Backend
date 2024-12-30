const userModel = require('../models/User');
const Subject = require('../models/Subject');
const { default: mongoose } = require('mongoose');

module.exports.createSubject = async (req, res) => {
  const { id } = req.params;
  const { subject_name } = req.body;
  
  try {
    const user = await userModel.findById(id);
    console.log('id', id);
    console.log(`subjectName: ${subject_name}`);
    console.log('User', user);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Only teachers can create subjects.' });
    }

    const newSubject = new Subject({
      subject_name: subject_name,
      teacher_id: id,
      subject_id: new mongoose.Types.ObjectId(),
      teacher_name: user.firstName + " " + user.lastName,
    });
     console.log('New Subject', newSubject);
    const savedSubject = await newSubject.save();
    // user.subjects.push(savedSubject._id);
    console.log("A new ID", savedSubject.id);
    let userSubjects = await userModel.findByIdAndUpdate(id, { $push: { subjects: savedSubject.id } }, { new: true });
    console.log('Updated User', userSubjects.id === id ? userSubjects : null );

    // const updatedUser = await user.save();
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

//Controller for getting all subjects of user
module.exports.getSubject = async (req, res, next) => {
    const { id } = req.params;
    try{
    console.log('id:', id);
     let subject = await Subject.findOne({subject_id : id});
     console.log('Subject:', subject);                                     
      
    if(!subject){
      res.status(404).json({ 
        success: false, 
        message: 'Subject not created. Please Create Subject' 
      });
    } 
    console.log('User hai mai kya kr lega bei:', subject);
    let teacherId = subject.teacher_id;
    console.log(teacherId);
    if(!teacherId){
      return res.status(404).json({
         success: false, 
         message: 'User is not registered.' 
      });
    }

    let user = await userModel.findById(teacherId).select("-password"); 
     console.log('User:', user);
    if(!user){
      return res.status(404).json({ 
        success: false, 
        message: 'User not found.'  
      });
    }

    return res.status(200).json({ 
       success: true, 
       message: "Subject fetched successfully.", 
       subject_id: subject.subject_id,
       subject_name: user.subject_name,
       teacher_name: user.firstName + " " + user.lastName,
       teacher_id: subject.teacher_id,
         
      });
   } catch(err){
      next(err);
   }
}

//Controller for including students
module.exports.addStudent = async (req, res, next) => {
  const { id } = req.params;//fetch subjectId from url
  const emails  = req.body.email;
  console.log('Emails:', emails);
  try{
     if(!emails){
      return res.status(400).json({ 
        success: false, 
        message: 'Student Emails have to be provided.' 
      });
     }
     let subjectId = await Subject.findOne({subject_id: id});
     subjectId = subjectId._id; 
     let listOfEmails = emails.split(',').map(email => email.trim());
     let notFoundStudents = [];
      
     for(const email of listOfEmails){
        let student = await userModel.findOne({email});
        console.log('Student hu bei kya kr lega:', student); 
        if(student){
          let studentId = await Subject.findByIdAndUpdate(subjectId, {$push: { students_id: student._id.toString() } }, { new: true });
          console.log('Student Added:', studentId); 
        } else if(!student){
           let notStudent = notFoundStudents.push(email);
           console.log('Not Found Student:', notStudent);
        }
     }
     
     let studentsAdded = await Subject.findById(subjectId).populate({
                                                            path: 'students_id',
                                                            select: '-password -subjects',                                
                                                          });
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
