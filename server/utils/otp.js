import { sendOtpEmail } from "../controllers/nodemailer.js";
import User from "../models/User.js";
import crypto from "crypto";

const hashValue = (value) => {
  return crypto.createHash("sha256").update(value).digest("hex");
};

export const requestOtp = async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const otp = generateOtp();

  // OTP expiry (10 minutes)
  const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

  const user = await User.findOne({ emailHash: hashValue(normalizedEmail) });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.otp = otp;
  user.otpExpiresAt = Date.now() + 10 * 60 * 1000;
  await user.save();

  await sendOtpEmail(normalizedEmail, otp);

  res.json({ message: "OTP sent to your email" });
};
