const userModel = require('../models/User');
const Subject = require('../models/Subject');
const mongoose = require('mongoose');
module.exports.createSubject = async (req, res, next) => {
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
    
    const newSubject = await Subject.create({
      subject_name: subject_name,
      teacher_id: id,
      subject_id: new mongoose.Types.ObjectId(),
    });
     console.log('New Subject', newSubject);
    let userSubjects = await userModel.findByIdAndUpdate(id, { $push: { subjects: newSubject._id } }, { new: true });
    console.log('Updated User', userSubjects.id === id ? userSubjects : null );

    // const updatedUser = await user.save();
    return res.status(201).json({
      success: true,
      message: 'Subject created successfully.',
      user: userSubjects,
    });
  } catch (err) {
    console.error('Error creating subject:', err);
    // return res.status(500).json({
    //   error: err.message,
    //   success: false,
    //   message: "Internal Server Error",
    // });
    next(err);
  }
};
