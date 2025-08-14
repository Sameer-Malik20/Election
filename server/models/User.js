import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { encrypt, decrypt, hashValue } from "../config/encryption.js";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      set: encrypt,
      get: decrypt,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      validate: {
        validator: function (email) {
          if (email.includes(":")) return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        message: "Invalid email format",
      },
      set: function (value) {
        const emailLower = value.toLowerCase().trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
          throw new Error("Invalid email format");
        }
        this.emailHash = hashValue(emailLower);
        return encrypt(emailLower);
      },
      get: decrypt,
    },
    emailHash: { type: String, unique: true, select: false },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      unique: true,
      set: function (value) {
        const cleanPhone = value.replace(/\D/g, "");
        if (cleanPhone.length < 10 || cleanPhone.length > 15) {
          throw new Error("Phone must be 10-15 digits");
        }
        this.phoneHash = hashValue(cleanPhone);
        return encrypt(cleanPhone);
      },
      get: decrypt,
    },
    phoneHash: { type: String, unique: true, select: false },
    address: {
      type: String,
      required: [true, "Address is required"],
      set: encrypt,
      get: decrypt,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      set: encrypt,
      get: decrypt,
    },
    otp: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    otpExpiresAt: { type: Date },
    role: {
      type: String,
      enum: ["employee", "admin", "super"],
      default: "employee",
    },
    refreshToken: { type: String },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      select: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      getters: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.emailHash;
        delete ret.phoneHash;
        return ret;
      },
    },
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(new Error("Password hashing failed"));
  }
});

userSchema.methods.comparePassword = async function (candidatePassword, otp) {
  try {
    if (otp) {
      return this.otp === otp;
    }
    const decryptedCandidate = decrypt(candidatePassword);
    const decryptedStored = decrypt(this.password);
    return await bcrypt.compare(decryptedCandidate, decryptedStored);
  } catch (error) {
    throw new Error("Password comparison failed");
  }
};

export default mongoose.model("User", userSchema);
