const JUDGE0_URL = process.env.JUDGE0_URL || "https://judge0-ce.p.rapidapi.com";
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || "";

const LANGUAGE_IDS = {
  cpp17: 54,
  cpp14: 52,
  python3: 71,
  python2: 70,
  java: 62,
  javascript: 63,
  c: 50,
  go: 60,
  csharp: 51,
  kotlin: 78,
};

const VERDICT_MAP = {
  1: { label: "In Queue", status: "pending" },
  2: { label: "Processing", status: "pending" },
  3: { label: "Accepted", status: "accepted" },
  4: { label: "Wrong Answer", status: "wrong" },
  5: { label: "Time Limit Exceeded", status: "tle" },
  6: { label: "Compilation Error", status: "ce" },
  7: { label: "Runtime Error (SIGSEGV)", status: "re" },
  8: { label: "Runtime Error (SIGBUS)", status: "re" },
  9: { label: "Runtime Error (SIGFPE)", status: "re" },
  10: { label: "Runtime Error (SIGABRT)", status: "re" },
  11: { label: "Runtime Error (NZEC)", status: "re" },
  12: { label: "Runtime Error (Other)", status: "re" },
  13: { label: "Internal Error", status: "error" },
  14: { label: "Exec Format Error", status: "error" },
};

const J0_HEADERS = {
  "Content-Type": "application/json",
  "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
  "X-RapidAPI-Key": JUDGE0_API_KEY,
};

async function runSingleTest({
  code,
  language,
  input,
  expectedOutput,
  timeLimitMs = 2000,
  memLimitMb = 256,
}) {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) throw new Error(`Unsupported language: ${language}`);

  const submitRes = await fetch(
    `${JUDGE0_URL}/submissions?base64_encoded=true&wait=false`,
    {
      method: "POST",
      headers: J0_HEADERS,
      body: JSON.stringify({
        source_code: btoa(code),
        language_id: languageId,
        stdin: btoa(input),
        expected_output: btoa(expectedOutput),
        cpu_time_limit: timeLimitMs / 1000,
        memory_limit: memLimitMb * 1024,
        wall_time_limit: (timeLimitMs / 1000) * 2,
      }),
    },
  );

  if (!submitRes.ok) {
    throw new Error(`Judge0 submit failed: HTTP ${submitRes.status}`);
  }

  const { token } = await submitRes.json();

  return await pollResult(token);
}
async function runAllTests({
  code,
  language,
  testCases,
  timeLimitMs = 2000,
  memLimitMb = 256,
}) {
  const results = await Promise.all(
    testCases.map((tc, i) =>
      runSingleTest({
        code,
        language,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        timeLimitMs,
        memLimitMb,
      })
        .then((result) => ({ testIndex: i + 1, ...result }))
        .catch((err) => ({
          testIndex: i + 1,
          status: "error",
          label: "Internal Error",
          error: err.message,
          stdout: null,
          stderr: null,
          time: null,
          memory: null,
        })),
    ),
  );

  const failedTest = results.find((r) => r.status !== "accepted");
  const overall = failedTest ?? { status: "accepted", label: "Accepted" };

  return {
    overall: overall.status,
    label: overall.label,
    tests: results,
    passedCount: results.filter((r) => r.status === "accepted").length,
    totalCount: results.length,
  };
}

async function pollResult(token, maxAttempts = 20, intervalMs = 1000) {
  for (let i = 0; i < maxAttempts; i++) {
    await sleep(intervalMs);

    const res = await fetch(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=true&fields=status,stdout,stderr,time,memory,compile_output`,
      { headers: J0_HEADERS },
    );

    if (!res.ok) continue;

    const data = await res.json();
    const statusId = data.status?.id;

    if (statusId === 1 || statusId === 2) continue;

    const decode = (val) => (val ? atob(val).trim() : null);

    const verdict = VERDICT_MAP[statusId] ?? {
      label: "Unknown",
      status: "error",
    };

    return {
      status: verdict.status,
      label: verdict.label,
      stdout: decode(data.stdout),
      stderr: decode(data.stderr),
      compileOutput: decode(data.compile_output),
      time: data.time ? `${data.time}s` : null,
      memory: data.memory ? `${(data.memory / 1024).toFixed(1)} MB` : null,
    };
  }

  throw new Error("Judge0 polling timed out");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

if (typeof btoa === "undefined") {
  global.btoa = (str) => Buffer.from(str).toString("base64");
  global.atob = (str) => Buffer.from(str, "base64").toString("utf8");
}

export { runSingleTest, runAllTests, LANGUAGE_IDS };
