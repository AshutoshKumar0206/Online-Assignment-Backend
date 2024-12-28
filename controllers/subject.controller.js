const User = require('../models/User');
const Subject = require('../models/Subject');

module.exports.createSubject = async (req, res) => {
  const { id } = req.params;
  const { subject_name } = req.body;

  try {
    const user = await User.findById(id);
    console.log(`id: ${id}`);
    console.log(`subjectName: ${subject_name}`);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Only teachers can create subjects.' });
    }

    const newSubject = new Subject({
      subject_name: subject_name,
      teacher_id: id,
    });

    const savedSubject = await newSubject.save();
    user.subjects.push(savedSubject._id);
    const updatedUser = await user.save();

    return res.status(201).json({
      success: true,
      message: 'Subject created successfully.',
      user: updatedUser,
    });
  } catch (err) {
    console.error('Error creating subject:', err);
    return res.status(500).json({
      success: false,
      message: `${err.message}`,
    });
  }
};
