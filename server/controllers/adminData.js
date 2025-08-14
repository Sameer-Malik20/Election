import multer from "multer";
import XLSX from "xlsx";
import User from "../models/User.js";

const upload = multer({ storage: multer.memoryStorage() });

const uploadData = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const usersData = XLSX.utils.sheet_to_json(sheet);

    let inserted = 0,
      skipped = 0;

    const alreadyUsers = [];
    for (const u of usersData) {
      try {
        await User.create({
          name: String(u.name),
          email: String(u.email).toLowerCase(),
          phone: String(u.phone),
          address: String(u.address),
          password: String(u.password),
          role: "employee",
          uploadedBy: req.userId,
        });

        inserted++;
      } catch (err) {
        skipped++;
        if (err.code === 11000) {
          alreadyUsers.push({
            email: u.email,
            name: u.name,
            status: "Already Exists",
          });
          console.log(`Already User → ${u.email}`);
        } else {
          // Other validation errors
          failedUsers.push({
            email: u.email,
            name: u.name,
            error: err.message,
          });
          console.log(`Skipped ${u.email} → ${err.message}`);
        }
      }
    }

    res.json({
      message: "Users uploaded successfully",
      inserted,
      skipped,
      alreadyUsers,
      total: usersData.length,
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Failed to upload users" });
  }
};

export default uploadData;
