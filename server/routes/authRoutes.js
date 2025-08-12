import express from "express";
import multer from "multer";
import {
  register,
  login,
  refreshToken,
  logout,
  getUserCount,
} from "../controllers/authController.js";
const upload = multer({ storage: multer.memoryStorage() });
import authenticate from "../middleware/authMiddleware.js";
import { requestOtp } from "../utils/otp.js";
import uploadData from "../controllers/adminData.js";
import { getPublishedPositions } from "../controllers/electionNotify.js";
import {
  getMyNomination,
  getResults,
  UserNominations,
} from "../controllers/nominationController.js";

// correct now

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/refresh", refreshToken);
router.post("/logout", authenticate(), logout); // ✅ works fine
router.post("/otp", requestOtp);
router.post("/upload-users", authenticate(), upload.single("file"), uploadData);
router.get("/published", authenticate(), getPublishedPositions);
router.get("/myNom", authenticate(), getMyNomination);
router.get("/count", authenticate(), getUserCount);
router.get("/result", authenticate(), getResults);
router.get("/:id", authenticate(), UserNominations);

export default router;
