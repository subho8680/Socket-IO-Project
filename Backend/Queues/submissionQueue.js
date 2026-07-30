import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import Submission from "../Models/SubmissionModel/submission.model.js";
import { emitToUser, emitToRoom } from "../utils/socket.js";
import { calculateContestLeaderboard } from "../Controllers/LeaderBoard/leaderBoard.controller.js";
import {
  fetchSubmissionStatus,
  isFinalCodeforcesVerdict,
} from "../Services/CodeforcesSubmissionService.js";

const connection = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

export const submissionQueue = new Queue("cf-submission-status", {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: true,
  },
});

const worker = new Worker(
  "cf-submission-status",
  async (job) => {
    const {
      submissionId,
      cfHandle,
      cfContestId,
      problemIndex,
      requestedAt,
      pollCount = 0,
    } = job.data;

    const status = await fetchSubmissionStatus({
      cfContestId,
      cfHandle,
      problemIndex,
      requestedAt,
    });

    if (!status) {
      if (pollCount < 15) {
        await submissionQueue.add(
          "cf-poll",
          {
            submissionId,
            cfHandle,
            cfContestId,
            problemIndex,
            requestedAt,
            pollCount: pollCount + 1,
          },
          { delay: 4000 },
        );
      }
      return { verdict: "TESTING" };
    }

    const updatePayload = {
      verdict: status.verdict,
      timeConsumedMillis: status.timeConsumedMillis,
      memoryConsumedBytes: status.memoryConsumedBytes,
      passedTestCount: status.passedTestCount,
      submittedAt: new Date(status.creationTimeSeconds * 1000),
    };

    const submission = await Submission.findByIdAndUpdate(submissionId, updatePayload, {
      new: true,
    });

    if (submission) {
      emitToUser(submission.user, "submission-status-updated", {
        submissionId: submission._id.toString(),
        problemIndex: submission.problemIndex,
        verdict: submission.verdict,
        timeConsumedMillis: submission.timeConsumedMillis,
        memoryConsumedBytes: submission.memoryConsumedBytes,
        passedTestCount: submission.passedTestCount,
      });
      try {
        const contest = await Submission.findById(submissionId).populate("contest");
        if (contest && contest.contest) {
          const leaderboard = await calculateContestLeaderboard(contest.contest._id.toString());
          emitToRoom(contest.contest._id.toString(), "leaderboard-updated", { leaderboard });
        }
      } catch (err) {
        console.error("Error emitting leaderboard update from queue:", err);
      }
    }

    if (!isFinalCodeforcesVerdict(status.verdict) && pollCount < 15) {
      await submissionQueue.add(
        "cf-poll",
        {
          submissionId,
          cfHandle,
          cfContestId,
          problemIndex,
          requestedAt,
          pollCount: pollCount + 1,
        },
        { delay: 4000 },
      );
    }

    return updatePayload;
  },
  { connection },
);

worker.on("failed", async (job, err) => {
  if (!job?.data?.submissionId) return;
  const submission = await Submission.findByIdAndUpdate(job.data.submissionId, {
    verdict: "ERROR",
    comment: err.message,
  }, {
    new: true,
  });
  if (submission) {
    emitToUser(submission.user, "submission-status-updated", {
      submissionId: submission._id.toString(),
      problemIndex: submission.problemIndex,
      verdict: submission.verdict,
      timeConsumedMillis: submission.timeConsumedMillis,
      memoryConsumedBytes: submission.memoryConsumedBytes,
      passedTestCount: submission.passedTestCount,
    });
    try {
      const contest = await Submission.findById(job.data.submissionId).populate("contest");
      if (contest && contest.contest) {
        const leaderboard = await calculateContestLeaderboard(contest.contest._id.toString());
        emitToRoom(contest.contest._id.toString(), "leaderboard-updated", { leaderboard });
      }
    } catch (err) {
      console.error("Error emitting leaderboard update on failed worker:", err);
    }
  }
});

worker.on("error", (err) => {
  console.error("Submission queue worker error:", err);
});
