import express from "express"
const router = express.Router();
import { isAuthenticated } from "../Middlewares/isAuthenticated.js";
import { fetchProblem, scrapeProblems } from "../Controllers/ContestController/Contest.controller.js";
router.post("/fetch-problems", isAuthenticated, fetchProblem);
router.post("/scrape-problems", isAuthenticated, scrapeProblems);
export default router;