import express from "express";
import { isAuthenticated } from "../Middlewares/isAuthenticated.js";
import {
  createSubmissionRecord,
  getSolvedProblemsByUser,
  getSubmissionById,
  listUserSubmissions,
} from "../Controllers/SubmissionController.js";

const router = express.Router();

router.post("/create", isAuthenticated, createSubmissionRecord);
router.get("/user/list", isAuthenticated, listUserSubmissions);
router.get("/user/list/:contestId",isAuthenticated,getSolvedProblemsByUser);
router.get("/:id", isAuthenticated, getSubmissionById);
export default router;
