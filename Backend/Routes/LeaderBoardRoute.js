import express from "express"
import { getLeaderBoard } from "../Controllers/LeaderBoard/leaderBoard.controller.js";
const router = express.Router();
router.route("/leaderBoard").post(getLeaderBoard);
export default router