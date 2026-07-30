import { quizPerfModel } from "../../Models/QuizPerformance/quizPerformance.js";
import contestModel from "../../Models/ContestModel/contest.model.js";
import Submission from "../../Models/SubmissionModel/submission.model.js";
import { participantModel } from "../../Models/User/Participant.model.js";

export const getLeaderBoard = async (roomId) => {
  try {
    const users = await quizPerfModel
      .find({
        roomId: roomId,
      })
      .sort({ points: -1 })
      .populate("createdBy");
    return users;
  } catch (e) {
    console.log(e);
  }
};

export const calculateContestLeaderboard = async (contestId) => {
  try {
    const contest = await contestModel.findOne({
      $or: [{ _id: contestId }, { contestId }],
    });
    if (!contest) return [];

    const invitedEmails = contest.invitedEmails || [];
    const participants = await participantModel.find({
      email: { $in: invitedEmails },
    });

    const submissions = await Submission.find({ contest: contest._id })
      .populate("user")
      .sort({ createdAt: 1 });

    const boardMap = new Map();

    for (const p of participants) {
      boardMap.set(p._id.toString(), {
        h: p.CF_Handle || p.name,
        f: p.name,
        s: 0,
        p: 0,
        ac: {},
        submissionsMap: new Map(),
      });
    }

    for (const sub of submissions) {
      if (!sub.user) continue;
      const userIdStr = sub.user._id.toString();
      if (!boardMap.has(userIdStr)) {
        boardMap.set(userIdStr, {
          h: sub.user.CF_Handle || sub.user.name,
          f: sub.user.name,
          s: 0,
          p: 0,
          ac: {},
          submissionsMap: new Map(),
        });
      }

      const userRow = boardMap.get(userIdStr);
      const probIdx = sub.problemIndex;
      if (!userRow.submissionsMap.has(probIdx)) {
        userRow.submissionsMap.set(probIdx, []);
      }
      userRow.submissionsMap.get(probIdx).push(sub);
    }

    const contestStart =
      contest.startedAt ||
      (contest.scheduledAt
        ? new Date(contest.scheduledAt).getTime()
        : contest.createdAt);

    for (const [userIdStr, userRow] of boardMap.entries()) {
      for (const [probIdx, probSubs] of userRow.submissionsMap.entries()) {
        probSubs.sort((a, b) => a.createdAt - b.createdAt);

        let isSolved = false;
        let wrongCount = 0;
        let solvedTimeMinutes = 0;

        for (const sub of probSubs) {
          if (sub.verdict === "OK" || sub.verdict === "Accepted") {
            isSolved = true;
            const subTime = new Date(
              sub.createdAt || sub.submittedAt,
            ).getTime();
            solvedTimeMinutes = Math.max(
              0,
              Math.floor((subTime - contestStart) / 60000),
            );
            break;
          } else if (sub.verdict !== "TESTING" && sub.verdict !== "Pending") {
            wrongCount++;
          }
        }

        if (isSolved) {
          userRow.s += 1;
          const problemPenalty = solvedTimeMinutes + wrongCount * 20;
          userRow.p += problemPenalty;
          userRow.ac[probIdx] = solvedTimeMinutes;
        }
      }
      delete userRow.submissionsMap;
    }

    const leaderboard = Array.from(boardMap.values());
    leaderboard.sort((a, b) => {
      if (b.s !== a.s) {
        return b.s - a.s;
      }
      return a.p - b.p;
    });

    return leaderboard;
  } catch (err) {
    console.error("Error in calculateContestLeaderboard:", err);
    return [];
  }
};

export const getContestLeaderboardHandler = async (req, res) => {
  try {
    const { contestId } = req.params;
    const leaderboard = await calculateContestLeaderboard(contestId);
    return res.status(200).json({ success: true, leaderboard });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
