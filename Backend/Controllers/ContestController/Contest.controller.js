import { fetchProblems } from "../../Services/ProblemFetcher.js";
import { scrapeAllProblems } from "../../Services/TestCaseScrapper.js";
import contestModel from "../../Models/ContestModel/contest.model.js";
import { studentModel } from "../../Models/User/Student.model.js";
export const fetchProblem = async (req, res) => {
  const { minR, maxR, count, tags } = req.body;
  console.log("request came");
  try {
    const problems = await fetchProblems({
      minRating: minR,
      maxRating: maxR,
      count,
      tags,
    });
    return res.status(200).json({ status: "success", problems });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
};

export const scrapeProblems = async (req, res) => {
  const { name, durationMinutes, problems, invitedEmails, scheduledAt } =
    req.body;
  const user = req.id;
  const userDetails = await studentModel.findById(user);
  const email = userDetails.email;
  invitedEmails.push(email);
  console.log("SCRAPE API HIT");
  console.log(req.body);

  if (!problems?.length) {
    return res.status(400).json({
      error: "No problems provided.",
    });
  }

  try {
    console.log("Starting scraping...");

    const { results, errors } = await scrapeAllProblems(problems, 3);

    console.log("Scraping finished");

    const enrichedProblems = problems.map((p, i) => ({
      ...p,
      testCases: results[i]?.testCases ?? [],
      timeLimitMs: results[i]?.meta?.timeLimitMs ?? 2000,
      memLimitMb: results[i]?.meta?.memLimitMb ?? 256,
      scraped: results[i]?.success ?? false,
      statement: {
        body: cleanStatement(results[i]?.statement?.body),
        inputSpec: cleanStatement(results[i]?.statement?.inputSpec),
        outputSpec: cleanStatement(results[i]?.statement?.outputSpec),
        note: cleanStatement(results[i]?.statement?.note),
      },
    }));

    const contestId = `contest_${Date.now()}`;

    const contest = {
      contestId: contestId,
      name: name ?? "Untitled Contest",
      durationMinutes: durationMinutes ?? 120,
      problems: enrichedProblems,
      createdAt: Date.now(),
      startedAt: null,
      status: "scheduled",
      invitedEmails: invitedEmails ?? [],
      scheduledAt: scheduledAt ?? null,
    };

    const newContest = await contestModel.create(contest);
    console.log("Contest created successfully");
    return res.status(200).json({
      success: true,
      message: "Contest created successfully",
      contest: newContest,
      errors,
    });
  } catch (err) {
    console.error("SCRAPING ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
function cleanStatement(text) {
  if (!text) return "";

  return text
    .replace(/\$\$\$/g, "")
    .replace(/\$\$/g, "")
    .replace(/\$/g, "")

    .replace(/\\le/g, "≤")
    .replace(/\\ge/g, "≥")
    .replace(/\\neq/g, "≠")
    .replace(/\\dots/g, "...")
    .replace(/\\times/g, "×")
    .replace(/\\cdot/g, "·")
    .replace(/\\to/g, "→")
    .replace(/\\rightarrow/g, "→")

    .replace(/_/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const getContests = async (req, res) => {
  try {
    const id = req.id;
    const user = await studentModel.findById(id);
    const email = user.email;
    const contests = await contestModel
      .find({ invitedEmails: email })
      .sort({ createdAt: -1 });
    return res.status(200).json({
      status: "success",
      contests,
    });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message });
  }
};
export const getContestById = async (req, res) => {
  try {
    const id = req.params.id;
    const contest = await contestModel.findById(id);
    if(contest.scheduledAt > new Date()){
      return res.status(500).json("Contest is not started yet")
    }
    return res.status(200).json({
      status: "success",
      contest,
    });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message });
  }
};
