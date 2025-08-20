import Nomination from "../models/Nomination.js";

export const publishPosition = async (req, res) => {
  try {
    const { title, message, eligibility, isElectionCompleted } = req.body; // isCompleted optional
    const userId = req.userId;

    if (!title || !message) {
      return res
        .status(400)
        .json({ message: "Title and message are required" });
    }

    const validPositions = [
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

    if (!validPositions.includes(title)) {
      return res.status(400).json({ message: "Invalid position title" });
    }

    const announcementDoc = await Nomination.create({
      user: userId,
      isVerified: true, // Admin verified by default
      announcement: { title, message, eligibility },
      description: `${title}`,
      isCompleted: isElectionCompleted || false, // default false
    });

    res.status(201).json({
      message: "Position announcement published successfully",
      announcement: announcementDoc.announcement,
      isCompleted: announcementDoc.isElectionCompleted, // ye bhi return kar do
    });
  } catch (err) {
    console.error("Error saving announcement:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getPublishedPositions = async (req, res) => {
  try {
    // Only get docs where announcement field exists
    const announcements = await Nomination.find(
      { announcement: { $exists: true, $ne: {} } },
      { announcement: 1, _id: 1, createdAt: 1, isElectionCompleted: 1 } // include isCompleted
    ).sort({ createdAt: -1 });

    res.status(200).json(announcements);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({ message: "Server error" });
  }
};
