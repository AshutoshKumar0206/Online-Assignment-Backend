const mongoose = require('mongoose');

const PlagiarismReportSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
    unique: true // One report per assignment
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  // Data for the "Similarity Matrix" (Comparisons between students)
  results: [{
    Assignment1: String,
    Assignment2: String,
    CosineSimilarity: Number,
    JaccardSimilarity: Number,
    CombinedSimilarity: Number,
    studentId1: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String,
      rollNo: String,
      fileUrl: String
    },
    studentId2: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String,
      rollNo: String,
      fileUrl: String
    }
  }],
  // Data for individual AI grading/rubric analysis
  rubricResults: [{
    Assignment: String,
    CompletenessScore: Number,
    FinalRubricScore: Number,
    GrammarScore: Number,
    OriginalityScore: Number,
    StructureScore: Number,
    studentId: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String,
      rollNo: String,
      fileUrl: String
    }
  }],
  submitted: {
    type: Number,
    default: 0
  },
  notSubmitted: {
    type: Number,
    default: 0
  },
  late: {
    type: Number,
    default: 0
  },
  submissions: {
    type: Array,
    default: []
  },
  error: {
    message: String,
    timestamp: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('PlagiarismReport', PlagiarismReportSchema);