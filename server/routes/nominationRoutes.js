import express from "express";
import {
  createNomination,
  getAllNominations,
  getUserNominations,
  deleteNomination,
  verifyNomination,
  rejectNomination,
  getMyNomination,
  voteNomination,
  getResults,
} from "../controllers/nominationController.js";

import authenticate from "../middleware/authMiddleware.js";
import { publishPosition } from "../controllers/electionNotify.js";
import { getUserCount } from "../controllers/authController.js";

const router = express.Router();

// ✅ Only logged-in users can create nominations
router.post(
  "/create",
  authenticate(["employee", "admin", "super"]),
  createNomination
);

// ✅ Admin can see all nominations
router.get(
  "/getAll",
  authenticate(["admin", "employee", "super"]),
  getAllNominations
);

// ✅ Admin and related user can get a specific nomination
router.get(
  "/:id",
  authenticate(["employee", "admin", "super"]),
  getUserNominations
);

// ✅ Only admin can delete nominations
router.delete("/:id", authenticate(["admin", "super"]), deleteNomination);
router.post("/publish", authenticate(["admin", "super"]), publishPosition);
router.put("/verify/:id", authenticate(["admin", "super"]), verifyNomination);
router.put("/reject/:id", authenticate(["admin", "super"]), rejectNomination);

// ✅ Cast vote for a nomination (employee only)
router.post(
  "/vote",
  authenticate(["employee", "admin", "super"]),
  voteNomination
);

// ✅ Get election results (admin and employee)
router.get(
  "/results",
  authenticate(["admin", "employee", "super"]),
  getResults
);
router.get(
  "/count",
  authenticate(["admin", "employee", "super"]),
  getUserCount
);

export default router;
