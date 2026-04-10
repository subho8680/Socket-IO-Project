import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, Progress } from "antd";
import {
  PlayCircleOutlined,
  StopOutlined,
  TrophyOutlined,
  TeamOutlined,
  WifiOutlined,
  PauseOutlined,
  CaretRightOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import DashboardLayout from "../../components/common/DashboardLayout";
import { OPTION_COLORS, OPTION_LABELS } from "../../data/mockData";
import { useSocket } from "../../Services/Usesocket";
import { useAuth } from "../../context/AuthContext";
function LiveBadge() {
  return (
    <span style={styles.liveBadge}>
      <span style={styles.liveDot} />
      Live
    </span>
  );
}

function PausedBadge() {
  return <span style={styles.pausedBadge}>⏸ Paused</span>;
}

function StatusBadge({ icon, children, style = {} }) {
  return (
    <span style={{ ...styles.badge, ...style }}>
      {icon && <span style={{ fontSize: 12 }}>{icon}</span>}
      {children}
    </span>
  );
}

function TimerRing({ timeLeft, total }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? timeLeft / total : 0;
  const offset = circ - circ * pct;
  const color =
    timeLeft > 15 ? "#378add" : timeLeft > 8 ? "#ba7517" : "#a32d2d";

  return (
    <div style={styles.timerWrap}>
      <svg
        width="76"
        height="76"
        viewBox="0 0 76 76"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx="38"
          cy="38"
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="7"
        />
        <circle
          cx="38"
          cy="38"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s" }}
        />
      </svg>
      <div style={styles.timerInner}>
        <span style={{ ...styles.timerNum, color }}>{timeLeft}</span>
        <span style={styles.timerLbl}>sec</span>
      </div>
    </div>
  );
}

const OPT_BG = ["#e6f1fb", "#e1f5ee", "#faeeda", "#fbeaf0"];
const OPT_COLOR = ["#0c447c", "#085041", "#633806", "#72243e"];

function OptionCard({ opt, idx, phase, correctAnswer }) {
  const isCorrect = phase === "reveal" && idx === correctAnswer;
  return (
    <div
      style={{
        ...styles.optionCard,
        ...(isCorrect ? styles.optionCorrect : {}),
      }}
    >
      <div
        style={{
          ...styles.optLabel,
          background: OPT_BG[idx] || "#e6f1fb",
          color: OPT_COLOR[idx] || "#0c447c",
        }}
      >
        {OPTION_LABELS[idx] || String.fromCharCode(65 + idx)}
      </div>
      <span style={styles.optText}>{opt}</span>
      {isCorrect && <span style={styles.optCheck}>✓</span>}
    </div>
  );
}

function LbRow({ entry, index }) {
  const medals = ["🥇", "🥈", "🥉"];
  const isTop = index < 3;
  return (
    <div style={{ ...styles.lbRow, ...(isTop ? styles.lbRowTop : {}) }}>
      <div style={styles.lbRank}>
        {isTop ? (
          medals[index]
        ) : (
          <span
            style={{ fontFamily: "monospace", fontSize: 12, color: "#888" }}
          >
            #{index + 1}
          </span>
        )}
      </div>
      <div style={styles.avatarMd}>{entry.name?.[0]?.toUpperCase() || "?"}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={styles.lbName}>{entry.name}</div>
        {entry.streak > 1 && (
          <div style={styles.lbStreak}>🔥 {entry.streak} streak</div>
        )}
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={styles.lbScore}>{(entry.score || 0).toLocaleString()}</div>
        <div style={styles.lbAcc}>
          {entry.correctAnswers || 0}/
          {(entry.correctAnswers || 0) + (entry.wrongAnswers || 0)}
        </div>
      </div>
    </div>
  );
}

export default function TeacherQuizRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase] = useState("lobby");
  const [students, setStudents] = useState([]);
  const [curQues, setCurQues] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [quizEnded, setQuizEnded] = useState(false);

  const { on, startQuiz, pauseQuiz, resumeQuiz, endQuiz, rejoinAsTeacher } =
    useSocket();

  useEffect(() => {
    const cleanups = [];

    cleanups.push(
      on("student-joined", ({ studentName, studentList }) => {
        setStudents(studentList || []);
        toast.success(`${studentName} joined`);
      }),
    );
    cleanups.push(
      on("quiz-started", () => {
        setPhase("question");
        setAnsweredCount(0);
      }),
    );
    cleanups.push(
      on(
        "new-question",
        ({
          questionIndex,
          question,
          options,
          timeLimit,
          totalQuestions,
          questionNumber,
        }) => {
          setCurQues({
            questionIndex,
            question,
            options,
            timeLimit,
            totalQuestions,
            questionNumber,
            correctAnswer: null,
          });
          setPhase("question");
          setTimeLeft(timeLimit);
          setAnsweredCount(0);
          setIsPaused(false);
        },
      ),
    );
    cleanups.push(on("timer-tick", ({ timeLeft: t }) => setTimeLeft(t)));
    cleanups.push(
      on("time-up", ({ correctAnswer, leaderboard: lb }) => {
        setCurQues((prev) => ({ ...prev, correctAnswer }));
        setLeaderboard(lb || []);
        setPhase("reveal");
      }),
    );
    cleanups.push(
      on("leaderboard-update", (data) => {
        setLeaderboard(data || []);
        setAnsweredCount((p) => p + 1);
      }),
    );
    cleanups.push(on("quiz-paused", () => setIsPaused(true)));
    cleanups.push(on("quiz-resumed", () => setIsPaused(false)));
    cleanups.push(
      on("quiz-ended", ({ leaderboard: lb }) => {
        setLeaderboard(lb || []);
        setQuizEnded(true);
        setPhase("ended");
      }),
    );
    cleanups.push(
      on("joined-list", ({ studentList }) => setStudents(studentList || [])),
    );
    cleanups.push(
      on(
        "rejoin-success",
        ({ studentList, leaderboard: lb, currentQuestionDetails: cq }) => {
          if (cq) {
            setCurQues({
              questionIndex: cq.questionIndex,
              question: cq.question,
              options: cq.options,
              timeLimit: cq.timeLeft,
              totalQuestions: cq.totalQuestions,
              questionNumber: cq.questionNumber,
              correctAnswer: null,
            });
            setLeaderboard(lb || []);
            setPhase("question");
            setTimeLeft(cq.timeLeft || 30);
          }
          setStudents(studentList || []);
        },
      ),
    );

    return () => cleanups.forEach((fn) => fn?.());
  }, [on]);

  useEffect(() => {
    rejoinAsTeacher(roomId);
  }, []);

  const handleStart = () => startQuiz(roomId);
  const handlePause = () => pauseQuiz(roomId);
  const handleResume = () => resumeQuiz(roomId);
  const handleEnd = () => endQuiz(roomId);
  const handleViewResults = () =>
    navigate(`/teacher/room/${roomId}/results`, { state: { leaderboard } });

  const answeredPct =
    students.length > 0
      ? Math.round((answeredCount / students.length) * 100)
      : 0;
  const isActive = phase === "question" || phase === "reveal";

  return (
    <DashboardLayout>
      <div style={styles.root}>
        <div className="max-w-7xl mx-auto">
          <div style={styles.topbar}>
            <div style={styles.topbarLeft}>
              <div style={styles.roomPill}>{roomId}</div>
              {isActive && <LiveBadge />}
              {isPaused && <PausedBadge />}
              <StatusBadge icon={<TeamOutlined />}>
                <strong style={{ marginLeft: 2 }}>{students.length}</strong>
                &nbsp;students
              </StatusBadge>
              <StatusBadge
                icon={<WifiOutlined />}
                style={{
                  color: "#3b6d11",
                  background: "#eaf3de",
                  borderColor: "#97c459",
                }}
              >
                Connected
              </StatusBadge>
            </div>

            <div style={styles.topbarRight}>
              {phase === "lobby" && (
                <button
                  style={{
                    ...styles.btn,
                    ...styles.btnGreen,
                    ...(students.length === 0 ? styles.btnDisabled : {}),
                  }}
                  onClick={handleStart}
                  disabled={students.length === 0}
                >
                  <PlayCircleOutlined /> Start quiz
                </button>
              )}
              {isActive && !quizEnded && (
                <>
                  {!isPaused ? (
                    <button
                      style={{ ...styles.btn, ...styles.btnAmber }}
                      onClick={handlePause}
                    >
                      <PauseOutlined /> Pause
                    </button>
                  ) : (
                    <button
                      style={{ ...styles.btn, ...styles.btnGreen }}
                      onClick={handleResume}
                    >
                      <CaretRightOutlined /> Resume
                    </button>
                  )}
                  <button
                    style={{ ...styles.btn, ...styles.btnRed }}
                    onClick={handleEnd}
                  >
                    <StopOutlined /> Stop quiz
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={styles.grid}>
            <div style={styles.mainCol}>
              {phase === "lobby" && (
                <div style={styles.card}>
                  <div style={styles.sectionLabel}>Room code</div>
                  <div style={styles.lobbyCode}>{roomId}</div>
                  <div style={styles.sectionLabel}>
                    Students joined ({students.length})
                  </div>
                  {students.length === 0 ? (
                    <p style={styles.muted}>Waiting for students to join…</p>
                  ) : (
                    <div style={styles.chipWrap}>
                      {students.slice(0, 10).map((s, i) => (
                        <div key={i} style={styles.chip}>
                          <div style={styles.avatarSm}>
                            {s.name?.[0]?.toUpperCase()}
                          </div>
                          {s.name}
                        </div>
                      ))}
                      {students.length > 10 && (
                        <div style={styles.chip}>
                          +{students.length - 10} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {isActive && curQues && (
                <div style={styles.card}>
                  <div style={styles.qMeta}>
                    <div style={{ flex: 1 }}>
                      <div style={styles.sectionLabel}>
                        Question {curQues.questionNumber} /{" "}
                        {curQues.totalQuestions}
                      </div>
                      <div style={styles.qText}>{curQues.question}</div>
                    </div>
                    {phase === "question" && !isPaused && (
                      <TimerRing
                        timeLeft={timeLeft}
                        total={curQues.timeLimit}
                      />
                    )}
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <div style={styles.progressBg}>
                      <div
                        style={{
                          ...styles.progressFill,
                          width: `${answeredPct}%`,
                        }}
                      />
                    </div>
                    <div style={styles.progressMeta}>
                      <span>{answeredCount} answered</span>
                      <span>{students.length} total</span>
                    </div>
                  </div>

                  <div style={styles.optionsGrid}>
                    {curQues.options?.map((opt, i) => (
                      <OptionCard
                        key={i}
                        opt={opt}
                        idx={i}
                        phase={phase}
                        correctAnswer={curQues.correctAnswer}
                      />
                    ))}
                  </div>

                  {phase === "reveal" && (
                    <div style={styles.revealBanner}>
                      <span>✓</span> Time's up — correct answer highlighted
                      above
                    </div>
                  )}
                  {isPaused && (
                    <div style={styles.pauseBanner}>
                      ⏸ Quiz paused — resume to continue
                    </div>
                  )}
                </div>
              )}

              {phase === "ended" && (
                <div
                  style={{
                    ...styles.card,
                    textAlign: "center",
                    padding: "56px 24px",
                  }}
                >
                  <div style={styles.trophyCircle}>
                    <TrophyOutlined
                      style={{ fontSize: 28, color: "#ba7517" }}
                    />
                  </div>
                  <div
                    style={{ fontSize: 20, fontWeight: 500, marginBottom: 8 }}
                  >
                    Quiz complete!
                  </div>
                  <div style={{ ...styles.muted, marginBottom: 24 }}>
                    All questions answered. Great session!
                  </div>
                  <button
                    style={{ ...styles.btn, ...styles.btnTeal }}
                    onClick={handleViewResults}
                  >
                    <TrophyOutlined /> View full results
                  </button>
                </div>
              )}
            </div>

            <div style={styles.sideCol}>
              <div style={{ ...styles.card, position: "sticky", top: 24 }}>
                <div style={styles.lbHeader}>
                  <div style={styles.lbTitle}>
                    <span>🏆</span> Live leaderboard
                  </div>
                  {isActive && <span style={styles.lbLivePill}>live</span>}
                </div>

                <div style={styles.statGrid}>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Students</div>
                    <div style={styles.statVal}>{students.length}</div>
                  </div>
                  <div style={styles.statCard}>
                    <div style={styles.statLabel}>Answered</div>
                    <div style={styles.statVal}>{answeredPct}%</div>
                  </div>
                </div>

                <div style={styles.lbList}>
                  {leaderboard.length === 0 ? (
                    <div
                      style={{
                        ...styles.muted,
                        textAlign: "center",
                        padding: "32px 0",
                      }}
                    >
                      Leaderboard updates as students answer
                    </div>
                  ) : (
                    leaderboard.map((entry, i) => (
                      <LbRow
                        key={entry.socketId || i}
                        entry={entry}
                        index={i}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

const styles = {
  root: {
    minHeight: "100vh",
    background: "#f5f5f0",
    padding: "24px",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  topbarLeft: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  topbarRight: { display: "flex", gap: 8, flexWrap: "wrap" },
  roomPill: {
    background: "#fff",
    border: "0.5px solid #e2e2da",
    borderRadius: 8,
    padding: "7px 18px",
    fontFamily: "monospace",
    fontSize: 15,
    fontWeight: 500,
    color: "#185fa5",
    letterSpacing: "0.12em",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "0.5px solid #e2e2da",
    borderRadius: 20,
    padding: "5px 12px",
    fontSize: 12,
    background: "#fff",
    color: "#666",
  },
  liveBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "0.5px solid #f09595",
    borderRadius: 20,
    padding: "5px 12px",
    fontSize: 12,
    background: "#fcebeb",
    color: "#a32d2d",
    fontWeight: 500,
  },
  liveDot: {
    display: "inline-block",
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#e24b4a",
    animation: "none",
  },
  pausedBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "0.5px solid #ef9f27",
    borderRadius: 20,
    padding: "5px 12px",
    fontSize: 12,
    background: "#faeeda",
    color: "#854f0b",
    fontWeight: 500,
  },
  btn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    border: "0.5px solid #d3d1c7",
    borderRadius: 8,
    padding: "8px 18px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    background: "#fff",
    color: "#2c2c2a",
    transition: "background 0.15s",
  },
  btnGreen: { background: "#eaf3de", borderColor: "#97c459", color: "#3b6d11" },
  btnAmber: { background: "#faeeda", borderColor: "#ef9f27", color: "#854f0b" },
  btnRed: { background: "#fcebeb", borderColor: "#f09595", color: "#a32d2d" },
  btnTeal: { background: "#e1f5ee", borderColor: "#5dcaa5", color: "#0f6e56" },
  btnDisabled: { opacity: 0.5, cursor: "not-allowed" },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: 20,
  },
  mainCol: { display: "flex", flexDirection: "column", gap: 16 },
  sideCol: {},
  card: {
    background: "#fff",
    border: "0.5px solid #e2e2da",
    borderRadius: 12,
    padding: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.08em",
    color: "#888",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  muted: { fontSize: 13, color: "#888", padding: "6px 0" },
  lobbyCode: {
    fontFamily: "monospace",
    fontSize: 52,
    fontWeight: 500,
    letterSpacing: "0.25em",
    color: "#185fa5",
    textAlign: "center",
    padding: "32px 0",
    border: "0.5px dashed #85b7eb",
    borderRadius: 10,
    background: "#e6f1fb",
    marginBottom: 20,
  },
  chipWrap: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    background: "#f5f5f0",
    border: "0.5px solid #e2e2da",
    borderRadius: 20,
    padding: "5px 12px",
    fontSize: 13,
    color: "#2c2c2a",
  },
  avatarSm: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    background: "#b5d4f4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 500,
    color: "#0c447c",
    flexShrink: 0,
  },
  avatarMd: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "#b5d4f4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 500,
    color: "#0c447c",
    flexShrink: 0,
  },
  qMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  qText: {
    fontSize: 18,
    fontWeight: 500,
    color: "#2c2c2a",
    lineHeight: 1.5,
  },
  timerWrap: {
    position: "relative",
    width: 76,
    height: 76,
    flexShrink: 0,
  },
  timerInner: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  timerNum: {
    fontSize: 22,
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1,
  },
  timerLbl: {
    fontSize: 10,
    letterSpacing: "0.1em",
    color: "#888",
    textTransform: "uppercase",
  },
  progressBg: {
    height: 6,
    background: "#f0ede6",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    background: "#378add",
    transition: "width 0.5s",
  },
  progressMeta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 11,
    color: "#888",
    marginTop: 5,
  },
  optionsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  optionCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    padding: "14px 16px",
    border: "0.5px solid #e2e2da",
    borderRadius: 10,
    background: "#fff",
    transition: "border-color 0.2s",
  },
  optionCorrect: {
    borderColor: "#5dcaa5",
    background: "#e1f5ee",
  },
  optLabel: {
    width: 30,
    height: 30,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 500,
    flexShrink: 0,
  },
  optText: {
    fontSize: 13,
    color: "#2c2c2a",
    lineHeight: 1.5,
    paddingTop: 4,
    flex: 1,
  },
  optCheck: {
    fontSize: 16,
    color: "#1d9e75",
    flexShrink: 0,
    paddingTop: 4,
  },
  revealBanner: {
    marginTop: 16,
    padding: "11px 16px",
    background: "#e1f5ee",
    border: "0.5px solid #5dcaa5",
    borderRadius: 8,
    fontSize: 13,
    color: "#0f6e56",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  pauseBanner: {
    marginTop: 16,
    padding: "11px 16px",
    background: "#faeeda",
    border: "0.5px solid #ef9f27",
    borderRadius: 8,
    fontSize: 13,
    color: "#854f0b",
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  trophyCircle: {
    width: 64,
    height: 64,
    borderRadius: "50%",
    background: "#faeeda",
    border: "0.5px solid #fac775",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 16px",
  },
  lbHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  lbTitle: {
    fontSize: 14,
    fontWeight: 500,
    color: "#2c2c2a",
    display: "flex",
    alignItems: "center",
    gap: 7,
  },
  lbLivePill: {
    fontSize: 11,
    background: "#fcebeb",
    color: "#a32d2d",
    border: "0.5px solid #f09595",
    borderRadius: 12,
    padding: "3px 10px",
    fontWeight: 500,
  },
  statGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    background: "#f5f5f0",
    borderRadius: 8,
    padding: "12px 14px",
  },
  statLabel: {
    fontSize: 11,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: 4,
  },
  statVal: {
    fontSize: 22,
    fontWeight: 500,
    color: "#2c2c2a",
    fontVariantNumeric: "tabular-nums",
  },
  lbList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    maxHeight: 480,
    overflowY: "auto",
  },
  lbRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 8,
    border: "0.5px solid #e2e2da",
    background: "#fff",
  },
  lbRowTop: {
    background: "#faeeda",
    borderColor: "#fac775",
  },
  lbRank: {
    width: 26,
    textAlign: "center",
    flexShrink: 0,
  },
  lbName: {
    fontSize: 13,
    fontWeight: 500,
    color: "#2c2c2a",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  lbStreak: {
    fontSize: 11,
    color: "#ba7517",
    marginTop: 1,
  },
  lbScore: {
    fontSize: 15,
    fontWeight: 500,
    color: "#2c2c2a",
    fontVariantNumeric: "tabular-nums",
  },
  lbAcc: {
    fontSize: 11,
    color: "#888",
    textAlign: "right",
    marginTop: 1,
  },
};
