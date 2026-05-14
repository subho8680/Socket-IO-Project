import Submission from "../Models/SubmissionModel/submission.model.js";
import contestModel from "../Models/ContestModel/contest.model.js";
import { studentModel } from "../Models/User/Student.model.js";
import { submissionQueue } from "../Queues/submissionQueue.js";

export const createSubmissionRecord = async (req, res) => {
  try {
    const { contestId, cfContestId, problemIndex, language, cfSubmissionId } = req.body;
    const userId = req.id;

    if (!cfContestId || !cfSubmissionId || !problemIndex || !language) {
      return res.status(400).json({ success: false, message: "Missing required submission fields." });
    }

    const user = await studentModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Authenticated student not found." });
    }

    if (!user.CF_Handle) {
      return res.status(400).json({ success: false, message: "Student must link a Codeforces handle before submission polling can start." });
    }

    const contest = await contestModel.findOne({
      $or: [{ _id: contestId }, { contestId }],
    });
    if (!contest) {
      return res.status(404).json({ success: false, message: "Contest not found." });
    }

    const submission = await Submission.create({
      user: user._id,
      contest: contest._id,
      cfSubmissionId,
      cfContestId,
      problemIndex,
      language,
      verdict: "TESTING",
    });

    await submissionQueue.add(
      "cf-poll",
      {
        submissionId: submission._id.toString(),
        cfHandle: user.CF_Handle,
        cfContestId,
        cfSubmissionId,
        problemIndex,
        language,
        pollCount: 0,
      },
      { delay: 4000 }
    );

    return res.status(201).json({
      success: true,
      submission,
      cfSubmissionUrl: `https://codeforces.com/contest/${cfContestId}/submit`,
      viewSubmissionUrl: `https://codeforces.com/contest/${cfContestId}/submission/${cfSubmissionId}`,
    });
  } catch (err) {
    console.error("createSubmissionRecord error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const autoTrackSubmission = async (req, res) => {
  try {
    const { cfContestId, problemIndex, language } = req.body;
    const userId = req.id;

    if (!cfContestId || !problemIndex || !language) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: cfContestId, problemIndex, language",
      });
    }

    const user = await studentModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Authenticated student not found.",
      });
    }

    if (!user.CF_Handle) {
      return res.status(400).json({
        success: false,
        message: "Please link your Codeforces handle first.",
      });
    }

    const contest = await contestModel.findOne({
      contestId: cfContestId,
    });
    if (!contest) {
      return res.status(404).json({
        success: false,
        message: "Contest not found in database.",
      });
    }

    const cfApiUrl = `https://codeforces.com/api/contest.status?contestId=${cfContestId}&handle=${user.CF_Handle}&from=1&count=50`;
    
    console.log(`Fetching submissions for ${user.CF_Handle} in contest ${cfContestId}`);
    
    const response = await fetch(cfApiUrl);
    if (!response.ok) {
      throw new Error(`Codeforces API error: HTTP ${response.status}`);
    }

    const json = await response.json();
    if (json.status !== "OK") {
      throw new Error(`Codeforces API error: ${json.comment}`);
    }

    if (!json.result || json.result.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No submissions found. Please submit on Codeforces first.",
      });
    }
    let targetSubmission = null;
    
    for (const submission of json.result) {
      if (submission.problem?.index === problemIndex) {
        const existingRecord = await Submission.findOne({
          cfSubmissionId: submission.id,
        });
        
        if (!existingRecord) {
          targetSubmission = submission;
          break; 
        }
      }
    }

    if (!targetSubmission) {
      return res.status(404).json({
        success: false,
        message: `No new submissions found for problem ${problemIndex}. Either already being tracked or not submitted yet.`,
      });
    }

    const submission = await Submission.create({
      user: user._id,
      contest: contest._id,
      cfSubmissionId: targetSubmission.id,
      cfContestId: cfContestId,
      problemIndex: problemIndex,
      language: targetSubmission.programmingLanguage || language,
      verdict: targetSubmission.verdict || "TESTING",
    });

    console.log(
      `Auto-tracked submission ${targetSubmission.id} for ${user.CF_Handle} on problem ${problemIndex}`
    );

    const isFinal =
      targetSubmission.verdict &&
      !["TESTING", "RUNNING", "QUEUED"].includes(targetSubmission.verdict.toUpperCase());

    if (!isFinal) {
      await submissionQueue.add(
        "cf-poll",
        {
          submissionId: submission._id.toString(),
          cfHandle: user.CF_Handle,
          cfContestId: cfContestId,
          cfSubmissionId: targetSubmission.id,
          problemIndex: problemIndex,
          pollCount: 0,
        },
        { delay: 2000 }
      );
    } else {
      await Submission.findByIdAndUpdate(submission._id, {
        verdict: targetSubmission.verdict,
        timeConsumedMillis: targetSubmission.timeConsumedMillis,
        memoryConsumedBytes: targetSubmission.memoryConsumedBytes,
        passedTestCount: targetSubmission.passedTestCount,
        submittedAt: new Date(targetSubmission.creationTimeSeconds * 1000),
      });
    }

    return res.status(201).json({
      success: true,
      message: "Submission auto-tracked successfully",
      submission,
      viewSubmissionUrl: `https://codeforces.com/contest/${cfContestId}/submission/${targetSubmission.id}`,
    });
  } catch (err) {
    console.error("autoTrackSubmission error:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    const submission = await Submission.findById(id).populate("user", "name email CF_Handle");
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found." });
    }

    return res.status(200).json({ success: true, submission });
  } catch (err) {
    console.error("getSubmissionById error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const listUserSubmissions = async (req, res) => {
  try {
    const userId = req.id;
    const submissions = await Submission.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("contest", "name contestId");

    return res.status(200).json({ success: true, submissions });
  } catch (err) {
    console.error("listUserSubmissions error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
