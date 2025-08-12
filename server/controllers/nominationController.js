import Nomination from "../models/Nomination.js";

// Create a nomination
export const createNomination = async (req, res) => {
  try {
    const { position, description } = req.body;
    const userId = req.user?.id || req.user?._id || req.body.user; // Handle from token or body

    if (!userId || !position || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }

    //  Check if user already applied for the same position
    const existingNomination = await Nomination.findOne({
      user: userId,
      position,
    });

    if (existingNomination) {
      return res.status(409).json({
        message: "You have already applied for this position",
        applied: true,
      });
    }

    const nomination = new Nomination({
      user: userId,
      position,
      description,
    });

    await nomination.save();

    return res.status(201).json({
      message: "Nomination created successfully",
      nomination,
      applied: true,
    });
  } catch (error) {
    console.error("Nomination creation error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get all nominations (Admin or Public View)
export const getAllNominations = async (req, res) => {
  try {
    const { type } = req.query;

    let filter = {};
    if (type === "nominations") {
      filter = { announcement: { $exists: false } }; // Only nominations
    } else if (type === "announcements") {
      filter = { announcement: { $exists: true } }; // Only announcements
    }

    const data = await Nomination.find(filter)
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get user's nominations
export const getUserNominations = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const nominations = await Nomination.find({ user: userId }).sort({
      createdAt: -1,
    });

    return res.status(200).json(nominations);
  } catch (error) {
    console.error("Error fetching user nominations:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Verify a nomination (admin only)
export const verifyNomination = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id || req.body.user;

    // Fetch and update nomination with population
    const nomination = await Nomination.findByIdAndUpdate(
      id,
      { isVerified: true },
      { new: true, runValidators: false }
    ).populate("user", "name email");

    // Check if nomination was found
    if (!nomination) {
      return res.status(404).json({ message: "Nomination not found" });
    }

    return res.status(200).json({
      message: "Nomination verified",
      nomination,
      verifiedBy: nomination.user?.name || "Unknown",
    });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

//display user verified and rejeted
export const getMyNomination = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.body.user;

    const nomination = await Nomination.find({ user: userId }).select(
      "position isVerified isRejected rejectReason createdAt"
    );

    if (!nomination) {
      return res.status(404).json({ message: "No nomination found" });
    }

    return res.status(200).json(nomination);
  } catch (error) {
    console.error("Error fetching user's nomination:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

//reject nomination reason
export const rejectNomination = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const nomination = await Nomination.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          isRejected: true,
          rejectReason: reason || "Rejected by Admin",
        },
      },
      { new: true }
    );
    console.log("Reject reason:", nomination.rejectReason);
    if (!nomination) {
      return res.status(404).json({ message: "Nomination not found" });
    }
    console.log(nomination);

    return res.status(200).json({
      message: "Nomination rejected successfully",
      nomination,
    });
  } catch (error) {
    console.error("Rejection error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Delete nomination (Admin or owner)
export const deleteNomination = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const nomination = await Nomination.findById(id);
    if (!nomination) {
      return res.status(404).json({ message: "Nomination not found" });
    }

    // If admin, allow deletion without checking user
    if (req.user?.role === "admin") {
      await Nomination.findByIdAndDelete(id);
      return res
        .status(200)
        .json({ message: "Nomination deleted by admin successfully" });
    }

    // Check if nomination has a user field before comparing
    if (!nomination.user || !userId) {
      return res.status(403).json({ message: "Unauthorized to delete" });
    }

    if (nomination.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized to delete" });
    }

    await Nomination.findByIdAndDelete(id);
    return res.status(200).json({ message: "Nomination deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const voteNomination = async (req, res) => {
  try {
    const { nominationId } = req.body;

    const ip =
      req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    let clientIp = ip;

    if (ip === "::1" || ip === "127.0.0.1") {
      clientIp = "localhost (127.0.0.1 or ::1)";
    }

    const signature = req.body.signature || "Unknown";

    const userId = req.user?.id || req.user?._id || req.body.user;

    // NOTA handling
    if (req.body.nominationId === 0 || nominationId === "NOTA") {
      console.log("nota vote");

      return res.status(200).json({ message: "NOTA vote recorded" });
    }

    const nomination = await Nomination.findById(nominationId);
    if (!nomination) {
      return res.status(404).json({ message: "Nomination not found" });
    }

    // Check if user already voted for this nomination
    if (
      nomination.votes.some((v) => v.user?.toString() === userId?.toString())
    ) {
      return res.status(409).json({ message: "Already voted" });
    }

    nomination.votes.push({ ip, signature, user: userId });
    await nomination.save({ validateBeforeSave: false }); // 👈 Validation skip

    return res.status(200).json({ message: "Vote recorded", nomination });
  } catch (error) {
    console.error("Vote error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getResults = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id || req.body.user;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Find nomination by user ID only
    const nomination = await Nomination.findOne({
      "votes.user": userId,
    }).lean();

    if (!nomination || !Array.isArray(nomination.votes)) {
      return res.status(404).json({ message: "Vote not found" });
    }

    // Find the user's vote
    const vote = nomination.votes.find(
      (v) => v?.user?.toString() === userId?.toString()
    );

    if (!vote) {
      return res.status(404).json({ message: "Vote not found" });
    }

    const diffMs = Date.now() - new Date(vote.votedAt).getTime();
    const remainingMs = Math.max(0, 10 * 60 * 1000 - diffMs);

    if (remainingMs > 0) {
      return res.status(200).json({
        status: "thanks",
        message: "Thank you for voting",
        remainingMs,
      });
    }

    // Send results after 10 minutes or if no vote found
    const nominations = await Nomination.find({ isVerified: true })
      .populate("user", "name email")
      .populate("votes.user", "name email")
      .lean();

    const winners = {};
    const positions = [...new Set(nominations.map((n) => n.position))];

    positions.forEach((position) => {
      const candidates = nominations.filter((n) => n.position === position);
      if (candidates.length === 0) return;

      const sorted = candidates.sort(
        (a, b) => (b.votes?.length || 0) - (a.votes?.length || 0)
      );

      winners[position] = sorted[0];
    });

    return res.status(200).json({
      status: "results",
      winners,
    });
  } catch (error) {
    console.error("Result error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const UserNominations = async (req, res) => {
  const { id } = req.params;
  const nomination = await Nomination.findById(id).populate("user", "name");
  if (!nomination) return res.status(404).json({ message: "Not found" });
  res.json({ nomination });
};
