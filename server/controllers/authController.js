import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwtUtils.js";
import { hashValue } from "../config/encryption.js";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { name, email, phone, address, password, role } = req.body;

    // Validate input
    if (!name || !email || !phone || !address || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check for existing user using hashes
    const emailHash = hashValue(email.toLowerCase().trim());
    const phoneHash = hashValue(phone.replace(/\D/g, ""));

    const [existingEmail, existingPhone] = await Promise.all([
      User.findOne({ emailHash }).select("_id").lean(),
      User.findOne({ phoneHash }).select("_id").lean(),
    ]);

    if (existingEmail) {
      return res.status(409).json({ message: "Email already registered" });
    }
    if (existingPhone) {
      return res.status(409).json({ message: "Phone already registered" });
    }

    const user = new User({
      name,
      email,
      emailHash,
      phone,
      phoneHash,
      address,
      password,
      role,
    });
    await user.save();

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({
      id: user._id,
      role: user.role,
    });

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accessToken,
    });
  } catch (error) {
    console.error("Registration error:", error);
    const status = error.message.includes("registered")
      ? 409
      : error.message.includes("Invalid")
      ? 400
      : 500;
    res.status(status).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, otp } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.toLowerCase().trim();
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const user = await User.findOne({
      emailHash: hashValue(normalizedEmail),
    }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (otp) {
      if (otp) {
        const providedOtp = String(otp).trim();
        const otpValid =
          String(user.otp) === providedOtp &&
          user.otpExpiresAt &&
          user.otpExpiresAt > Date.now();
        if (!otpValid) {
          return res.status(400).json({ message: "Invalid or expired OTP" });
        }
      }
    } else if (password) {
      const passwordMatch = await user.comparePassword(password);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid password" });
      }
    } else {
      return res
        .status(400)
        .json({ message: "Please provide OTP or password" });
    }

    const accessToken = generateAccessToken({ id: user._id, role: user.role });
    const refreshToken = generateRefreshToken({
      id: user._id,
      role: user.role,
    });

    user.refreshToken = refreshToken;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
};
export const refreshToken = async (req, res) => {
  const token =
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    req.headers["x-refresh-token"];

  if (!token) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    // Use decoded.id to directly find user
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // ✅ Generate new access token with id
    const accessToken = generateAccessToken({
      id: user._id,
      role: user.role,
    });

    return res.json({ accessToken });
  } catch (error) {
    console.error("Refresh error:", error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export const logout = async (req, res) => {
  // ✅ Extract refreshToken from anywhere
  const refreshToken =
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    req.headers["x-refresh-token"] ||
    req.query?.refreshToken;

  // ✅ Extract accessToken from anywhere
  const accessToken = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : req.body?.accessToken ||
      req.headers["x-access-token"] ||
      req.query?.accessToken;

  if (!refreshToken) return res.sendStatus(204); // already logged out

  try {
    // ✅ Decode refresh token to get user ID
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const userId = decoded.id;

    if (!userId) return res.sendStatus(403); // Malformed token

    // ✅ Optionally decode and log access token (for audit/debug)
    if (accessToken) {
      try {
        const decodedAccess = jwt.verify(
          accessToken,
          process.env.ACCESS_TOKEN_SECRET
        );
        console.log("Logging out user:", decodedAccess.id);
      } catch (err) {
        console.warn("Invalid access token (ignored)");
      }
    }

    // ✅ Invalidate refresh token in DB (based on ID)
    await User.findByIdAndUpdate(userId, { refreshToken: null });

    // ✅ Clear cookie if browser
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    res.sendStatus(204); // Logout success
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};

export const getUserCount = async (req, res) => {
  try {
    const count = await User.countDocuments();
    return res.status(200).json({ totalUsers: count });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
