import React, { useState, useRef, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap";
if (!document.head.querySelector('[href*="Geist"]')) document.head.appendChild(fontLink);

const T = {
  dark: {
    bg: "#1a1a1a", bgSub: "#262626", bgHover: "#2e2e2e", bgActive: "#333",
    surface: "#1f1f1f", surfaceRaised: "#282828",
    border: "#3a3a3a", borderFaint: "#2e2e2e",
    text: "#eff1f6", textSub: "#a6aab4", textMuted: "#5c5c5c",
    accent: "#ffa116", accentBg: "#ffa11618", accentHover: "#ffb84d",
    green: "#2cbb5d", greenBg: "#2cbb5d18",
    red: "#ef4743", redBg: "#ef474318",
    blue: "#4d9cf8", blueBg: "#4d9cf818",
    yellow: "#f0a119", yellowBg: "#f0a11918",
    purple: "#a78bfa", purpleBg: "#a78bfa18",
    monacoTheme: "vs-dark", scrollbar: "#3a3a3a",
    tagBg: "#2e2e2e", tagText: "#a6aab4", codeBg: "#1a1a1a",
  },
  light: {
    bg: "#f7f8fa", bgSub: "#ffffff", bgHover: "#f0f0f0", bgActive: "#e8e8e8",
    surface: "#ffffff", surfaceRaised: "#ffffff",
    border: "#e4e4e4", borderFaint: "#efefef",
    text: "#1a1a1a", textSub: "#4a4a4a", textMuted: "#999",
    accent: "#ffa116", accentBg: "#fff7e6", accentHover: "#ff8c00",
    green: "#00b862", greenBg: "#e9f9ef",
    red: "#de2222", redBg: "#fdecea",
    blue: "#1c7ee0", blueBg: "#e7f2ff",
    yellow: "#c07800", yellowBg: "#fef9e7",
    purple: "#7c3aed", purpleBg: "#f3f0ff",
    monacoTheme: "vs", scrollbar: "#d4d4d4",
    tagBg: "#f0f0f0", tagText: "#5a5a5a", codeBg: "#f7f8fa",
  }
};

const LANGS = [
  {
    id: "cpp17", label: "C++ 17", monaco: "cpp",
    tmpl: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    \n    return 0;\n}`
  },
  {
    id: "python3", label: "Python 3", monaco: "python",
    tmpl: `import sys\ninput = sys.stdin.readline\n\ndef solve():\n    pass\n\nsolve()`
  },
  {
    id: "java", label: "Java", monaco: "java",
    tmpl: `import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));\n        \n    }\n}`
  },
  {
    id: "js", label: "JavaScript", monaco: "javascript",
    tmpl: `process.stdin.resume();\nprocess.stdin.setEncoding('utf8');\nlet _in = '';\nprocess.stdin.on('data', d => _in += d);\nprocess.stdin.on('end', () => {\n    const lines = _in.split('\\n');\n    // solve\n});`
  },
];

const CONTEST = {
  title: "Codeforces Round #942 (Div. 2)",
  durationMinutes: 120,
  startedAt: Date.now() - 22 * 60 * 1000,
  problems: [
    {
      idx: "A", name: "Distanced Soldiers", rating: 800, tags: ["math", "greedy"], tl: "1s", ml: "256MB",
      body: `You are given an array of n integers. Find the maximum value of a[i] − a[j] for all valid pairs (i, j) where i < j.\n\nIf no such pair exists where a[i] > a[j], print 0.`,
      inputFmt: `First line: integer n (2 ≤ n ≤ 10⁵).\nSecond line: n integers a₁, a₂, …, aₙ (−10⁹ ≤ aᵢ ≤ 10⁹).`,
      outputFmt: `A single integer — the answer.`,
      cases: [{ i: "5\n7 1 5 3 6", o: "6" }, { i: "4\n1 2 3 4", o: "0" }, { i: "3\n5 5 5", o: "0" }]
    },
    {
      idx: "B", name: "Two Arrays", rating: 1200, tags: ["sorting", "binary search"], tl: "2s", ml: "256MB",
      body: `You have two arrays a and b of length n. You may swap a[i] and b[i] for any index i, any number of times.\n\nDetermine if it is possible to make both arrays non-decreasing simultaneously.`,
      inputFmt: `Line 1: integer n (1 ≤ n ≤ 10⁵).\nLine 2: n integers for array a.\nLine 3: n integers for array b.`,
      outputFmt: `Print "YES" or "NO".`,
      cases: [{ i: "4\n1 3 2 4\n2 1 4 3", o: "YES" }, { i: "3\n3 1 2\n1 2 3", o: "NO" }]
    },
    {
      idx: "C", name: "Balanced Heaps", rating: 1700, tags: ["dp", "binary search", "greedy"], tl: "2s", ml: "256MB",
      body: `There are n heaps of stones in a circle. You may take 2 stones from any heap with ≥ 2 stones and add 1 to the previous heap.\n\nFind the minimum possible value of the maximum heap after any number of operations.`,
      inputFmt: `Line 1: integer n.\nLine 2: n integers — heap sizes (0 ≤ aᵢ ≤ 10⁹).`,
      outputFmt: `A single integer — minimum possible maximum.`,
      cases: [{ i: "4\n5 1 2 7", o: "4" }, { i: "3\n1 2 3", o: "2" }]
    },
    {
      idx: "D", name: "XOR & Sum", rating: 2100, tags: ["math", "bitwise", "constructive"], tl: "3s", ml: "512MB",
      body: `Count arrays of length n with elements in [0, 2^k) such that both XOR and sum of all elements are 0 mod 2^k.\n\nPrint the count modulo 10⁹ + 7.`,
      inputFmt: `A single line with integers n and k (1 ≤ n ≤ 10⁹, 1 ≤ k ≤ 30).`,
      outputFmt: `Count modulo 10⁹ + 7.`,
      cases: [{ i: "2 2", o: "4" }, { i: "3 1", o: "2" }]
    },
  ],
};

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
  if (v === "Time Limit Exceeded") return { c: t.yellow, bg: t.yellowBg, short: "TLE" };
  if (v === "Runtime Error") return { c: t.red, bg: t.redBg, short: "RE" };
  return { c: t.textMuted, bg: t.bgSub, short: "···" };
};

export default function ContestDashboard({ contest = CONTEST, me = "suman_k", onExit }) {
  const [dark, setDark] = useState(true);
  const t = dark ? T.dark : T.light;
  const ff = `'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
  const fm = `'Geist Mono', 'Fira Code', 'Cascadia Code', monospace`;

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

  const prob = contest.problems[probIdx];
  const codeKey = `${prob.idx}_${lang.id}`;
  const code = codes[codeKey] ?? lang.tmpl;
  const probSubs = subs[prob.idx] || [];
  const solved = probSubs.some(s => s.verdict === "Accepted");

  useEffect(() => {
    const tick = () => {
      const rem = contest.durationMinutes * 60000 - (Date.now() - contest.startedAt);
      if (rem <= 0) { setTimeLeft("00:00"); return; }
      setWarn(rem < 600000);
      const m = Math.floor(rem / 60000), s = Math.floor((rem % 60000) / 1000);
      setTimeLeft(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick(); const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [contest]);

  useEffect(() => {
    const mv = e => {
      if (dragging.current === "left") setLeftW(Math.max(300, Math.min(580, e.clientX)));
      if (dragging.current === "right") setRightW(Math.max(280, Math.min(560, window.innerWidth - e.clientX)));
    };
    const up = () => { dragging.current = null; document.body.style.cursor = ""; };
    window.addEventListener("mousemove", mv);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
  }, []);

  const onCodeChange = useCallback(v => setCodes(p => ({ ...p, [codeKey]: v || "" })), [codeKey]);

  const runCode = async () => {
    setRunning(true); setRunRes(null); setRightTab("result");
    await new Promise(r => setTimeout(r, 700 + Math.random() * 500));
    if (useCustom) {
      setRunRes({ type: "custom", out: (customIn || "").trim().split("\n").map(() => String(Math.floor(Math.random() * 100))).join("\n") || "0" });
    } else {
      setRunRes({
        type: "samples", cases: prob.cases.map((c, i) => {
          const pass = Math.random() > 0.35;
          return { i: i + 1, input: c.i, expected: c.o, got: pass ? c.o : String(Math.floor(Math.random() * 10)), pass, ms: Math.floor(Math.random() * 60 + 8) };
        })
      });
    }
    setRunning(false);
  };

  const submitCode = async () => {
    setConfirm(false); setSubmitting(true); setRightTab("submissions");
    const id = Date.now();
    const pending = { id, lang: lang.label, verdict: "Pending", time: "—", mem: "—", code, at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setSubs(p => ({ ...p, [prob.idx]: [pending, ...(p[prob.idx] || [])] }));
    await new Promise(r => setTimeout(r, 1400 + Math.random() * 900));
    const roll = Math.random();
    const verdict = roll < 0.52 ? "Accepted" : roll < 0.75 ? "Wrong Answer" : roll < 0.88 ? "Time Limit Exceeded" : "Runtime Error";
    setSubs(p => ({ ...p, [prob.idx]: (p[prob.idx] || []).map(s => s.id === id ? { ...s, verdict, time: Math.floor(Math.random() * 280 + 20) + "ms", mem: Math.floor(Math.random() * 40 + 12) + "MB" } : s) }));
    setSubmitting(false);
  };

  const tab = (active) => ({
    flex: 1, padding: "11px 0", border: "none", background: "none", cursor: "pointer",
    fontFamily: ff, fontSize: 12, fontWeight: 600, letterSpacing: "0.01em",
    color: active ? t.text : t.textMuted,
    borderBottom: `2px solid ${active ? t.accent : "transparent"}`,
    transition: "all .15s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: t.bg, fontFamily: ff, color: t.text, overflow: "hidden" }}>

      {confirm && (
        <div onClick={() => setConfirm(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 14, padding: 28, width: 360, boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
            <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 6, fontFamily: ff }}>Confirm Submission</div>
            <div style={{ color: t.textSub, fontSize: 13, lineHeight: 1.7, marginBottom: 22, fontFamily: ff }}>
              Submitting <span style={{ color: t.text, fontWeight: 600 }}>{lang.label}</span> solution for{" "}
              <span style={{ color: t.accent, fontWeight: 600 }}>{prob.idx}. {prob.name}</span>.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirm(false)} style={{ flex: 1, height: 38, borderRadius: 8, border: `1px solid ${t.border}`, background: "transparent", color: t.text, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: ff }}>Cancel</button>
              <button onClick={submitCode} style={{ flex: 2, height: 38, borderRadius: 8, border: "none", background: t.accent, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: ff }}>Submit</button>
            </div>
          </div>
        </div>
      )}

      <header style={{ height: 52, background: t.surface, borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 12, flexShrink: 0 }}>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          {onExit && <button onClick={onExit} style={iconBtnStyle(t)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>}

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 4, flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: t.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M16 18L22 12L16 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M8 6L2 12L8 18" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: t.text, fontFamily: ff, letterSpacing: "-0.02em" }}>ContestPad</span>
          </div>

          <div style={{ width: 1, height: 20, background: t.border, flexShrink: 0 }} />

          <span style={{ fontSize: 12, fontWeight: 500, color: t.textSub, fontFamily: ff, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }}>{contest.title}</span>

          <div style={{ display: "flex", gap: 3, marginLeft: 4 }}>
            {contest.problems.map((p, i) => {
              const ps = subs[p.idx] || [];
              const ok = ps.some(s => s.verdict === "Accepted");
              const tried = ps.length > 0 && !ok;
              return (
                <button key={p.idx} onClick={() => setProbIdx(i)} style={{
                  padding: "4px 11px", borderRadius: 6,
                  border: `1px solid ${probIdx === i ? t.accent : ok ? t.green + "44" : tried ? t.red + "33" : t.border}`,
                  background: probIdx === i ? t.accentBg : ok ? t.greenBg : tried ? t.redBg : "transparent",
                  color: probIdx === i ? t.accent : ok ? t.green : tried ? t.red : t.textSub,
                  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: ff, transition: "all .15s",
                }}>
                  {p.idx}
                  {ok && <span style={{ marginLeft: 3, fontSize: 10 }}>✓</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8, border: `1px solid ${warn ? t.red + "55" : t.border}`, background: warn ? t.redBg : t.bgSub }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={warn ? t.red : t.textMuted} strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            <span style={{ fontFamily: fm, fontSize: 13, fontWeight: 600, color: warn ? t.red : t.text, letterSpacing: "0.06em" }}>{timeLeft || "--:--"}</span>
          </div>

          <button onClick={() => setDark(d => !d)} style={iconBtnStyle(t)} title="Toggle theme">
            {dark
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textSub} strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.textSub} strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
            }
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "4px 10px 4px 4px", borderRadius: 8, border: `1px solid ${t.border}` }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: t.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", fontFamily: ff }}>
              {me[0].toUpperCase()}
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: t.textSub, fontFamily: ff }}>{me}</span>
          </div>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        <div style={{ width: leftW, display: "flex", flexDirection: "column", borderRight: `1px solid ${t.border}`, background: t.surface, flexShrink: 0, minWidth: 0 }}>
          <div style={{ display: "flex", borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
            <button style={tab(leftTab === "problem")} onClick={() => setLeftTab("problem")}>Description</button>
            <button style={tab(leftTab === "rankings")} onClick={() => setLeftTab("rankings")}>Rankings</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: `${t.scrollbar} transparent` }}>
            {leftTab === "problem"
              ? <ProblemPane prob={prob} t={t} ff={ff} fm={fm} />
              : <RankingsPane board={BOARD} me={me} probs={contest.problems} t={t} ff={ff} fm={fm} />
            }
          </div>
        </div>

        <DragHandle onStart={() => { dragging.current = "left"; document.body.style.cursor = "col-resize"; }} t={t} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: t.bg }}>

          <div style={{ height: 44, background: t.surface, borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", padding: "0 12px", gap: 8, flexShrink: 0 }}>
            <select value={lang.id} onChange={e => setLang(LANGS.find(l => l.id === e.target.value))}
              style={{ background: t.bgSub, color: t.text, border: `1px solid ${t.border}`, borderRadius: 7, padding: "5px 10px", fontSize: 12, fontFamily: ff, cursor: "pointer", outline: "none", fontWeight: 500 }}>
              {LANGS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>

            <div style={{ flex: 1 }} />

            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: t.textSub, fontFamily: ff, userSelect: "none" }}>
              <input type="checkbox" checked={useCustom} onChange={e => setUseCustom(e.target.checked)} style={{ accentColor: t.accent, cursor: "pointer", width: 13, height: 13 }} />
              Custom input
            </label>

            <button onClick={() => setCodes(p => ({ ...p, [codeKey]: lang.tmpl }))}
              style={{ ...iconBtnStyle(t), width: "auto", padding: "0 10px", gap: 5, fontSize: 12, fontFamily: ff }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.5" /></svg>
              Reset
            </button>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ flex: 1, minHeight: 0 }}>
              <Editor height="100%" theme={t.monacoTheme} language={lang.monaco} value={code} onChange={onCodeChange}
                options={{ fontSize: 14, fontFamily: fm, minimap: { enabled: false }, padding: { top: 16 }, scrollBeyondLastLine: false, lineNumbers: "on", renderLineHighlight: "line", cursorBlinking: "smooth", smoothScrolling: true, tabSize: 4, wordWrap: "off" }}
              />
            </div>
            {useCustom && (
              <div style={{ height: 144, borderTop: `1px solid ${t.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
                <div style={{ padding: "6px 14px", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: t.textMuted, borderBottom: `1px solid ${t.border}`, background: t.surface, fontFamily: ff }}>Custom Input (stdin)</div>
                <textarea value={customIn} onChange={e => setCustomIn(e.target.value)} placeholder="Paste your test input here…" spellCheck={false}
                  style={{ flex: 1, background: t.codeBg, color: t.text, border: "none", outline: "none", padding: "12px 14px", fontFamily: fm, fontSize: 13, resize: "none", lineHeight: 1.65, scrollbarWidth: "thin", scrollbarColor: `${t.scrollbar} transparent` }}
                />
              </div>
            )}
          </div>

          <div style={{ padding: "10px 12px", borderTop: `1px solid ${t.border}`, display: "flex", gap: 8, background: t.surface, flexShrink: 0 }}>
            <button onClick={runCode} disabled={running || submitting}
              onMouseEnter={e => { if (!running && !submitting) e.currentTarget.style.background = t.bgHover; }}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              style={{ flex: 1, height: 38, borderRadius: 8, border: `1px solid ${t.border}`, background: "transparent", color: running ? t.textMuted : t.text, fontWeight: 600, fontSize: 13, cursor: running || submitting ? "not-allowed" : "pointer", fontFamily: ff, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all .15s" }}>
              {running ? <><Spin c={t.textMuted} /> Running…</> : <><PlayIcon /> Run Code</>}
            </button>
            <button onClick={() => setConfirm(true)} disabled={running || submitting}
              onMouseEnter={e => { if (!running && !submitting) e.currentTarget.style.filter = "brightness(1.1)"; }}
              onMouseLeave={e => e.currentTarget.style.filter = "none"}
              style={{ flex: 2, height: 38, borderRadius: 8, border: "none", background: solved ? t.green : t.accent, color: "#fff", fontWeight: 700, fontSize: 13, cursor: running || submitting ? "not-allowed" : "pointer", fontFamily: ff, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all .15s", opacity: running || submitting ? 0.65 : 1 }}>
              {submitting ? <><Spin c="#fff" /> Judging…</> : <><SendIcon />{solved ? "Resubmit" : "Submit"}</>}
            </button>
          </div>
        </div>

        <DragHandle onStart={() => { dragging.current = "right"; document.body.style.cursor = "col-resize"; }} t={t} />

        <div style={{ width: rightW, display: "flex", flexDirection: "column", background: t.surface, borderLeft: `1px solid ${t.border}`, flexShrink: 0, minWidth: 0 }}>
          <div style={{ display: "flex", borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
            <button style={tab(rightTab === "testcase")} onClick={() => setRightTab("testcase")}>Testcase</button>
            <button style={tab(rightTab === "result")} onClick={() => setRightTab("result")}>Result</button>
            <button style={tab(rightTab === "submissions")} onClick={() => setRightTab("submissions")}>
              {`Submissions${probSubs.length ? ` (${probSubs.length})` : ""}`}
            </button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "thin", scrollbarColor: `${t.scrollbar} transparent` }}>
            {rightTab === "testcase" && <TestcasePane prob={prob} t={t} ff={ff} fm={fm} />}
            {rightTab === "result" && <ResultPane res={runRes} running={running} t={t} ff={ff} fm={fm} />}
            {rightTab === "submissions" && <SubsPane subs={probSubs} t={t} ff={ff} fm={fm} />}
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
      style={{ width: 5, cursor: "col-resize", background: hov ? t.accent + "55" : "transparent", flexShrink: 0, zIndex: 5, transition: "background .2s" }}
    />
  );
}

function ProblemPane({ prob, t, ff, fm }) {
  const rc = ratingStyle(prob.rating, t);
  return (
    <div style={{ padding: "24px 24px 40px", fontFamily: ff }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: t.text, margin: "0 0 12px", lineHeight: 1.3, letterSpacing: "-0.02em" }}>
        {prob.idx}. {prob.name}
      </h2>

      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: rc.text, background: rc.bg, padding: "3px 10px", borderRadius: 20 }}>{rc.label}</span>
        <span style={{ color: t.border }}>|</span>
        <span style={{ fontSize: 12, color: t.textMuted, fontFamily: fm }}>★ {prob.rating}</span>
        <span style={{ color: t.border }}>|</span>
        <span style={{ fontSize: 12, color: t.textMuted }}>Time: {prob.tl}</span>
        <span style={{ fontSize: 12, color: t.textMuted }}>Memory: {prob.ml}</span>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
        {prob.tags.map(tag => (
          <span key={tag} style={{ fontSize: 11, fontWeight: 500, color: t.tagText, background: t.tagBg, padding: "3px 10px", borderRadius: 20 }}>{tag}</span>
        ))}
      </div>

      <ProbSect title="Problem Statement" t={t} ff={ff}>
        <p style={{ fontSize: 14, color: t.textSub, margin: 0, whiteSpace: "pre-line", lineHeight: 1.85 }}>{prob.body}</p>
      </ProbSect>

      <ProbSect title="Input" t={t} ff={ff}>
        <p style={{ fontSize: 14, color: t.textSub, margin: 0, whiteSpace: "pre-line", lineHeight: 1.85 }}>{prob.inputFmt}</p>
      </ProbSect>

      <ProbSect title="Output" t={t} ff={ff}>
        <p style={{ fontSize: 14, color: t.textSub, margin: 0, lineHeight: 1.85 }}>{prob.outputFmt}</p>
      </ProbSect>

      <div style={{ marginBottom: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted, marginBottom: 14 }}>Examples</div>
        {prob.cases.map((c, i) => (
          <div key={i} style={{ marginBottom: i < prob.cases.length - 1 ? 20 : 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.textSub, marginBottom: 10 }}>Example {i + 1}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["Input", c.i], ["Output", c.o]].map(([label, val]) => (
                <div key={label} style={{ borderRadius: 9, border: `1px solid ${t.border}`, overflow: "hidden" }}>
                  <div style={{ padding: "6px 12px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: t.textMuted, background: t.bgSub, borderBottom: `1px solid ${t.border}` }}>{label}</div>
                  <pre style={{ margin: 0, padding: "10px 12px", fontSize: 13, color: t.text, fontFamily: fm, background: t.codeBg, lineHeight: 1.65, overflowX: "auto" }}>{val}</pre>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProbSect({ title, children, t, ff }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted, marginBottom: 10, fontFamily: ff }}>{title}</div>
      {children}
    </div>
  );
}

function RankingsPane({ board, me, probs, t, ff, fm }) {
  return (
    <div style={{ padding: 16, fontFamily: ff }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: t.textMuted, marginBottom: 14 }}>Live Standings</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.border}` }}>
              {["#", "Handle", ...probs.map(p => p.idx), "Solved", "Penalty"].map((h, i) => (
                <th key={i} style={{ padding: "7px 10px", fontWeight: 600, color: t.textMuted, textAlign: i === 0 || i > 1 + probs.length ? "center" : i === 1 ? "left" : "center", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {board.map((row, i) => {
              const isMe = row.h === me;
              const medal = ["🥇", "🥈", "🥉"][i];
              return (
                <tr key={row.h} style={{ borderBottom: `1px solid ${t.borderFaint}`, background: isMe ? t.accentBg : "transparent", transition: "background .15s" }}
                  onMouseEnter={e => { if (!isMe) e.currentTarget.style.background = t.bgHover; }}
                  onMouseLeave={e => e.currentTarget.style.background = isMe ? t.accentBg : "transparent"}
                >
                  <td style={{ padding: "10px", textAlign: "center", fontFamily: fm, fontSize: 13 }}>{medal || <span style={{ color: t.textMuted }}>{i + 1}</span>}</td>
                  <td style={{ padding: "10px" }}>
                    <div style={{ fontWeight: isMe ? 700 : 500, color: isMe ? t.accent : t.text }}>{row.h}</div>
                    <div style={{ fontSize: 11, color: t.textMuted }}>{row.f}</div>
                  </td>
                  {probs.map(p => (
                    <td key={p.idx} style={{ padding: "10px", textAlign: "center" }}>
                      {row.ac[p.idx]
                        ? <span style={{ fontSize: 11, fontWeight: 600, color: t.green, background: t.greenBg, padding: "2px 7px", borderRadius: 4, fontFamily: fm }}>+{row.ac[p.idx]}</span>
                        : <span style={{ color: t.textMuted }}>—</span>
                      }
                    </td>
                  ))}
                  <td style={{ padding: "10px", textAlign: "center", fontWeight: 700, fontFamily: fm, color: row.s > 0 ? t.text : t.textMuted }}>{row.s}</td>
                  <td style={{ padding: "10px", textAlign: "center", color: t.textSub, fontFamily: fm }}>{row.p || "—"}</td>
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
  const c = prob.cases[active];
  return (
    <div style={{ padding: 16, fontFamily: ff }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {prob.cases.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            padding: "5px 13px", borderRadius: 7, border: `1px solid ${active === i ? t.accent : t.border}`,
            background: active === i ? t.accentBg : "transparent",
            color: active === i ? t.accent : t.textSub,
            fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: ff, transition: "all .12s",
          }}>Case {i + 1}</button>
        ))}
      </div>
      {[["Input", c.i], ["Expected Output", c.o]].map(([label, val]) => (
        <div key={label} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: t.textMuted, marginBottom: 8 }}>{label}</div>
          <pre style={{ margin: 0, background: t.codeBg, border: `1px solid ${t.border}`, borderRadius: 9, padding: "12px 14px", fontSize: 13, color: t.text, fontFamily: fm, lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{val}</pre>
        </div>
      ))}
    </div>
  );
}

function ResultPane({ res, running, t, ff, fm }) {
  if (running) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 52, color: t.textSub, fontFamily: ff }}>
      <Spin c={t.accent} sz={28} />
      <span style={{ fontSize: 13 }}>Running your code…</span>
    </div>
  );
  if (!res) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 52, color: t.textMuted, fontFamily: ff, textAlign: "center" }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
      <span style={{ fontSize: 13 }}>Run your code to see results here</span>
    </div>
  );
  if (res.type === "custom") return (
    <div style={{ padding: 16, fontFamily: ff }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: t.textMuted, marginBottom: 10 }}>Output</div>
      <pre style={{ margin: 0, background: t.codeBg, border: `1px solid ${t.border}`, borderRadius: 9, padding: "14px", fontSize: 13, color: t.text, fontFamily: fm, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{res.out}</pre>
    </div>
  );

  const passed = res.cases.filter(c => c.pass).length;
  const total = res.cases.length;
  const allOk = passed === total;
  return (
    <div style={{ padding: 16, fontFamily: ff }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 10, background: allOk ? t.greenBg : t.redBg, border: `1px solid ${allOk ? t.green + "44" : t.red + "44"}`, marginBottom: 16 }}>
        {allOk
          ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.red} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        }
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: allOk ? t.green : t.red }}>
            {allOk ? "All testcases passed" : "Some testcases failed"}
          </div>
          <div style={{ fontSize: 12, color: t.textSub, marginTop: 2 }}>{passed} / {total} passed</div>
        </div>
      </div>

      {res.cases.map(c => (
        <div key={c.i} style={{ marginBottom: 10, borderRadius: 10, border: `1px solid ${c.pass ? t.green + "33" : t.red + "33"}`, overflow: "hidden" }}>
          <div style={{ padding: "9px 14px", display: "flex", alignItems: "center", gap: 8, background: c.pass ? t.greenBg : t.redBg }}>
            {c.pass
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.red} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            }
            <span style={{ fontWeight: 700, fontSize: 13, color: c.pass ? t.green : t.red }}>Testcase {c.i}</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: t.textMuted, fontFamily: fm }}>{c.ms} ms</span>
          </div>
          {!c.pass && (
            <div style={{ padding: "12px 14px", display: "grid", gap: 10 }}>
              {[["Input", c.input], ["Expected", c.expected], ["Got", c.got]].map(([lbl, val]) => (
                <div key={lbl}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: t.textMuted, marginBottom: 5 }}>{lbl}</div>
                  <pre style={{ margin: 0, fontSize: 12, color: t.text, fontFamily: fm, lineHeight: 1.5 }}>{val}</pre>
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
  if (!subs.length) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 52, color: t.textMuted, fontFamily: ff, textAlign: "center" }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
      <span style={{ fontSize: 13 }}>No submissions yet for this problem</span>
    </div>
  );
  return (
    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 6, fontFamily: ff }}>
      {subs.map(s => {
        const vi = verdictInfo(s.verdict, t);
        const isOpen = open === s.id;
        const isPending = s.verdict === "Pending";
        return (
          <div key={s.id} style={{ borderRadius: 10, border: `1px solid ${s.verdict === "Accepted" ? t.green + "44" : t.border}`, overflow: "hidden" }}>
            <div onClick={() => !isPending && setOpen(isOpen ? null : s.id)}
              style={{ padding: "11px 14px", cursor: isPending ? "default" : "pointer", display: "flex", alignItems: "center", gap: 10, background: s.verdict === "Accepted" ? t.greenBg : t.bgSub, transition: "background .12s" }}
              onMouseEnter={e => { if (!isPending && s.verdict !== "Accepted") e.currentTarget.style.background = t.bgHover; }}
              onMouseLeave={e => e.currentTarget.style.background = s.verdict === "Accepted" ? t.greenBg : t.bgSub}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: vi.c, background: vi.bg, padding: "3px 8px", borderRadius: 5, fontFamily: fm, minWidth: 32, textAlign: "center", display: "inline-flex", alignItems: "center", gap: 4 }}>
                {isPending && <Spin c={vi.c} sz={10} />}
                {vi.short}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: isPending ? t.textMuted : vi.c }}>{s.verdict}</div>
                <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>{s.lang} · {s.time} · {s.mem}</div>
              </div>
              <span style={{ fontSize: 11, color: t.textMuted, fontFamily: fm, flexShrink: 0 }}>{s.at}</span>
              {!isPending && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              )}
            </div>
            {isOpen && !isPending && (
              <div style={{ borderTop: `1px solid ${t.border}` }}>
                <div style={{ padding: "6px 14px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: t.textMuted, borderBottom: `1px solid ${t.border}`, background: t.surface }}>Submitted Code</div>
                <pre style={{ margin: 0, padding: "14px", fontSize: 12, color: t.text, fontFamily: fm, background: t.codeBg, maxHeight: 280, overflowY: "auto", overflowX: "auto", lineHeight: 1.65, scrollbarWidth: "thin", scrollbarColor: `${t.scrollbar} transparent` }}>{s.code}</pre>
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
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" style={{ animation: "_spin .75s linear infinite", flexShrink: 0 }}>
      <style>{`@keyframes _spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}
function PlayIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
}
function SendIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
}
function iconBtnStyle(t) {
  return { background: "transparent", border: `1px solid ${t.border}`, cursor: "pointer", color: t.textSub, width: 32, height: 32, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .15s" };
}