const CODEBOX_URL = (process.env.CODEBOX_URL || "http://localhost:3000").replace(/\/$/, "");

const LANGUAGE_IDS = {
  "c++": 54,
  cpp: 54,
  cpp17: 54,
  cpp14: 52,
  c: 50,
  python: 71,
  python3: 71,
  python2: 70,
  java: 62,
  javascript: 63,
  js: 63,
  go: 60,
  csharp: 51,
  kotlin: 78,
};

const VERDICT_MAP = {
  1: { label: "In Queue", status: "pending", description: "In Queue" },
  2: { label: "Processing", status: "pending", description: "Processing" },
  3: { label: "Accepted", status: "accepted", description: "Accepted" },
  4: { label: "Wrong Answer", status: "wrong", description: "Wrong Answer" },
  5: { label: "Time Limit Exceeded", status: "tle", description: "Time Limit Exceeded" },
  6: { label: "Compilation Error", status: "ce", description: "Compilation Error" },
  7: { label: "Runtime Error", status: "re", description: "Runtime Error" },
  8: { label: "Runtime Error", status: "re", description: "Runtime Error" },
  9: { label: "Runtime Error", status: "re", description: "Runtime Error" },
  10: { label: "Runtime Error", status: "re", description: "Runtime Error" },
  11: { label: "Runtime Error", status: "re", description: "Runtime Error" },
  12: { label: "Runtime Error", status: "re", description: "Runtime Error" },
  13: { label: "Internal Error", status: "error", description: "Internal Error" },
};

function normalizeLanguage(language) {
  return String(language ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function getLanguageId(language) {
  const normalized = normalizeLanguage(language);
  return LANGUAGE_IDS[normalized] ?? null;
}

function mapCodeboxStatus(statusId, description) {
  const mapped = VERDICT_MAP[Number(statusId)];
  if (mapped) return { ...mapped, description: description ?? mapped.description };

  return {
    label: description || "Unknown",
    status: "error",
    description: description || "Unknown",
  };
}

function buildSubmissionPayload({ code, languageId, input, expectedOutput }) {
  const payload = {
    source_code: String(code ?? ""),
    language_id: languageId,
    stdin: String(input ?? ""),
  };

  if (expectedOutput !== undefined && expectedOutput !== null) {
    payload.expected_output = String(expectedOutput);
  }

  return payload;
}

async function executeCodebox({ code, language, input = "", expectedOutput = null }) {
  const languageId = getLanguageId(language);
  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const response = await fetch(`${CODEBOX_URL}/submissions?wait=true`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": process.env.CODEBOX_AUTH_TOKEN || "dev-token",
    },
    body: JSON.stringify(
      buildSubmissionPayload({
        code,
        languageId,
        input,
        expectedOutput,
      }),
    ),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Codebox execute failed: HTTP ${response.status} ${errText}`);
  }

  const json = await response.json();
  const verdict = mapCodeboxStatus(json?.status?.id, json?.status?.description);

  return {
    status: verdict.status,
    label: verdict.label,
    description: verdict.description,
    stdout: json?.stdout ?? null,
    stderr: json?.stderr ?? null,
    compileOutput: json?.compile_output ?? null,
    message: json?.message ?? null,
    time: json?.time ?? json?.wall_time ?? null,
    memory: json?.memory ?? null,
    exitCode: json?.exit_code ?? null,
    exitSignal: json?.exit_signal ?? null,
    token: json?.token ?? null,
    rawStatusId: json?.status?.id ?? null,
    languageId,
  };
}

export {
  executeCodebox,
  LANGUAGE_IDS,
  buildSubmissionPayload,
  getLanguageId,
  mapCodeboxStatus,
};
