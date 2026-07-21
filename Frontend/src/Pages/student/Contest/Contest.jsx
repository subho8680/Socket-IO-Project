import React, { useState, useRef, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { executeCode, usegetContestById } from "../../../Services/ContestAPI";
import { useNavigate, useParams } from "react-router-dom";
import { formatProblemStatement } from "../../../data/NormalizeStatement";
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
    text: "#eff1f6",
    textSub: "#a6aab4",
    textMuted: "#5c5c5c",
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
    tagText: "#a6aab4",
    codeBg: "#1a1a1a",
  },
  light: {
    bg: "#f7f8fa",
    bgSub: "#ffffff",
    bgHover: "#f0f0f0",
    bgActive: "#e8e8e8",
    surface: "#ffffff",
    surfaceRaised: "#ffffff",
    border: "#e4e4e4",
    borderFaint: "#efefef",
    text: "#1a1a1a",
    textSub: "#4a4a4a",
    textMuted: "#999",
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
    tagBg: "#f0f0f0",
    tagText: "#5a5a5a",
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

function normalizeContest(raw) {
  if (!raw) return null;

  const contestData = raw.contests?.[0] || raw;

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

  contestData.problems.sort((a, b) => a.rating - b.rating);
  return {
    title: contestData.name ?? "Contest",
    durationMinutes: contestData.durationMinutes ?? 120,
    startedAt, // timestamp in ms
    scheduledAt, // Date object
    status: contestData.status ?? "scheduled",
    problems: (contestData.problems ?? []).map((p, idx) => ({
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
  { h: "tourist", f: "🇧🇾", s: 4, p: 187, ac: { A: 12, B: 28, C: 51, D: 187 } },
  { h: "ecnerwala", f: "🇺🇸", s: 3, p: 134, ac: { A: 8, B: 22, C: 134 } },
  { h: "Petr", f: "🇨🇿", s: 3, p: 156, ac: { A: 15, B: 41, C: 156 } },
  { h: "arjun_s", f: "🇮🇳", s: 2, p: 74, ac: { A: 12, B: 74 } },
  { h: "suman_k", f: "🇮🇳", s: 1, p: 18, ac: { A: 18 } },
  { h: "priya_m", f: "🇮🇳", s: 1, p: 25, ac: { A: 25 } },
  { h: "rohan_v", f: "🇮🇳", s: 0, p: 0, ac: {} },
];

const ratingStyle = (r, t) => {
  if (r <= 1000) return { bg: t.greenBg, text: t.green, label: "Easy" };
  if (r <= 1400) return { bg: t.blueBg, text: t.blue, label: "Medium" };
  if (r <= 1800) return { bg: t.yellowBg, text: t.yellow, label: "Hard" };
  if (r <= 2100) return { bg: t.redBg, text: t.red, label: "Expert" };
  return { bg: t.purpleBg, text: t.purple, label: "Master" };
};

const verdictInfo = (v, t) => {
  if (v === "Accepted") return { c: t.green, bg: t.greenBg, short: "AC" };
  if (v === "Wrong Answer") return { c: t.red, bg: t.redBg, short: "WA" };
  if (v === "Time Limit Exceeded")
    return { c: t.yellow, bg: t.yellowBg, short: "TLE" };
  if (v === "Compilation Error") return { c: t.red, bg: t.redBg, short: "CE" };
  if (v === "Runtime Error") return { c: t.red, bg: t.redBg, short: "RE" };
  if (v === "Internal Error") return { c: t.red, bg: t.redBg, short: "IE" };
  return { c: t.textMuted, bg: t.bgSub, short: "···" };
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
  const pulse = {
    background: t.bgSub,
    borderRadius: 6,
    animation: "_pulse 1.4s ease-in-out infinite",
  };
  return (
    <div style={{ padding: 32, fontFamily: ff }}>
      <style>{`@keyframes _pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <div style={{ ...pulse, height: 24, width: "60%", marginBottom: 16 }} />
      <div style={{ ...pulse, height: 14, width: "40%", marginBottom: 24 }} />
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            ...pulse,
            height: 12,
            width: `${80 - i * 10}%`,
            marginBottom: 12,
          }}
        />
      ))}
    </div>
  );
}

function ErrorState({ t, ff, message }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 52,
        color: t.red,
        fontFamily: ff,
        textAlign: "center",
      }}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span style={{ fontSize: 13 }}>
        {message ?? "Failed to load contest"}
      </span>
    </div>
  );
}

export default function Contest({
  contest: contestProp,
  me = "contestant",
  onExit,
}) {
  const [dark, setDark] = useState(true);
  const { contestId } = useParams();
  console.log("contestid is", contestId);
  const t = dark ? T.dark : T.light;
  const ff = `'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  const fm = `'Geist Mono', 'Fira Code', 'Cascadia Code', monospace`;

  const { data: rawContest, isLoading, isError } = usegetContestById(contestId);
  console.log("data is", rawContest);
  const contest = normalizeContest(rawContest) ?? contestProp ?? null;

  const [probIdx, setProbIdx] = useState(0);
  const [lang, setLang] = useState(LANGS[0]);
  const [codes, setCodes] = useState({});
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
  useEffect(() => {
    if (contest) setProbIdx(0);
  }, [contest?.title]);

  const prob = contest?.problems?.[probIdx] ?? null;
  const codeKey = prob ? `${prob.idx}_${lang.id}` : `__${lang.id}`;
  const code = codes[codeKey] ?? lang.tmpl;
  const probSubs = prob ? subs[prob.idx] || [] : [];
  const solved = probSubs.some((s) => s.verdict === "Accepted");
  const cfSubmitUrl =
    prob?.contestId && prob?.index
      ? `https://codeforces.com/contest/${prob.contestId}/submit/${prob.index}`
      : prob?.url?.replace("/problem/", "/submit/");
  const cfLoginUrl = cfSubmitUrl
    ? `https://codeforces.com/enter?back=${encodeURIComponent(cfSubmitUrl)}`
    : "https://codeforces.com/enter";

  useEffect(() => {
    if (!contest) return;

    const tick = () => {
      let targetTime;

      if (contest.status === "scheduled" && contest.scheduledAt) {
        targetTime = contest.scheduledAt.getTime();
      } else if (contest.startedAt) {
        targetTime = contest.startedAt + contest.durationMinutes * 60000;
      } else {
        targetTime = Date.now() + contest.durationMinutes * 60000;
      }

      const rem = targetTime - Date.now();

      if (rem <= 0) {
        setTimeLeft("00:00");
        setWarn(false);
        return;
      }

      setWarn(rem < 600000);

      const m = Math.floor(rem / 60000);
      const s = Math.floor((rem % 60000) / 1000);

      setTimeLeft(
        `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      );
    };

    tick();
    const id = setInterval(tick, 1000);

    return () => clearInterval(id);
  }, [contest]);

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

    console.log("cfsubmission is", problem)
    window.open(cfSubmitUrl, "_blank");
    const submitPayload = {

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
  const tab = (active) => ({
    flex: 1,
    padding: "11px 0",
    border: "none",
    background: "none",
    cursor: "pointer",
    fontFamily: ff,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.01em",
    color: active ? t.text : t.textMuted,
    borderBottom: `2px solid ${active ? t.accent : "transparent"}`,
    transition: "all .15s",
  });

  if (isLoading && !contestProp) {
    return (
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
        <Spin c={t.accent} sz={32} />
        <span style={{ fontSize: 14, color: t.textSub }}>Loading contest…</span>
      </div>
    );
  }

  if ((isError || !contest) && !contestProp) {
    return (
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
          message="Failed to load contest. Please try again."
        />
      </div>
    );
  }

  return (
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
      {confirm && prob && (
        <div
          onClick={() => setConfirm(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: 14,
              padding: 28,
              width: 360,
              boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 17,
                marginBottom: 6,
                fontFamily: ff,
              }}
            >
              Confirm Submission
            </div>
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
            <div
              style={{
                display: "flex",
                gap: 10,
                padding: "11px 12px",
                marginBottom: 18,
                borderRadius: 8,
                border: `1px solid ${t.yellow}55`,
                background: t.yellowBg,
                color: t.text,
                fontSize: 12,
                lineHeight: 1.55,
                fontFamily: ff,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={t.yellow}
                strokeWidth="2"
                style={{ flexShrink: 0, marginTop: 1 }}
              >
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div>
                You must be logged in to Codeforces before submitting. If you
                are not logged in, go to the Codeforces login page first.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setConfirm(false)}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 8,
                  border: `1px solid ${t.border}`,
                  background: "transparent",
                  color: t.text,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: ff,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  window.location.href = cfLoginUrl;
                }}
                style={{
                  flex: 1.6,
                  height: 38,
                  borderRadius: 8,
                  border: `1px solid ${t.border}`,
                  background: t.bgSub,
                  color: t.text,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: ff,
                }}
              >
                Login to CF
              </button>
              <button
                onClick={submitCode(prob)}
                style={{
                  flex: 2,
                  height: 38,
                  borderRadius: 8,
                  border: "none",
                  background: t.accent,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: ff,
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

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
            <button onClick={onExit} style={iconBtnStyle(t)}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M16 18L22 12L16 6"
                  stroke="#fff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 6L2 12L8 18"
                  stroke="#fff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
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
              const ok = ps.some((s) => s.verdict === "Accepted");
              const tried = ps.length > 0 && !ok;
              return (
                <button
                  key={p.idx}
                  onClick={() => setProbIdx(i)}
                  style={{
                    padding: "4px 11px",
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
                    cursor: "pointer",
                    fontFamily: ff,
                    transition: "all .15s",
                  }}
                >
                  {p.idx}
                  {ok && <span style={{ marginLeft: 3, fontSize: 10 }}>✓</span>}
                </button>
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
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke={warn ? t.red : t.textMuted}
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
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
          <button
            onClick={() => setDark((d) => !d)}
            style={iconBtnStyle(t)}
            title="Toggle theme"
          >
            {dark ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke={t.textSub}
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke={t.textSub}
                strokeWidth="2"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
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
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                background: t.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                fontFamily: ff,
              }}
            >
              {me[0].toUpperCase()}
            </div>
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
          <div
            style={{
              display: "flex",
              borderBottom: `1px solid ${t.border}`,
              flexShrink: 0,
            }}
          >
            <button
              style={tab(leftTab === "problem")}
              onClick={() => setLeftTab("problem")}
            >
              Description
            </button>
            <button
              style={tab(leftTab === "rankings")}
              onClick={() => setLeftTab("rankings")}
            >
              Rankings
            </button>
          </div>
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
                board={BOARD}
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
            <select
              value={lang.id}
              onChange={(e) =>
                setLang(LANGS.find((l) => l.id === e.target.value))
              }
              style={{
                background: t.bgSub,
                color: t.text,
                border: `1px solid ${t.border}`,
                borderRadius: 7,
                padding: "5px 10px",
                fontSize: 12,
                fontFamily: ff,
                cursor: "pointer",
                outline: "none",
                fontWeight: 500,
              }}
            >
              {LANGS.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
            <div style={{ flex: 1 }} />
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                fontSize: 12,
                color: t.textSub,
                fontFamily: ff,
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={useCustom}
                onChange={(e) => setUseCustom(e.target.checked)}
                style={{
                  accentColor: t.accent,
                  cursor: "pointer",
                  width: 13,
                  height: 13,
                }}
              />
              Custom input
            </label>
            <button
              onClick={() => setCodes((p) => ({ ...p, [codeKey]: lang.tmpl }))}
              style={{
                ...iconBtnStyle(t),
                width: "auto",
                padding: "0 10px",
                gap: 5,
                fontSize: 12,
                fontFamily: ff,
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 .49-4.5" />
              </svg>
              Reset
            </button>
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
            <button
              onClick={runCode}
              disabled={running || submitting || !prob}
              onMouseEnter={(e) => {
                if (!running && !submitting)
                  e.currentTarget.style.background = t.bgHover;
              }}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
              style={{
                flex: 1,
                height: 38,
                borderRadius: 8,
                border: `1px solid ${t.border}`,
                background: "transparent",
                color: running ? t.textMuted : t.text,
                fontWeight: 600,
                fontSize: 13,
                cursor:
                  running || submitting || !prob ? "not-allowed" : "pointer",
                fontFamily: ff,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "all .15s",
              }}
            >
              {running ? (
                <>
                  <Spin c={t.textMuted} /> Running…
                </>
              ) : (
                <>
                  <PlayIcon /> Run Code
                </>
              )}
            </button>
            <button
              onClick={() => setConfirm(true)}
              disabled={running || submitting || !prob}
              onMouseEnter={(e) => {
                if (!running && !submitting)
                  e.currentTarget.style.filter = "brightness(1.1)";
              }}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
              style={{
                flex: 2,
                height: 38,
                borderRadius: 8,
                border: "none",
                background: solved ? t.green : t.accent,
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                cursor:
                  running || submitting || !prob ? "not-allowed" : "pointer",
                fontFamily: ff,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "all .15s",
                opacity: running || submitting ? 0.65 : 1,
              }}
            >
              {submitting ? (
                <>
                  <Spin c="#fff" /> Judging…
                </>
              ) : (
                <>
                  <SendIcon />
                  {solved ? "Resubmit" : "Submit"}
                </>
              )}
            </button>
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
          <div
            style={{
              display: "flex",
              borderBottom: `1px solid ${t.border}`,
              flexShrink: 0,
            }}
          >
            <button
              style={tab(rightTab === "testcase")}
              onClick={() => setRightTab("testcase")}
            >
              Testcase
            </button>
            <button
              style={tab(rightTab === "result")}
              onClick={() => setRightTab("result")}
            >
              Result
            </button>
            <button
              style={tab(rightTab === "submissions")}
              onClick={() => setRightTab("submissions")}
            >
              {`Submissions${probSubs.length ? ` (${probSubs.length})` : ""}`}
            </button>
          </div>
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
    <div style={{ padding: "24px 24px 40px", fontFamily: ff }}>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: t.text,
          margin: "0 0 12px",
          lineHeight: 1.3,
          letterSpacing: "-0.02em",
        }}
      >
        {prob.idx}. {prob.name}
      </h2>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: rc.text,
            background: rc.bg,
            padding: "3px 10px",
            borderRadius: 20,
          }}
        >
          {rc.label}
        </span>
        <span style={{ color: t.border }}>|</span>
        <span style={{ fontSize: 12, color: t.textMuted, fontFamily: fm }}>
          ★ {prob.rating}
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
              View on CF ↗
            </a>
          </>
        )}
      </div>

      <div
        style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}
      >
        {prob.tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: t.tagText,
              background: t.tagBg,
              padding: "3px 10px",
              borderRadius: 20,
            }}
          >
            {tag}
          </span>
        ))}
      </div>

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
              color: t.textSub,
              margin: 0,
              whiteSpace: "pre-line",
              lineHeight: 1.85,
            }}
          >
            {prob.note}
          </p>
        </ProbSect>
      )}

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
                  <div
                    key={label}
                    style={{
                      borderRadius: 9,
                      border: `1px solid ${t.border}`,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "6px 12px",
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        color: t.textMuted,
                        background: t.bgSub,
                        borderBottom: `1px solid ${t.border}`,
                      }}
                    >
                      {label}
                    </div>
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
                  </div>
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
  return (
    <div style={{ padding: 16, fontFamily: ff }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          color: t.textMuted,
          marginBottom: 14,
        }}
      >
        Live Standings
      </div>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
        >
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.border}` }}>
              {[
                "#",
                "Handle",
                ...probs.map((p) => p.idx),
                "Solved",
                "Penalty",
              ].map((h, i) => (
                <th
                  key={i}
                  style={{
                    padding: "7px 10px",
                    fontWeight: 600,
                    color: t.textMuted,
                    textAlign:
                      i === 0 || i > 1 + probs.length
                        ? "center"
                        : i === 1
                          ? "left"
                          : "center",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {board.map((row, i) => {
              const isMe = row.h === me;
              const medal = ["🥇", "🥈", "🥉"][i];
              return (
                <tr
                  key={row.h}
                  style={{
                    borderBottom: `1px solid ${t.borderFaint}`,
                    background: isMe ? t.accentBg : "transparent",
                    transition: "background .15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isMe) e.currentTarget.style.background = t.bgHover;
                  }}
                  onMouseLeave={(e) =>
                  (e.currentTarget.style.background = isMe
                    ? t.accentBg
                    : "transparent")
                  }
                >
                  <td
                    style={{
                      padding: "10px",
                      textAlign: "center",
                      fontFamily: fm,
                      fontSize: 13,
                    }}
                  >
                    {medal || (
                      <span style={{ color: t.textMuted }}>{i + 1}</span>
                    )}
                  </td>
                  <td style={{ padding: "10px" }}>
                    <div
                      style={{
                        fontWeight: isMe ? 700 : 500,
                        color: isMe ? t.accent : t.text,
                      }}
                    >
                      {row.h}
                    </div>
                    <div style={{ fontSize: 11, color: t.textMuted }}>
                      {row.f}
                    </div>
                  </td>
                  {probs.map((p) => (
                    <td
                      key={p.idx}
                      style={{ padding: "10px", textAlign: "center" }}
                    >
                      {row.ac[p.idx] ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: t.green,
                            background: t.greenBg,
                            padding: "2px 7px",
                            borderRadius: 4,
                            fontFamily: fm,
                          }}
                        >
                          +{row.ac[p.idx]}
                        </span>
                      ) : (
                        <span style={{ color: t.textMuted }}>—</span>
                      )}
                    </td>
                  ))}
                  <td
                    style={{
                      padding: "10px",
                      textAlign: "center",
                      fontWeight: 700,
                      fontFamily: fm,
                      color: row.s > 0 ? t.text : t.textMuted,
                    }}
                  >
                    {row.s}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      textAlign: "center",
                      color: t.textSub,
                      fontFamily: fm,
                    }}
                  >
                    {row.p || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TestcasePane({ prob, t, ff, fm }) {
  const [active, setActive] = useState(0);
  if (!prob.cases.length) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 52,
          color: t.textMuted,
          fontFamily: ff,
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: 13 }}>
          No test cases available for this problem.
        </span>
      </div>
    );
  }
  const c = prob.cases[Math.min(active, prob.cases.length - 1)];
  return (
    <div style={{ padding: 16, fontFamily: ff }}>
      <div
        style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}
      >
        {prob.cases.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              padding: "5px 13px",
              borderRadius: 7,
              border: `1px solid ${active === i ? t.accent : t.border}`,
              background: active === i ? t.accentBg : "transparent",
              color: active === i ? t.accent : t.textSub,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: ff,
              transition: "all .12s",
            }}
          >
            Case {i + 1}
          </button>
        ))}
      </div>
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
        <Spin c={t.accent} sz={28} />
        <span style={{ fontSize: 13 }}>Running your code…</span>
      </div>
    );
  if (!res)
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 52,
          color: t.textMuted,
          fontFamily: ff,
          textAlign: "center",
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <span style={{ fontSize: 13 }}>Run your code to see results here</span>
      </div>
    );
  if (res.type === "custom")
    return (
      <div style={{ padding: 16, fontFamily: ff }}>
        {res.verdict ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: verdictInfo(res.verdict, t).c,
              background: verdictInfo(res.verdict, t).bg,
              borderRadius: 6,
              padding: "5px 9px",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            {res.verdict}
          </div>
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          borderRadius: 10,
          background: allOk ? t.greenBg : t.redBg,
          border: `1px solid ${allOk ? t.green + "44" : t.red + "44"}`,
          marginBottom: 16,
        }}
      >
        {allOk ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={t.green}
            strokeWidth="2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={t.red}
            strokeWidth="2.5"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )}
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: allOk ? t.green : t.red,
            }}
          >
            {allOk ? "All testcases passed" : "Some testcases failed"}
          </div>
          <div style={{ fontSize: 12, color: t.textSub, marginTop: 2 }}>
            {passed} / {total} passed
          </div>
        </div>
      </div>
      {res.cases.map((c) => (
        <div
          key={c.i}
          style={{
            marginBottom: 10,
            borderRadius: 10,
            border: `1px solid ${c.pass ? t.green + "33" : t.red + "33"}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "9px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: c.pass ? t.greenBg : t.redBg,
            }}
          >
            {c.pass ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke={t.green}
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke={t.red}
                strokeWidth="2.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
            <span
              style={{
                fontWeight: 700,
                fontSize: 13,
                color: c.pass ? t.green : t.red,
              }}
            >
              Testcase {c.i}
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 11,
                color: t.textMuted,
                fontFamily: fm,
              }}
            >
              {c.ms} ms
            </span>
          </div>
          {!c.pass && (
            <div style={{ padding: "12px 14px", display: "grid", gap: 10 }}>
              {[
                ["Input", c.input],
                ["Expected", c.expected],
                ["Verdict", c.verdict],
                ["Got", c.got],
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
                    }}
                  >
                    {val}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SubsPane({ subs, t, ff, fm }) {
  const [open, setOpen] = useState(null);
  if (!subs.length)
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 52,
          color: t.textMuted,
          fontFamily: ff,
          textAlign: "center",
        }}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
        <span style={{ fontSize: 13 }}>
          No submissions yet for this problem
        </span>
      </div>
    );
  return (
    <div
      style={{
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        fontFamily: ff,
      }}
    >
      {subs.map((s) => {
        const vi = verdictInfo(s.verdict, t);
        const isOpen = open === s.id;
        const isPending = s.verdict === "Pending";
        return (
          <div
            key={s.id}
            style={{
              borderRadius: 10,
              border: `1px solid ${s.verdict === "Accepted" ? t.green + "44" : t.border}`,
              overflow: "hidden",
            }}
          >
            <div
              onClick={() => !isPending && setOpen(isOpen ? null : s.id)}
              style={{
                padding: "11px 14px",
                cursor: isPending ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: s.verdict === "Accepted" ? t.greenBg : t.bgSub,
                transition: "background .12s",
              }}
              onMouseEnter={(e) => {
                if (!isPending && s.verdict !== "Accepted")
                  e.currentTarget.style.background = t.bgHover;
              }}
              onMouseLeave={(e) =>
              (e.currentTarget.style.background =
                s.verdict === "Accepted" ? t.greenBg : t.bgSub)
              }
            >
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
                {isPending && <Spin c={vi.c} sz={10} />}
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
                }}
              >
                {s.at}
              </span>
              {!isPending && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={t.textMuted}
                  strokeWidth="2"
                  style={{
                    transform: isOpen ? "rotate(180deg)" : "none",
                    transition: "transform .2s",
                    flexShrink: 0,
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              )}
            </div>
            {isOpen && !isPending && (
              <div style={{ borderTop: `1px solid ${t.border}` }}>
                <div
                  style={{
                    padding: "6px 14px",
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    color: t.textMuted,
                    borderBottom: `1px solid ${t.border}`,
                    background: t.surface,
                  }}
                >
                  Submitted Code
                </div>
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
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Spin({ c = "#ffa116", sz = 16 }) {
  return (
    <svg
      width={sz}
      height={sz}
      viewBox="0 0 24 24"
      fill="none"
      stroke={c}
      strokeWidth="2.5"
      style={{ animation: "_spin .75s linear infinite", flexShrink: 0 }}
    >
      <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
function iconBtnStyle(t) {
  return {
    background: "transparent",
    border: `1px solid ${t.border}`,
    cursor: "pointer",
    color: t.textSub,
    width: 32,
    height: 32,
    borderRadius: 7,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all .15s",
  };
}
