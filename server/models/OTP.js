import mongoose from 'mongoose';

/**
 * OTP Schema
 * Stores temporary 6-digit email verification codes.
 * Uses a TTL index on expiresAt to automatically purge expired tokens.
 */
const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Document will expire at the timestamp in expiresAt
    },
  },
  {
    timestamps: true,
  }
);

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;
