const userModel = require('../models/User');
const Subject = require('../models/Subject');

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
      subject_id: Math.random().toString(36).substr(2, 9),
      teacher_name: user.firstName + " " + user.lastName,
    });
     console.log('New Subject', newSubject);
    const savedSubject = await newSubject.save();
    // user.subjects.push(savedSubject._id);
    console.log("A new ID", savedSubject);
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
module.exports.getAllSubjects = async (req, res) => {
  
}
