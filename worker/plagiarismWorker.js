const { Worker } = require('bullmq');
const axios = require('axios');
const User = require('../models/User');
const mongoose = require("mongoose");
const plagiarismReportModel = require('../models/plagiarismReport.model');
const Submission = require('../models/Submission');
const connnection = require("../config/redisConfig")

// Import userModel, etc.
console.log("worker is online and listening")
const worker = new Worker('plagiarism-tasks', async (job) => {
    console.log('hello', job);
  const { assignment_id, fileDetails, fileUrlMap, submissions, submitted, late, notSubmitted, mlUrl } = job.data;
  console.log('Job data:', job.data);
   try {
 let mlResponse;
    try {
      mlResponse = await axios.post(
        `${mlUrl}/upload`,
        { fileDetails },
        { headers: { 'Content-Type': 'application/json' } }
      );
      // console.log(mlResponse.data.rubricResults);
      // console.log(mlResponse.data.results);
    } catch (err) {
      // console.log(err);
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to ML model',
      });
    }
    
    const results = await Promise.all(
      mlResponse.data.results.map(async (response) => {
        const student1 = await User
          .findById(new mongoose.Types.ObjectId(response.studentId1))
          .select('firstName lastName rollNo')
          .exec();
        const student2 = await User
          .findById(new mongoose.Types.ObjectId(response.studentId2))
          .select('firstName lastName rollNo')
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
                rollNo: student1.rollNo,
                fileUrl: fileUrlMap[response.studentId1],
                id: response.studentId1,
              }
            : { name: response.studentId1, rollNo: null, fileUrl: null, id: response.studentId1 },
          studentId2: student2
            ? {
                name: `${student2.firstName} ${student2.lastName}`,
                rollNo: student2.rollNo,
                fileUrl: fileUrlMap[response.studentId2],
                id: response.studentId2,
              }
            : { name: response.studentId2, rollNo: null, fileUrl: null, id: response.studentId2 },
        };
      })
    );
    
    const rubricResults = await Promise.all(
      mlResponse.data.rubricResults.map(async (response) => {
        const student1 = await User
          .findById(new mongoose.Types.ObjectId(response.StudentId))
          .select('firstName lastName rollNo')
          .exec();

        return {
          Assignment: response.Assignment,
          CompletenessScore: response['Completeness Score'],
          FinalRubricScore: response['Final Rubric Score (%)'],
          GrammarScore: response['Grammar Score'],
          OriginalityScore: response['Originality Score'],
          StructureScore: response['Structure Score'],
          studentId: student1
            ? {
                name: `${student1.firstName} ${student1.lastName}`,
                rollNo: student1.rollNo,
                fileUrl: fileUrlMap[response.StudentId],
                id: response.StudentId,
              }
            : { name: response.StudentId, rollNo: null, fileUrl: null, id: response.StudentId },
        };
      })
    ); 

    const updatedSubmissions = submissions.map(submission => ({
      studentId: submission.studentId._id,
      firstName: submission.studentId.firstName,
      lastName: submission.studentId.lastName,
      rollNo: submission.studentId.rollNo,
      fileURL: submission.fileURL,
      status: submission.status,
      grade: submission.grade,
      feedback: submission.feedback,
    }));

    await plagiarismReportModel.findOneAndUpdate(
        { assignmentId: job.data.assignment_id },
        { 
            results: results, 
            rubricResults: rubricResults,
            submitted: submitted,
            late: late,
            notSubmitted: notSubmitted,
            submissions: submissions, 
            status: 'completed' 
        },
        { upsert: true, new: true }
    );

    return {
        success: true, 
        message: "Plagiarism checked for assignments",
        assignment_id,
        mlResponse: { ...mlResponse.data, results, rubricResults },
        submitted,
        late,
        notSubmitted,
        submissions: updatedSubmissions,
    };

  return { success: true };
}catch(err) {
    console.error(`Job ${job.id} failed:`, err.message);
    
    // Update report status to failed so the UI can show an error
    await plagiarismReportModel.findOneAndUpdate(
      { assignmentId: new mongoose.Types.ObjectId(assignment_id) },
      { status: 'failed' }
    );

    // Throwing the error tells BullMQ the job failed (it will retry based on your queue config)
    throw err; 
  }
}, { connection });

worker.on('ready', () => {
  console.log("✅ Worker is online and listening!");
});

worker.on('error', (err) => {
  console.error("❌ Worker connection error:", err);
});    

worker.on('completed', (job) => {
  console.log(`Job ${job.id} has completed!`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
})