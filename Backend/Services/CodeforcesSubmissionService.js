const CODEFORCES_API = "https://codeforces.com/api";

export const isFinalCodeforcesVerdict = (verdict) => {
  if (!verdict) return false;
  const pending = ["TESTING", "RUNNING", "QUEUED"];
  return !pending.includes(verdict.toUpperCase());
};

export const fetchSubmissionStatus = async ({
  cfContestId,
  cfHandle,
  cfSubmissionId,
  problemIndex,
  requestedAt,
}) => {
  if (!cfContestId || !cfHandle) {
    throw new Error("Missing contest id or Codeforces handle.");
  }

  const url = `${CODEFORCES_API}/contest.status?contestId=${encodeURIComponent(
    cfContestId
  )}&handle=${encodeURIComponent(cfHandle)}&from=1&count=20`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Codeforces API request failed: HTTP ${response.status}`);
  }

  const json = await response.json();
  if (json.status !== "OK") {
    throw new Error(`Codeforces API error: ${json.comment || json.status}`);
  }

  const targetSubmission = cfSubmissionId
    ? json.result.find((submission) => submission.id === cfSubmissionId)
    : json.result.find(
        (submission) =>
          submission.problem?.index === problemIndex &&
          (!requestedAt ||
            submission.creationTimeSeconds * 1000 >= requestedAt - 1000),
      );
  if (!targetSubmission) {
    return null;
  }

  return {
    cfSubmissionId: targetSubmission.id,
    cfContestId: targetSubmission.contestId,
    problemIndex: targetSubmission.problem.index,
    verdict: targetSubmission.verdict || "TESTING",
    timeConsumedMillis: targetSubmission.timeConsumedMillis || 0,
    memoryConsumedBytes: targetSubmission.memoryConsumedBytes || 0,
    passedTestCount: targetSubmission.passedTestCount || 0,
    creationTimeSeconds: targetSubmission.creationTimeSeconds || Math.floor(Date.now() / 1000),
  };
};
