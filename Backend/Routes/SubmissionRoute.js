import express from "express";
import { isAuthenticated } from "../Middlewares/isAuthenticated.js";
import {
  createSubmissionRecord,
  autoTrackSubmission,
  getSubmissionById,
  listUserSubmissions,
} from "../Controllers/SubmissionController.js";

const router = express.Router();

router.post("/create", isAuthenticated, createSubmissionRecord);
router.post("/auto-track", isAuthenticated, autoTrackSubmission);
router.get("/user/list", isAuthenticated, listUserSubmissions);
router.get("/:id", isAuthenticated, getSubmissionById);

export default router;
