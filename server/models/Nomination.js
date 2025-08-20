import mongoose from "mongoose";
import { encrypt, decrypt, hashValue } from "../config/encryption.js";

const positionEnums = [
  "CEO",
  "CTO",
  "CFO",
  "COO",
  "Manager",
  "Team Lead",
  "Senior Developer",
  "Developer",
  "HR Manager",
  "Marketing Head",
  "Sales Manager",
  "Product Manager",
  "Operations Manager",
  "Finance Manager",
];

const nominationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    position: {
      type: String,
      required: false,
      enum: {
        values: positionEnums, // Validation on raw value
        message: "{VALUE} is not a valid position",
      },
      get: decrypt, // Decrypt when reading
    },

    description: {
      type: String,
      set: encrypt,
      get: decrypt,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isRejected: {
      type: Boolean,
      default: false,
    },
    rejectReason: { type: String, default: "" },
    announcement: {
      title: { type: String, set: encrypt, get: decrypt },
      message: { type: String, set: encrypt, get: decrypt },
      eligibility: { type: String, set: encrypt, get: decrypt },
    },
    // Additional fields if needed
    nominationDate: {
      type: Date,
      default: Date.now,
    },
    votes: [
      {
        ip: String,
        signature: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        votedAt: { type: Date, default: Date.now },
      },
    ],

    isElectionCompleted: {
      type: Boolean,
      default: false,
    },
    completedCount: {
      type: Number,
      default: 0,
    },
  },

  {
    timestamps: true,
    toJSON: {
      getters: true,
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        // Ensure encrypted fields are decrypted in JSON output
        if (ret.position) ret.position = decrypt(ret.position);
        if (ret.description) ret.description = decrypt(ret.description);
        return ret;
      },
    },
  }
);

nominationSchema.pre("save", function (next) {
  if (this.isModified("position")) {
    this.position = encrypt(this.position); // ✅ Encrypt only after validation
  }
  next();
});

// Indexes
nominationSchema.index({ user: 1 }); // For finding user's nominations
nominationSchema.index({ isVerified: 1 }); // For admin verification queries
nominationSchema.index({ position: 1 }); // For position-based queries
nominationSchema.index({ isElectionCompleted: 1 });

export default mongoose.model("Nomination", nominationSchema);
