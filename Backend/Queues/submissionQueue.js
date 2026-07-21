import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import Submission from "../Models/SubmissionModel/submission.model.js";
import { fetchSubmissionStatus, isFinalCodeforcesVerdict } from "../Services/CodeforcesSubmissionService.js";

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
    const {cfHandle, cfContestId, pollCount = 0 } = job.data;

    const status = await fetchSubmissionStatus({ cfContestId, cfHandle });
    const updatePayload = {
      verdict: status.verdict,
      timeConsumedMillis: status.timeConsumedMillis,
      memoryConsumedBytes: status.memoryConsumedBytes,
      passedTestCount: status.passedTestCount,
      submittedAt: new Date(status.creationTimeSeconds * 1000),
    };

    await Submission.findByIdAndUpdate(submissionId, updatePayload, { new: true });

    if (!isFinalCodeforcesVerdict(status.verdict) && pollCount < 15) {
      await submissionQueue.add(
        "cf-poll",
        { submissionId, cfHandle, cfContestId, pollCount: pollCount + 1 },
        { delay: 4000 }
      );
    }

    return updatePayload;
  },
  { connection }
);

worker.on("failed", async (job, err) => {
  if (!job?.data?.submissionId) return;
  await Submission.findByIdAndUpdate(job.data.submissionId, {
    verdict: "ERROR",
    comment: err.message,
  });
});

worker.on("error", (err) => {
  console.error("Submission queue worker error:", err);
});
