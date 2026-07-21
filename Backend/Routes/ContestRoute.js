import express from "express"
const router = express.Router();
import { isAuthenticated } from "../Middlewares/isAuthenticated.js";
import {
  fetchProblem,
  getContests,
  scrapeProblems,
  executeCode,
} from "../Controllers/ContestController/Contest.controller.js";
router.post("/fetch-problems", isAuthenticated, fetchProblem);
router.post("/scrape-problems", isAuthenticated, scrapeProblems);
router.post("/execute", isAuthenticated, executeCode);
router.get("/getAll", isAuthenticated, getContests);
router.get("/getContest/:id", isAuthenticated, getContests);
export default router;