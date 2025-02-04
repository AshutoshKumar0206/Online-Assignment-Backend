const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const OTPSchema = new mongoose.Schema(
  {
    mobileNo: {
      type: String,
      required: true,
      index: true, // Index for faster lookups
    },
    otp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // Auto-manages createdAt and updatedAt
);

// Expire OTP after 5 minutes
OTPSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });

// Hash OTP before saving
OTPSchema.pre("save", async function (next) {
  if (!this.isModified("otp")) return next();
  const salt = await bcrypt.genSalt(10);
  this.otp = await bcrypt.hash(this.otp, salt);
  next();
});

// Method to validate OTP
OTPSchema.methods.validateOTP = async function (enteredOtp) {
  return await bcrypt.compare(enteredOtp, this.otp);
};

const OTP = mongoose.model("OTP", OTPSchema);

module.exports = OTP;
