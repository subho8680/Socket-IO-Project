import React, { useState, useRef, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import {
  ConfigProvider,
  theme as antdTheme,
  Button,
  Select,
  Checkbox,
  Tabs,
  Table,
  Segmented,
  Card,
  Tag,
  Alert,
  Modal,
  Avatar,
  Collapse,
  Empty,
  Skeleton,
  Spin,
  Result,
  Typography,
  Badge,
} from "antd";
import {
  CloseOutlined,
  BulbOutlined,
  BulbFilled,
  ClockCircleOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  SendOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  WarningOutlined,
  ThunderboltOutlined,
  LinkOutlined,
  StarFilled,
  FileTextOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  createSubmission,
  executeCode,
  useGetContestById,
  useGetSolvedProblems,
  useUserSubmissions,
} from "../../../Services/ContestAPI";
import { useNavigate, useParams } from "react-router-dom";
import { formatProblemStatement } from "../../../data/NormalizeStatement";
import { useSocket } from "../../../Services/Usesocket";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../context/AuthContext";

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
  "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap";
if (!document.head.querySelector('[href*="Geist"]'))
  document.head.appendChild(fontLink);

const T = {
  dark: {
    bg: "#1a1a1a",
    bgSub: "#262626",
    bgHover: "#2e2e2e",
    bgActive: "#333",
    surface: "#1f1f1f",
    surfaceRaised: "#282828",
    border: "#3a3a3a",
    borderFaint: "#2e2e2e",
    text: "#f4f6fb",
    textSub: "#c8cfde",
    textMuted: "#8e97a8",
    accent: "#ffa116",
    accentBg: "#ffa11618",
    accentHover: "#ffb84d",
    green: "#2cbb5d",
    greenBg: "#2cbb5d18",
    red: "#ef4743",
    redBg: "#ef474318",
    blue: "#4d9cf8",
    blueBg: "#4d9cf818",
    yellow: "#f0a119",
    yellowBg: "#f0a11918",
    purple: "#a78bfa",
    purpleBg: "#a78bfa18",
    monacoTheme: "vs-dark",
    scrollbar: "#3a3a3a",
    tagBg: "#2e2e2e",
    tagText: "#d8dfe9",
    codeBg: "#1a1a1a",
  },
  light: {
    bg: "#f5f7fb",
    bgSub: "#ffffff",
    bgHover: "#eef2f7",
    bgActive: "#e5ebf3",
    surface: "#ffffff",
    surfaceRaised: "#ffffff",
    border: "#d7dde8",
    borderFaint: "#e8edf4",
    text: "#0f172a",
    textSub: "#1f2937",
    textMuted: "#4b5563",
    accent: "#ffa116",
    accentBg: "#fff7e6",
    accentHover: "#ff8c00",
    green: "#00b862",
    greenBg: "#e9f9ef",
    red: "#de2222",
    redBg: "#fdecea",
    blue: "#1c7ee0",
    blueBg: "#e7f2ff",
    yellow: "#c07800",
    yellowBg: "#fef9e7",
    purple: "#7c3aed",
    purpleBg: "#f3f0ff",
    monacoTheme: "vs",
    scrollbar: "#d4d4d4",
    tagBg: "#eef2f7",
    tagText: "#334155",
    codeBg: "#f7f8fa",
  },
};

const LANGS = [
  {
    id: "cpp17",
    label: "C++ 17",
    monaco: "cpp",
    tmpl: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    \n    return 0;\n}`,
  },
  {
    id: "python3",
    label: "Python 3",
    monaco: "python",
    tmpl: `import sys\ninput = sys.stdin.readline\n\ndef solve():\n    pass\n\nsolve()`,
  },
  {
    id: "java",
    label: "Java",
    monaco: "java",
    tmpl: `import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        \n    }\n}`,
  },
  {
    id: "js",
    label: "JavaScript",
    monaco: "javascript",
    tmpl: `process.stdin.resume();\nprocess.stdin.setEncoding('utf8');\nlet _in = '';\nprocess.stdin.on('data', d => _in += d);\nprocess.stdin.on('end', () => {\n    const lines = _in.split('\\n');\n    // solve\n});`,
  },
];
const EMPTY_SUBMISSIONS = [];

const getContestCodeStorageKey = (contestId, userKey) => {
  const normalizedUser = typeof userKey === "string" && userKey.trim()
    ? userKey.trim()
    : "contestant";
  return contestId ? `contestpad-codes-${normalizedUser}-${contestId}` : `contestpad-codes-${normalizedUser}`;
};

const readPersistedCodes = (contestId, userKey) => {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(getContestCodeStorageKey(contestId, userKey));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const persistCodes = (contestId, userKey, codes) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(getContestCodeStorageKey(contestId, userKey), JSON.stringify(codes));
  } catch {
    // ignore storage errors
  }
};

function normalizeContest(raw) {
  if (!raw) return null;
  const contestData = raw.contest || raw.contests?.[0] || raw;

  const scheduledAt = contestData.scheduledAt?.$date
    ? new Date(contestData.scheduledAt.$date)
    : contestData.scheduledAt
      ? new Date(contestData.scheduledAt)
      : null;

  let startedAt = null;
  if (contestData.startedAt) {
    startedAt =
      typeof contestData.startedAt === "string"
        ? new Date(contestData.startedAt).getTime()
        : contestData.startedAt;
  }

  const problems = Array.isArray(contestData?.problems)
    ? [...contestData.problems].sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0))
    : [];
  return {
    title: contestData.name ?? "Contest",
    durationMinutes: contestData.durationMinutes ?? 120,
    startedAt, // timestamp in ms
    scheduledAt, // Date object
    status: contestData.status ?? "scheduled",
    problems: problems.map((p, idx) => ({
      idx: String.fromCharCode(65 + idx),
      name: p.name ?? "Untitled",
      rating: p.rating ?? 0,
      tags: p.tags ?? [],
      contestId: p.contestId ?? null,
      index: p.index ?? null,
      tl: p.timeLimitMs != null ? `${Math.floor(p.timeLimitMs / 1000)}s` : "2s",
      ml: p.memLimitMb != null ? `${p.memLimitMb}MB` : "256MB",
      url: p.url ?? null,
      solvedCount: p.solvedCount ?? 0,
      body: p.statement?.body ?? "",
      inputFmt: p.statement?.inputSpec ?? "",
      outputFmt: p.statement?.outputSpec ?? "",
      note: p.statement?.note ?? "",
      cases: (p.testCases ?? []).map((tc) => ({
        i: tc.input ?? "",
        o: tc.expectedOutput ?? "",
      })),
    })),
  };
}

const BOARD = [
  { h: "tourist", f: "Belarus", s: 4, p: 187, ac: { A: 12, B: 28, C: 51, D: 187 } },
  { h: "ecnerwala", f: "United States", s: 3, p: 134, ac: { A: 8, B: 22, C: 134 } },
  { h: "Petr", f: "Czech Republic", s: 3, p: 156, ac: { A: 15, B: 41, C: 156 } },
  { h: "arjun_s", f: "India", s: 2, p: 74, ac: { A: 12, B: 74 } },
  { h: "suman_k", f: "India", s: 1, p: 18, ac: { A: 18 } },
  { h: "priya_m", f: "India", s: 1, p: 25, ac: { A: 25 } },
  { h: "rohan_v", f: "India", s: 0, p: 0, ac: {} },
];

const ratingStyle = (r, t) => {
  if (r <= 1000) return { bg: t.greenBg, text: t.green, label: "Easy" };
  if (r <= 1400) return { bg: t.blueBg, text: t.blue, label: "Medium" };
  if (r <= 1800) return { bg: t.yellowBg, text: t.yellow, label: "Hard" };
  if (r <= 2100) return { bg: t.redBg, text: t.red, label: "Expert" };
  return { bg: t.purpleBg, text: t.purple, label: "Master" };
};

const verdictInfo = (v, t) => {
  if (v === "TESTING" || v === "Pending")
    return { c: t.textMuted, bg: t.bgSub, short: "..." };
  if (v === "Accepted") return { c: t.green, bg: t.greenBg, short: "AC" };
  if (v === "Wrong Answer") return { c: t.red, bg: t.redBg, short: "WA" };
  if (v === "Time Limit Exceeded")
    return { c: t.yellow, bg: t.yellowBg, short: "TLE" };
  if (v === "Compilation Error") return { c: t.red, bg: t.redBg, short: "CE" };
  if (v === "Runtime Error") return { c: t.red, bg: t.redBg, short: "RE" };
  if (v === "Internal Error") return { c: t.red, bg: t.redBg, short: "IE" };
  return { c: t.textMuted, bg: t.bgSub, short: "···" };
};
const displayVerdict = (verdict) => {
  const labels = {
    OK: "Accepted",
    WRONG_ANSWER: "Wrong Answer",
    TIME_LIMIT_EXCEEDED: "Time Limit Exceeded",
    COMPILATION_ERROR: "Compilation Error",
    RUNTIME_ERROR: "Runtime Error",
  };
  return labels[verdict] || verdict || "TESTING";
};
const normalizeText = (text) => String(text ?? "").replace(/\r/g, "").trim();

const formatMs = (time) => {
  if (time === null || time === undefined || time === "") return "â€”";
  const ms = Math.round(Number(time) * 1000);
  return Number.isFinite(ms) ? `${ms}ms` : `${time}s`;
};

const formatMemory = (memory) => {
  if (memory === null || memory === undefined || memory === "") return "â€”";
  const numeric = Number(memory);
  if (!Number.isFinite(numeric)) return String(memory);
  return numeric > 1024 ? `${(numeric / 1024).toFixed(1)}MB` : `${numeric}KB`;
};

const resultText = (result) =>
  normalizeText(
    result?.stdout ??
    result?.compileOutput ??
    result?.stderr ??
    result?.message ??
    "",
  );

function LoadingSkeleton({ t, ff }) {
  return (
    <div style={{ padding: 32, fontFamily: ff }}>
      <Skeleton active title={{ width: "60%" }} paragraph={{ rows: 4 }} />
    </div>
  );
}

function ErrorState({ t, ff, message }) {
  return (
    <div style={{ fontFamily: ff }}>
      <Result
        status="error"
        icon={<ExclamationCircleOutlined style={{ color: t.red }} />}
        title={<span style={{ color: t.red, fontSize: 14 }}>{message ?? "Failed to load contest"}</span>}
      />
    </div>
  );
}

export default function Contest({
  contest: contestProp,
  onExit,
}) {
  const { user } = useAuth();
  const me = user?.CF_Handle || user?.name || "contestant";
  const [dark, setDark] = useState(true);
  const { contestId } = useParams();
  console.log("contestid is", contestId);
  const t = dark ? T.dark : T.light;
  const ff = `'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  const fm = `'Geist Mono', 'Fira Code', 'Cascadia Code', monospace`;
  const contestTheme = {
    algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: t.accent,
      colorBgBase: t.bg,
      colorBgContainer: t.surface,
      colorBgElevated: t.surfaceRaised,
      colorBorder: t.border,
      colorText: t.text,
      colorTextSecondary: t.textSub,
      colorTextTertiary: t.textMuted,
      colorTextQuaternary: t.textMuted,
      borderRadius: 8,
      fontFamily: ff,
    },
    components: {
      Button: {
        defaultBg: t.surface,
        defaultBorderColor: t.border,
        defaultColor: t.text,
        defaultHoverColor: t.accent,
        defaultHoverBorderColor: t.accent,
      },
      Card: { colorBgContainer: t.surface, colorBorderSecondary: t.border },
      Collapse: { headerBg: t.bgSub, contentBg: t.surface, colorBorder: t.border },
      Input: { colorBgContainer: t.surface, colorBorder: t.border, colorText: t.text },
      Modal: { contentBg: t.surface, headerBg: t.surface, titleColor: t.text },
      Segmented: { trackBg: t.bgHover, itemColor: t.textSub, itemSelectedBg: t.surface, itemSelectedColor: t.text },
      Select: {
        colorBgContainer: t.surface,
        colorBorder: t.border,
        colorText: t.text,
        optionSelectedBg: t.accentBg,
        optionSelectedColor: t.text,
      },
      Table: {
        colorBgContainer: t.surface,
        colorText: t.text,
        colorTextHeading: t.text,
        headerBg: t.bgSub,
        headerColor: t.textSub,
        borderColor: t.border,
        rowHoverBg: t.bgHover,
      },
      Tabs: { itemColor: t.textMuted, itemActiveColor: t.accent, itemSelectedColor: t.accent },
    },
  };
  const { data: rawContest, isLoading, isError, error, refetch: refetchContest } = useGetContestById(contestId);
  console.log("data is", rawContest);
  const contest = normalizeContest(rawContest) ?? contestProp ?? null;
  const [board, setBoard] = useState([]);
  const { data: solvedProblems = [] } = useGetSolvedProblems(contestId);
  const reactQueryClient = useQueryClient();
  const storageUserKey = typeof me === "string" ? me : "contestant";
  const [probIdx, setProbIdx] = useState(0);
  const [lang, setLang] = useState(LANGS[0]);
  const [codes, setCodes] = useState(() => readPersistedCodes(contestId, storageUserKey));
  const [leftTab, setLeftTab] = useState("problem");
  const [rightTab, setRightTab] = useState("testcase");
  const [customIn, setCustomIn] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runRes, setRunRes] = useState(null);
  const [subs, setSubs] = useState({});
  const [confirm, setConfirm] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [warn, setWarn] = useState(false);
  const [leftW, setLeftW] = useState(420);
  const [rightW, setRightW] = useState(400);
  const dragging = useRef(null);
  const navigate = useNavigate();
  const { on, socket } = useSocket();

  useEffect(() => {
    if (!contestId || !socket) return;
    socket.emit("join-room", { contestId });
  }, [contestId, socket]);

  useEffect(() => {
    return on("leaderboard-updated", ({ leaderboard }) => {
      console.log("Leaderboard updated from socket:", leaderboard);
      setBoard(leaderboard);
    });
  }, [on]);
  const prob = contest?.problems?.[probIdx] ?? null;
  useEffect(() => {
    if (contest) setProbIdx(0);
  }, [contest?.title]);

  useEffect(() => {
    setRunRes(null);
    setRightTab("testcase");
  }, [prob?.idx]);


  const { data: savedSubmissions = EMPTY_SUBMISSIONS } = useUserSubmissions(
    prob?.contestId,
    prob?.index,
  );
  const codeKey = prob ? `${prob.idx}_${lang.id}` : `__${lang.id}`;
  const code = codes[codeKey] ?? lang.tmpl;
  const probSubs = prob ? subs[prob.idx] || [] : [];
  const isProblemSolved = (problem) =>
    Boolean(problem) &&
    solvedProblems.some(
      (submission) =>
        submission.verdict === "OK" &&
        Number(submission.cfContestId) === Number(problem.contestId) &&
        submission.problemIndex === problem.index,
    );
  const solved = isProblemSolved(prob);
  const cfSubmitUrl =
    prob?.contestId && prob?.index
      ? `https://codeforces.com/contest/${prob.contestId}/submit/${prob.index}`
      : prob?.url?.replace("/problem/", "/submit/");
  const cfLoginUrl = cfSubmitUrl
    ? `https://codeforces.com/enter?back=${encodeURIComponent(cfSubmitUrl)}`
    : "https://codeforces.com/enter";

  useEffect(() => {
    persistCodes(contestId, storageUserKey, codes);
  }, [contestId, storageUserKey, codes]);

  useEffect(() => {
    if (!contestId) return;

    const storedCodes = readPersistedCodes(contestId, storageUserKey);
    if (Object.keys(storedCodes).length > 0) {
      setCodes((current) => ({ ...current, ...storedCodes }));
    }
  }, [contestId, storageUserKey]);

  useEffect(() => {
    if (!prob) return;

    const latestSubmission = savedSubmissions[0];
    const latestLanguage = LANGS.find(
      (item) => item.id === latestSubmission?.language,
    );
    if (latestLanguage) setLang(latestLanguage);
    if (latestSubmission?.submittedCode) {
      setCodes((current) => ({
        ...current,
        [`${prob.idx}_${latestSubmission.language}`]: latestSubmission.submittedCode,
      }));
    }

    setSubs((current) => ({
      ...current,
      [prob.idx]: savedSubmissions.map((submission) => {
        const submissionLanguage = LANGS.find(
          (item) => item.id === submission.language,
        );
        const submittedAt = new Date(submission.createdAt || submission.submittedAt);
        return {
          id: submission._id,
          verdict: displayVerdict(submission.verdict),
          lang: submissionLanguage?.label || submission.language,
          time: `${submission.timeConsumedMillis || 0}ms`,
          mem: submission.memoryConsumedBytes
            ? `${(submission.memoryConsumedBytes / 1024 / 1024).toFixed(1)}MB`
            : "0MB",
          at: Number.isNaN(submittedAt.getTime())
            ? ""
            : submittedAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          code: submission.submittedCode,
        };
      }),
    }));
  }, [prob?.idx, savedSubmissions]);

  useEffect(() => {
    return on("submission-status-updated", (update) => {
      setSubs((current) => Object.fromEntries(
        Object.entries(current).map(([problemId, entries]) => [
          problemId,
          entries.map((entry) =>
            entry.id === update.submissionId
              ? {
                ...entry,
                verdict: displayVerdict(update.verdict),
                time: `${update.timeConsumedMillis || 0}ms`,
                mem: update.memoryConsumedBytes
                  ? `${(update.memoryConsumedBytes / 1024 / 1024).toFixed(1)}MB`
                  : "0MB",
              }
              : entry,
          ),
        ]),
      ));
      reactQueryClient.invalidateQueries({
        queryKey: ["solvedProblems", contestId],
      });
    });
  }, [contestId, on, reactQueryClient]);

  useEffect(() => {
    if (!contest) return;

    const tick = () => {
      let targetTime;
      const nowMs = Date.now();

      if (contest.status === "scheduled" && contest.scheduledAt && new Date(contest.scheduledAt).getTime() > nowMs) {
        targetTime = new Date(contest.scheduledAt).getTime();
      } else {
        const start = contest.startedAt || (contest.scheduledAt ? new Date(contest.scheduledAt).getTime() : contest.createdAt);
        targetTime = start + contest.durationMinutes * 60000;
      }

      const rem = targetTime - nowMs;

      if (rem <= 0) {
        setTimeLeft("00:00");
        setWarn(false);
        if (contest.status === "scheduled") {
          console.log("Countdown reached 0, refetching contest...");
          refetchContest();
        }
        return;
      }

      setWarn(rem < 600000);

      const hrs = Math.floor(rem / 3600000);
      const m = Math.floor((rem % 3600000) / 60000);
      const s = Math.floor((rem % 60000) / 1000);

      if (contest.status === "scheduled" && new Date(contest.scheduledAt) > new Date()) {
        setTimeLeft(
          `${String(hrs).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        );
      } else {
        setTimeLeft(
          `${String(Math.floor(rem / 60000)).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        );
      }
    };

    tick();
    const id = setInterval(tick, 1000);

    return () => clearInterval(id);
  }, [contest, refetchContest]);

  useEffect(() => {
    const mv = (e) => {
      if (dragging.current === "left")
        setLeftW(Math.max(300, Math.min(580, e.clientX)));
      if (dragging.current === "right")
        setRightW(Math.max(280, Math.min(560, window.innerWidth - e.clientX)));
    };
    const up = () => {
      dragging.current = null;
      document.body.style.cursor = "";
    };
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", up);
    return () => {
      window.removeEventListener("mousemove", mv);
      window.removeEventListener("mouseup", up);
    };
  }, []);

  const onCodeChange = useCallback(
    (v) => setCodes((p) => ({ ...p, [codeKey]: v || "" })),
    [codeKey],
  );



  const submitCode = async (problem) => {
    if (!problem) return;

    setSubmitting(true);
    window.open(cfSubmitUrl, "_blank");
    try {
      const response = await createSubmission({
        contestId,
        cfContestId: problem.contestId,
        problemIndex: problem.index,
        language: lang.id,
        submittedCode: code,
      });
      const submission = response.submission;
      const pendingSubmission = {
        id: submission._id,
        verdict: response.status || submission.verdict || "TESTING",
        lang: lang.label,
        time: "Pending",
        mem: "Pending",
        at: "just now",
        code,
      };

      setSubs((current) => ({
        ...current,
        [problem.idx]: [pendingSubmission, ...(current[problem.idx] || [])],
      }));
      setRightTab("submissions");
      setConfirm(false);
    } catch (error) {
      window.alert(
        error.response?.data?.message || "Unable to queue the submission.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  const runCode = async () => {
    if (!prob) return;
    setRunning(true);
    setRunRes(null);
    setRightTab("result");

    try {
      if (useCustom) {
        const payload = {
          code,
          language: lang.id,
          input: customIn ?? "",
        };
        const data = await executeCode(payload);
        if (!data.success) {
          setRunRes({
            type: "custom",
            out: "",
            error: data.message || "Execution failed.",
          });
        } else {
          const result = data.result;
          setRunRes({
            type: "custom",
            verdict: result.label,
            out: normalizeText(result.stdout),
            stderr: normalizeText(result.stderr),
            compileOutput: normalizeText(result.compileOutput),
            message: normalizeText(result.message),
            exitCode: result.exitCode,
            time: result.time,
            memory: result.memory,
          });
        }
      } else {
        const cases = await Promise.all(
          prob.cases.map(async (c, i) => {
            try {
              const payload = {
                code,
                language: lang.id,
                input: c.i ?? "",
                expectedOutput: c.o ?? "",
              };
              const data = await executeCode(payload);
              const result = data.result;
              const got = resultText(result);
              const expected = normalizeText(c.o);
              const pass = result.status === "accepted" || got === expected;
              const timeMs = result.time
                ? Math.round(Number(result.time) * 1000)
                : null;
              return {
                i: i + 1,
                input: c.i,
                expected: c.o,
                got,
                verdict: result.label,
                pass,
                ms: timeMs ?? Math.floor(Math.random() * 60 + 8),
              };
            } catch (err) {
              return {
                i: i + 1,
                input: c.i,
                expected: c.o,
                got: `Execution error: ${err.message}`,
                pass: false,
                ms: 0,
              };
            }
          }),
        );
        setRunRes({ type: "samples", cases });
      }
    } catch (err) {
      setRunRes({
        type: "custom",
        out: "",
        error: err.message,
      });
    } finally {
      setRunning(false);
    }
  };

  if (isLoading && !contestProp) {
    return (
      <ConfigProvider theme={contestTheme}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            background: t.bg,
            fontFamily: ff,
            color: t.text,
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <Spin size="large" />
          <span style={{ fontSize: 14, color: t.textSub }}>Loading contest…</span>
        </div>
      </ConfigProvider>
    );
  }

  if ((isError || !contest) && !contestProp) {
    return (
      <ConfigProvider theme={contestTheme}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            background: t.bg,
            fontFamily: ff,
            color: t.text,
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
          }}
        >
          <ErrorState
            t={t}
            ff={ff}
            message={error?.message || "Failed to load contest. Please try again."}
          />
        </div>
      </ConfigProvider>
    );
  }

  const isStarted = contest ? (contest.status !== "scheduled" || (contest.scheduledAt && new Date() >= new Date(contest.scheduledAt))) : false;

  if (!isStarted) {
    return (
      <ConfigProvider theme={contestTheme}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            background: t.bg,
            fontFamily: ff,
            color: t.text,
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            padding: 24,
          }}
        >
          <div
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 16,
              padding: "40px 60px",
              textAlign: "center",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              maxWidth: 600,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 20,
                background: t.yellowBg,
                border: `1px solid ${t.yellow}33`,
                fontSize: 12,
                fontWeight: 700,
                color: t.yellow,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <ClockCircleOutlined /> Upcoming Contest
            </div>

            <h1
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: t.text,
                margin: 0,
                letterSpacing: "-0.5px",
                lineHeight: 1.2,
              }}
            >
              {contest?.title}
            </h1>

            <div
              style={{
                fontSize: 14,
                color: t.textSub,
                display: "flex",
                gap: 16,
                justifyContent: "center",
              }}
            >
              <span>Duration: <strong>{contest?.durationMinutes} minutes</strong></span>
            </div>

            <div
              style={{
                fontSize: 48,
                fontWeight: 800,
                fontFamily: fm,
                color: t.accent,
                letterSpacing: "0.05em",
                margin: "12px 0",
              }}
            >
              {timeLeft || "00:00:00"}
            </div>

            <p style={{ color: t.textMuted, fontSize: 14, margin: 0 }}>
              The contest will start automatically once the countdown reaches zero. Please wait.
            </p>

            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => refetchContest()}
              style={{
                marginTop: 8,
                background: t.accent,
                borderColor: t.accent,
                fontWeight: 600,
              }}
            >
              Check Status
            </Button>
          </div>
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={contestTheme}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          background: t.bg,
          fontFamily: ff,
          color: t.text,
          overflow: "hidden",
        }}
      >
        <Modal
          open={confirm && Boolean(prob)}
          onCancel={() => setConfirm(false)}
          footer={null}
          centered
          title="Confirm Submission"
          styles={{ body: { fontFamily: ff } }}
        >
          {prob && (
            <>
              <div
                style={{
                  color: t.textSub,
                  fontSize: 13,
                  lineHeight: 1.7,
                  marginBottom: 14,
                  fontFamily: ff,
                }}
              >
                Submitting{" "}
                <span style={{ color: t.text, fontWeight: 600 }}>
                  {lang.label}
                </span>{" "}
                solution for{" "}
                <span style={{ color: t.accent, fontWeight: 600 }}>
                  {prob.idx}. {prob.name}
                </span>
                .
              </div>
              <Alert
                type="warning"
                showIcon
                icon={<WarningOutlined />}
                style={{ marginBottom: 18, fontFamily: ff, fontSize: 12 }}
                message="You must be logged in to Codeforces before submitting. If you are not logged in, go to the Codeforces login page first."
              />
              <div style={{ display: "flex", gap: 10 }}>
                <Button style={{ flex: 1 }} onClick={() => setConfirm(false)}>
                  Cancel
                </Button>
                <Button
                  style={{ flex: 1.6 }}
                  onClick={() => {
                    window.location.href = cfLoginUrl;
                  }}
                >
                  Login to CF
                </Button>
                <Button
                  style={{ flex: 2, background: t.accent, borderColor: t.accent }}
                  type="primary"
                  onClick={() => {
                    submitCode(prob)
                  }}
                >
                  Submit
                </Button>
              </div>
            </>
          )}
        </Modal>

        <header
          style={{
            height: 52,
            background: t.surface,
            borderBottom: `1px solid ${t.border}`,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flex: 1,
              minWidth: 0,
            }}
          >
            {onExit && (
              <Button
                type="text"
                shape="circle"
                size="small"
                icon={<CloseOutlined style={{ fontSize: 12, color: t.textSub }} />}
                onClick={onExit}
                style={{ border: `1px solid ${t.border}`, width: 32, height: 32 }}
              />
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginRight: 4,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: t.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ThunderboltOutlined style={{ color: "#fff", fontSize: 15 }} />
              </div>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: t.text,
                  fontFamily: ff,
                  letterSpacing: "-0.02em",
                }}
              >
                ContestPad
              </span>
            </div>
            <div
              style={{
                width: 1,
                height: 20,
                background: t.border,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: t.textSub,
                fontFamily: ff,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 220,
              }}
            >
              {contest?.title ?? "—"}
            </span>

            <div style={{ display: "flex", gap: 3, marginLeft: 4 }}>
              {(contest?.problems ?? []).map((p, i) => {
                const ps = subs[p.idx] || [];
                const ok = isProblemSolved(p);
                const tried = ps.length > 0 && !ok;
                return (
                  <Button
                    key={p.idx}
                    size="small"
                    onClick={() => setProbIdx(i)}
                    style={{
                      height: 26,
                      padding: "0 11px",
                      borderRadius: 6,
                      border: `1px solid ${probIdx === i ? t.accent : ok ? t.green + "44" : tried ? t.red + "33" : t.border}`,
                      background:
                        probIdx === i
                          ? t.accentBg
                          : ok
                            ? t.greenBg
                            : tried
                              ? t.redBg
                              : "transparent",
                      color:
                        probIdx === i
                          ? t.accent
                          : ok
                            ? t.green
                            : tried
                              ? t.red
                              : t.textSub,
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: ff,
                    }}
                  >
                    {p.idx}
                    {ok && <CheckCircleFilled style={{ marginLeft: 3, fontSize: 10 }} />}
                  </Button>
                );
              })}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 8,
                border: `1px solid ${warn ? t.red + "55" : t.border}`,
                background: warn ? t.redBg : t.bgSub,
              }}
            >
              <ClockCircleOutlined style={{ fontSize: 12, color: warn ? t.red : t.textMuted }} />
              <span
                style={{
                  fontFamily: fm,
                  fontSize: 13,
                  fontWeight: 600,
                  color: warn ? t.red : t.text,
                  letterSpacing: "0.06em",
                }}
              >
                {timeLeft ||
                  (contest?.status === "scheduled" ? "Scheduled" : "--:--")}
              </span>
            </div>
            <Button
              type="text"
              shape="circle"
              onClick={() => setDark((d) => !d)}
              title="Toggle theme"
              style={{ border: `1px solid ${t.border}`, width: 32, height: 32 }}
              icon={
                dark ? (
                  <BulbOutlined style={{ fontSize: 13, color: t.textSub }} />
                ) : (
                  <BulbFilled style={{ fontSize: 13, color: t.textSub }} />
                )
              }
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "4px 10px 4px 4px",
                borderRadius: 8,
                border: `1px solid ${t.border}`,
              }}
            >
              <Avatar
                size={26}
                style={{
                  background: t.accent,
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: ff,
                }}
              >
                {me[0].toUpperCase()}
              </Avatar>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: t.textSub,
                  fontFamily: ff,
                }}
              >
                {me}
              </span>
            </div>
          </div>
        </header>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <div
            style={{
              width: leftW,
              display: "flex",
              flexDirection: "column",
              borderRight: `1px solid ${t.border}`,
              background: t.surface,
              flexShrink: 0,
              minWidth: 0,
            }}
          >
            <Tabs
              activeKey={leftTab}
              onChange={setLeftTab}
              size="small"
              tabBarStyle={{ margin: 0, padding: "0 12px", fontFamily: ff }}
              items={[
                { key: "problem", label: "Description" },
                { key: "rankings", label: "Rankings" },
              ]}
            />
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                scrollbarWidth: "thin",
                scrollbarColor: `${t.scrollbar} transparent`,
              }}
            >
              {leftTab === "problem" ? (
                isLoading ? (
                  <LoadingSkeleton t={t} ff={ff} />
                ) : prob ? (
                  <ProblemPane prob={prob} t={t} ff={ff} fm={fm} />
                ) : (
                  <ErrorState t={t} ff={ff} message="No problem selected." />
                )
              ) : (
                <RankingsPane
                  board={board}
                  me={me}
                  probs={contest?.problems ?? []}
                  t={t}
                  ff={ff}
                  fm={fm}
                />
              )}
            </div>
          </div>

          <DragHandle
            onStart={() => {
              dragging.current = "left";
              document.body.style.cursor = "col-resize";
            }}
            t={t}
          />

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              background: t.bg,
            }}
          >
            <div
              style={{
                height: 44,
                background: t.surface,
                borderBottom: `1px solid ${t.border}`,
                display: "flex",
                alignItems: "center",
                padding: "0 12px",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <Select
                value={lang.id}
                onChange={(id) => setLang(LANGS.find((l) => l.id === id))}
                size="small"
                style={{ width: 130, fontFamily: ff }}
                options={LANGS.map((l) => ({ value: l.id, label: l.label }))}
              />
              <div style={{ flex: 1 }} />
              <Checkbox
                checked={useCustom}
                onChange={(e) => setUseCustom(e.target.checked)}
                style={{ fontSize: 12, color: t.textSub, fontFamily: ff }}
              >
                Custom input
              </Checkbox>
              <Button
                size="small"
                icon={<ReloadOutlined style={{ fontSize: 11 }} />}
                onClick={() => setCodes((p) => ({ ...p, [codeKey]: lang.tmpl }))}
                style={{ fontSize: 12, fontFamily: ff, border: `1px solid ${t.border}` }}
              >
                Reset
              </Button>
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <div style={{ flex: 1, minHeight: 0 }}>
                <Editor
                  height="100%"
                  theme={t.monacoTheme}
                  language={lang.monaco}
                  value={code}
                  onChange={onCodeChange}
                  options={{
                    fontSize: 14,
                    fontFamily: fm,
                    minimap: { enabled: false },
                    padding: { top: 16 },
                    scrollBeyondLastLine: false,
                    lineNumbers: "on",
                    renderLineHighlight: "line",
                    cursorBlinking: "smooth",
                    smoothScrolling: true,
                    tabSize: 4,
                    wordWrap: "off",
                  }}
                />
              </div>
              {useCustom && (
                <div
                  style={{
                    height: 144,
                    borderTop: `1px solid ${t.border}`,
                    display: "flex",
                    flexDirection: "column",
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      padding: "6px 14px",
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      color: t.textMuted,
                      borderBottom: `1px solid ${t.border}`,
                      background: t.surface,
                      fontFamily: ff,
                    }}
                  >
                    Custom Input (stdin)
                  </div>
                  <textarea
                    value={customIn}
                    onChange={(e) => setCustomIn(e.target.value)}
                    placeholder="Paste your test input here…"
                    spellCheck={false}
                    style={{
                      flex: 1,
                      background: t.codeBg,
                      color: t.text,
                      border: "none",
                      outline: "none",
                      padding: "12px 14px",
                      fontFamily: fm,
                      fontSize: 13,
                      resize: "none",
                      lineHeight: 1.65,
                      scrollbarWidth: "thin",
                      scrollbarColor: `${t.scrollbar} transparent`,
                    }}
                  />
                </div>
              )}
            </div>

            <div
              style={{
                padding: "10px 12px",
                borderTop: `1px solid ${t.border}`,
                display: "flex",
                gap: 8,
                background: t.surface,
                flexShrink: 0,
              }}
            >
              <Button
                onClick={runCode}
                disabled={running || submitting || !prob}
                loading={running}
                icon={!running ? <PlayCircleOutlined /> : undefined}
                style={{
                  flex: 1,
                  height: 38,
                  fontWeight: 600,
                  fontSize: 13,
                  fontFamily: ff,
                  border: `1px solid ${t.border}`,
                }}
              >
                {running ? "Running…" : "Run Code"}
              </Button>
              <Button
                type="primary"
                onClick={() => setConfirm(true)}
                disabled={running || submitting || !prob}
                loading={submitting}
                icon={!submitting ? <SendOutlined /> : undefined}
                style={{
                  flex: 2,
                  height: 38,
                  fontWeight: 700,
                  fontSize: 13,
                  fontFamily: ff,
                  background: solved ? t.green : t.accent,
                  borderColor: solved ? t.green : t.accent,
                }}
              >
                {submitting ? "Judging…" : solved ? "Resubmit" : "Submit"}
              </Button>
            </div>
          </div>

          <DragHandle
            onStart={() => {
              dragging.current = "right";
              document.body.style.cursor = "col-resize";
            }}
            t={t}
          />

          <div
            style={{
              width: rightW,
              display: "flex",
              flexDirection: "column",
              background: t.surface,
              borderLeft: `1px solid ${t.border}`,
              flexShrink: 0,
              minWidth: 0,
            }}
          >
            <Tabs
              activeKey={rightTab}
              onChange={setRightTab}
              size="small"
              tabBarStyle={{ margin: 0, padding: "0 12px", fontFamily: ff }}
              items={[
                { key: "testcase", label: "Testcase" },
                { key: "result", label: "Result" },
                {
                  key: "submissions",
                  label: (
                    <span>
                      Submissions{" "}
                      {probSubs.length > 0 && (
                        <Badge
                          count={probSubs.length}
                          size="small"
                          color={t.accent}
                          style={{ marginLeft: 2 }}
                        />
                      )}
                    </span>
                  ),
                },
              ]}
            />
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                scrollbarWidth: "thin",
                scrollbarColor: `${t.scrollbar} transparent`,
              }}
            >
              {rightTab === "testcase" &&
                (prob ? (
                  <TestcasePane prob={prob} t={t} ff={ff} fm={fm} />
                ) : (
                  <ErrorState t={t} ff={ff} message="No test cases available." />
                ))}
              {rightTab === "result" && (
                <ResultPane
                  res={runRes}
                  running={running}
                  t={t}
                  ff={ff}
                  fm={fm}
                />
              )}
              {rightTab === "submissions" && (
                <SubsPane subs={probSubs} t={t} ff={ff} fm={fm} />
              )}
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}


function DragHandle({ onStart, t }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseDown={onStart}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 5,
        cursor: "col-resize",
        background: hov ? t.accent + "55" : "transparent",
        flexShrink: 0,
        zIndex: 5,
        transition: "background .2s",
      }}
    />
  );
}

function ProblemPane({ prob, t, ff, fm }) {
  const rc = ratingStyle(prob.rating, t);
  return (
    <div className="problem-pane-content" style={{ padding: "24px 24px 40px", fontFamily: ff }}>
      <style>{`
        .problem-pane-content img {
          display: none !important;
        }
      `}</style>
      <Typography.Title
        level={4}
        style={{ color: t.text, margin: "0 0 12px", letterSpacing: "-0.02em" }}
      >
        {prob.idx}. {prob.name}
      </Typography.Title>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <Tag color={rc.text} style={{ background: rc.bg, borderColor: "transparent", borderRadius: 20, fontWeight: 600 }}>
          {rc.label}
        </Tag>
        <span style={{ color: t.border }}>|</span>
        <span style={{ fontSize: 12, color: t.textMuted, fontFamily: fm }}>
          <StarFilled style={{ marginRight: 3 }} /> {prob.rating}
        </span>
        <span style={{ color: t.border }}>|</span>
        <span style={{ fontSize: 12, color: t.textMuted }}>
          Time: {prob.tl}
        </span>
        <span style={{ fontSize: 12, color: t.textMuted }}>
          Memory: {prob.ml}
        </span>
        {prob.url && (
          <>
            <span style={{ color: t.border }}>|</span>
            <a
              href={prob.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 12, color: t.blue, textDecoration: "none" }}
            >
              <LinkOutlined style={{ marginRight: 3 }} />
              View on CF
            </a>
          </>
        )}
      </div>

      <div
        style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}
      >
        {prob.tags.map((tag) => (
          <Tag
            key={tag}
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: t.tagText,
              background: t.tagBg,
              border: "none",
              borderRadius: 20,
            }}
          >
            {tag}
          </Tag>
        ))}
      </div>

      {/* Problem statement rendering below is intentionally left untouched */}
      {prob.body && (
        <ProbSect title="Problem Statement" t={t} ff={ff}>
          <div
            style={{
              fontSize: 14,
              color: t.textSub,
              margin: 0,
              lineHeight: 1.85,
            }}
            dangerouslySetInnerHTML={{
              __html: formatProblemStatement(prob.body),
            }}
          />
        </ProbSect>
      )}

      {prob.inputFmt && (
        <ProbSect title="Input" t={t} ff={ff}>
          <div
            style={{
              fontSize: 14,
              color: t.textSub,
              margin: 0,
              lineHeight: 1.85,
            }}
            dangerouslySetInnerHTML={{
              __html: formatProblemStatement(prob.inputFmt),
            }}
          />
        </ProbSect>
      )}
      {prob.outputFmt && (
        <ProbSect title="Output" t={t} ff={ff}>
          <div
            style={{
              fontSize: 14,
              color: t.textSub,
              margin: 0,
              lineHeight: 1.85,
            }}
            dangerouslySetInnerHTML={{
              __html: formatProblemStatement(prob.outputFmt),
            }}
          />
        </ProbSect>
      )}
      {prob.note && (
        <ProbSect title="Note" t={t} ff={ff}>
          <p
            style={{
              fontSize: 14,
              color: t.text,
              margin: 0,
              whiteSpace: "pre-line",
              lineHeight: 1.85,
            }}
          >
            {prob.note}
          </p>
        </ProbSect>
      )}
      {/* end untouched statement rendering */}

      {prob.cases.length > 0 && (
        <div style={{ marginBottom: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: t.textMuted,
              marginBottom: 14,
            }}
          >
            Examples
          </div>
          {prob.cases.map((c, i) => (
            <div
              key={i}
              style={{ marginBottom: i < prob.cases.length - 1 ? 20 : 0 }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: t.textSub,
                  marginBottom: 10,
                }}
              >
                Example {i + 1}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                {[
                  ["Input", c.i],
                  ["Output", c.o],
                ].map(([label, val]) => (
                  <Card
                    key={label}
                    size="small"
                    title={
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                          color: t.textMuted,
                        }}
                      >
                        {label}
                      </span>
                    }
                    styles={{
                      header: { minHeight: 30, padding: "0 12px", background: t.bgSub, borderColor: t.border },
                      body: { padding: 0 },
                    }}
                    style={{ borderColor: t.border, borderRadius: 9, overflow: "hidden" }}
                  >
                    <pre
                      style={{
                        margin: 0,
                        padding: "10px 12px",
                        fontSize: 13,
                        color: t.text,
                        fontFamily: fm,
                        background: t.codeBg,
                        lineHeight: 1.65,
                        overflowX: "auto",
                        maxHeight: 200,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {val}
                    </pre>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProbSect({ title, children, t, ff }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: t.textMuted,
          marginBottom: 10,
          fontFamily: ff,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function RankingsPane({ board, me, probs, t, ff, fm }) {
  const rankColors = [t.yellow, t.textSub, t.red];
  const columns = [
    {
      title: "#",
      key: "rank",
      width: 50,
      align: "center",
      render: (_, __, i) => {
        const color = rankColors[i] ?? t.textMuted;
        return (
          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 25, height: 25, borderRadius: 6, background: i < 3 ? color + "16" : "transparent", color, fontFamily: fm, fontSize: 12, fontWeight: 700 }}>
            {i + 1}
          </span>
        );
      },
    },
    {
      title: "Handle",
      dataIndex: "h",
      key: "handle",
      render: (h, row) => (
        <div style={{ lineHeight: 1.35 }}>
          <div
            style={{
              fontWeight: row.h === me ? 700 : 500,
              color: row.h === me ? t.accent : t.text,
            }}
          >
            {h}
          </div>
          <div style={{ fontSize: 11, color: t.textMuted }}>{row.h === me ? "You" : row.f}</div>
        </div>
      ),
    },
    ...probs.map((p) => ({
      title: p.idx,
      key: p.idx,
      align: "center",
      render: (_, row) =>
        row.ac[p.idx] ? (
          <Tag
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: t.green,
              background: t.greenBg,
              border: "none",
              fontFamily: fm,
            }}
          >
            +{row.ac[p.idx]}
          </Tag>
        ) : (
          <span style={{ color: t.textMuted, fontSize: 13 }}>—</span>
        ),
    })),
    {
      title: "Solved",
      dataIndex: "s",
      key: "solved",
      align: "center",
      render: (s) => (
        <span style={{ fontWeight: 700, fontFamily: fm, color: s > 0 ? t.text : t.textMuted }}>
          {s}
        </span>
      ),
    },
    {
      title: "Penalty",
      dataIndex: "p",
      key: "penalty",
      align: "center",
      render: (p) => (
        <span style={{ color: t.textSub, fontFamily: fm }}>{p || "—"}</span>
      ),
    },
  ];

  return (
    <div style={{ padding: "18px 16px", fontFamily: ff }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: t.text, letterSpacing: "-0.01em" }}>Standings</div>
          <div style={{ fontSize: 11, color: t.textMuted, marginTop: 3 }}>Ranked by solved problems, then penalty</div>
        </div>
        <div style={{ fontSize: 11, color: t.textMuted, whiteSpace: "nowrap", paddingTop: 3 }}>{board.length} participants</div>
      </div>
      <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: "hidden", background: t.surface }}>
        <Table size="small" rowKey="h" columns={columns} dataSource={board} pagination={false} scroll={{ x: true }} rowClassName={(row) => (row.h === me ? "contest-row-me" : "")} onRow={() => ({ style: { fontSize: 12, height: 52 } })} />
      </div>
      <style>{`.contest-row-me > td { background: ${t.accentBg} !important; } .contest-row-me > td:first-child { box-shadow: inset 2px 0 0 ${t.accent}; }`}</style>
    </div>
  );
}

function TestcasePane({ prob, t, ff, fm }) {
  const [active, setActive] = useState(0);
  if (!prob.cases.length) {
    return (
      <div style={{ padding: 40, fontFamily: ff }}>
        <Empty description={<span style={{ color: t.textMuted, fontSize: 13 }}>No test cases available for this problem.</span>} />
      </div>
    );
  }
  const c = prob.cases[Math.min(active, prob.cases.length - 1)];
  return (
    <div style={{ padding: 16, fontFamily: ff }}>
      <Segmented
        value={active}
        onChange={setActive}
        options={prob.cases.map((_, i) => ({ label: `Case ${i + 1}`, value: i }))}
        style={{ marginBottom: 16 }}
      />
      {[
        ["Input", c.i],
        ["Expected Output", c.o],
      ].map(([label, val]) => (
        <div key={label} style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: t.textMuted,
              marginBottom: 8,
            }}
          >
            {label}
          </div>
          <pre
            style={{
              margin: 0,
              background: t.codeBg,
              border: `1px solid ${t.border}`,
              borderRadius: 9,
              padding: "12px 14px",
              fontSize: 13,
              color: t.text,
              fontFamily: fm,
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              maxHeight: 240,
              overflowY: "auto",
            }}
          >
            {val}
          </pre>
        </div>
      ))}
    </div>
  );
}

function ResultPane({ res, running, t, ff, fm }) {
  if (running)
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          padding: 52,
          color: t.textSub,
          fontFamily: ff,
        }}
      >
        <Spin size="large" />
        <span style={{ fontSize: 13 }}>Running your code…</span>
      </div>
    );
  if (!res)
    return (
      <div style={{ padding: 40, fontFamily: ff }}>
        <Empty
          image={<PlayCircleOutlined style={{ fontSize: 40, color: t.textMuted }} />}
          description={<span style={{ color: t.textMuted, fontSize: 13 }}>Run your code to see results here</span>}
        />
      </div>
    );
  if (res.type === "custom")
    return (
      <div style={{ padding: 16, fontFamily: ff }}>
        {res.verdict ? (
          <Tag
            style={{
              color: verdictInfo(res.verdict, t).c,
              background: verdictInfo(res.verdict, t).bg,
              border: "none",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 12,
              padding: "3px 9px",
            }}
          >
            {res.verdict}
          </Tag>
        ) : null}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            color: t.textMuted,
            marginBottom: 10,
          }}
        >
          Output
        </div>
        <pre
          style={{
            margin: 0,
            background: t.codeBg,
            border: `1px solid ${t.border}`,
            borderRadius: 9,
            padding: "14px",
            fontSize: 13,
            color: t.text,
            fontFamily: fm,
            lineHeight: 1.65,
            whiteSpace: "pre-wrap",
          }}
        >
          {res.out || ""}
        </pre>
        {res.stderr ? (
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: t.textMuted,
                marginBottom: 8,
              }}
            >
              Error
            </div>
            <pre
              style={{
                margin: 0,
                background: t.redBg,
                border: `1px solid ${t.red}55`,
                borderRadius: 9,
                padding: "14px",
                fontSize: 13,
                color: t.red,
                fontFamily: fm,
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
              }}
            >
              {res.stderr}
            </pre>
          </div>
        ) : null}
        {res.compileOutput ? (
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                color: t.textMuted,
                marginBottom: 8,
              }}
            >
              Compile Output
            </div>
            <pre
              style={{
                margin: 0,
                background: t.redBg,
                border: `1px solid ${t.red}55`,
                borderRadius: 9,
                padding: "14px",
                fontSize: 13,
                color: t.red,
                fontFamily: fm,
                lineHeight: 1.65,
                whiteSpace: "pre-wrap",
              }}
            >
              {res.compileOutput}
            </pre>
          </div>
        ) : null}
        {res.message ? (
          <div style={{ marginTop: 14, color: t.red, fontSize: 13 }}>
            {res.message}
          </div>
        ) : null}
        {res.error ? (
          <div style={{ marginTop: 14, color: t.red, fontSize: 13 }}>
            {res.error}
          </div>
        ) : null}
      </div>
    );
  const passed = res.cases.filter((c) => c.pass).length;
  const total = res.cases.length;
  const allOk = passed === total;
  return (
    <div style={{ padding: 16, fontFamily: ff }}>
      <Alert
        showIcon
        type={allOk ? "success" : "error"}
        icon={
          allOk ? (
            <CheckCircleFilled style={{ color: t.green }} />
          ) : (
            <CloseCircleFilled style={{ color: t.red }} />
          )
        }
        style={{
          marginBottom: 16,
          background: allOk ? t.greenBg : t.redBg,
          border: `1px solid ${allOk ? t.green + "44" : t.red + "44"}`,
        }}
        message={
          <div style={{ fontWeight: 700, fontSize: 14, color: allOk ? t.green : t.red }}>
            {allOk ? "All testcases passed" : "Some testcases failed"}
          </div>
        }
        description={
          <div style={{ fontSize: 12, color: t.textSub, marginTop: 2 }}>
            {passed} / {total} passed
          </div>
        }
      />
      {res.cases.map((c) => (
        <Card
          key={c.i}
          size="small"
          style={{
            marginBottom: 10,
            borderRadius: 10,
            borderColor: c.pass ? t.green + "33" : t.red + "33",
            overflow: "hidden",
          }}
          styles={{
            header: {
              background: c.pass ? t.greenBg : t.redBg,
              minHeight: 38,
            },
            body: { padding: "12px 14px" },
          }}
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {c.pass ? (
                <CheckCircleFilled style={{ color: t.green, fontSize: 14 }} />
              ) : (
                <CloseCircleFilled style={{ color: t.red, fontSize: 14 }} />
              )}
              <span style={{ fontWeight: 700, fontSize: 13, color: c.pass ? t.green : t.red }}>
                Testcase {c.i}
              </span>
            </div>
          }
          extra={
            <span style={{ fontSize: 11, color: t.textMuted, fontFamily: fm }}>
              {c.ms} ms
            </span>
          }
        >
          <div style={{ display: "grid", gap: 10 }}>
            {[
              ["Input", c.input],
              ["Expected Output", c.expected],
              ["Got Output", c.got],
              ["Verdict", c.verdict],
            ].map(([lbl, val]) => (
              <div key={lbl}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color: t.textMuted,
                    marginBottom: 5,
                  }}
                >
                  {lbl}
                </div>
                <pre
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: t.text,
                    fontFamily: fm,
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {val}
                </pre>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function SubsPane({ subs, t, ff, fm }) {
  if (!subs.length)
    return (
      <div style={{ padding: 40, fontFamily: ff }}>
        <Empty
          image={<FileTextOutlined style={{ fontSize: 40, color: t.textMuted }} />}
          description={<span style={{ color: t.textMuted, fontSize: 13 }}>No submissions yet for this problem</span>}
        />
      </div>
    );

  const items = subs.map((s) => {
    const vi = verdictInfo(s.verdict, t);
    const isPending = s.verdict === "Pending" || s.verdict === "TESTING";
    return {
      key: s.id,
      collapsible: isPending ? "disabled" : undefined,
      showArrow: !isPending,
      style: {
        borderRadius: 10,
        border: `1px solid ${s.verdict === "Accepted" ? t.green + "44" : t.border}`,
        marginBottom: 6,
        overflow: "hidden",
        background: s.verdict === "Accepted" ? t.greenBg : t.bgSub,
      },
      label: (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: vi.c,
              background: vi.bg,
              padding: "3px 8px",
              borderRadius: 5,
              fontFamily: fm,
              minWidth: 32,
              textAlign: "center",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {isPending && <Spin size="small" />}
            {vi.short}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: isPending ? t.textMuted : vi.c,
              }}
            >
              {s.verdict}
            </div>
            <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>
              {s.lang} · {s.time} · {s.mem}
            </div>
          </div>
          <span
            style={{
              fontSize: 11,
              color: t.textMuted,
              fontFamily: fm,
              flexShrink: 0,
              marginRight: 8,
            }}
          >
            {s.at}
          </span>
        </div>
      ),
      children: !isPending && (
        <pre
          style={{
            margin: 0,
            padding: "14px",
            fontSize: 12,
            color: t.text,
            fontFamily: fm,
            background: t.codeBg,
            maxHeight: 280,
            overflowY: "auto",
            overflowX: "auto",
            lineHeight: 1.65,
            scrollbarWidth: "thin",
            scrollbarColor: `${t.scrollbar} transparent`,
          }}
        >
          {s.code}
        </pre>
      ),
    };
  });

  return (
    <div style={{ padding: 12, fontFamily: ff }}>
      <Collapse
        bordered={false}
        ghost={false}
        items={items}
        style={{ background: "transparent", display: "flex", flexDirection: "column", gap: 6 }}
      />
    </div>
  );
}
