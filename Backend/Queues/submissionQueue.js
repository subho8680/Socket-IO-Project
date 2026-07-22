import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import Submission from "../Models/SubmissionModel/submission.model.js";
import { emitToUser } from "../utils/socket.js";
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
      cfSubmissionId,
      problemIndex,
      requestedAt,
      pollCount = 0,
    } = job.data;

    const status = await fetchSubmissionStatus({
      cfContestId,
      cfHandle,
      cfSubmissionId,
      problemIndex,
      requestedAt,
    });

    // The Codeforces submission may not be visible yet. Keep this record in
    // TESTING and let the next delayed job check again.
    if (!status) {
      if (pollCount < 15) {
        await submissionQueue.add(
          "cf-poll",
          { ...job.data, pollCount: pollCount + 1 },
          { delay: 4000 },
        );
      }
      return { verdict: "TESTING" };
    }

    const updatePayload = {
      cfSubmissionId: status.cfSubmissionId,
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
    }

    if (!isFinalCodeforcesVerdict(status.verdict) && pollCount < 15) {
      await submissionQueue.add(
        "cf-poll",
        {
          ...job.data,
          submissionId,
          cfSubmissionId: status.cfSubmissionId,
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
  }
});

worker.on("error", (err) => {
  console.error("Submission queue worker error:", err);
});
