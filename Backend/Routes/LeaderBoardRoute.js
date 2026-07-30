import express from "express"
import { getLeaderBoard, getContestLeaderboardHandler } from "../Controllers/LeaderBoard/leaderBoard.controller.js";
const router = express.Router();
router.route("/leaderBoard").post(getLeaderBoard);
router.route("/contest/:contestId").get(getContestLeaderboardHandler);
export default router