import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Avatar, Tag, Progress, message } from "antd";
import {
  PlayCircleOutlined,
  StepForwardOutlined,
  StopOutlined,
  TrophyOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  CrownOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import DashboardLayout from "../../components/common/DashboardLayout";
import {
  mockQuestions,
  mockLeaderboard,
  OPTION_COLORS,
  OPTION_LABELS,
} from "../../data/mockData";
import { useSocket } from "../../Services/Usesocket";
const QUESTION_TIME = 30;

function LiveBadge() {
  return (
    <span
      className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{
        background: "rgba(16,185,129,0.15)",
        border: "1px solid rgba(16,185,129,0.3)",
        color: "#10b981",
      }}
    >
      <span className="w-2 h-2 rounded-full bg-success animate-pulse inline-block" />
      LIVE
    </span>
  );
}

function TimerRing({ timeLeft, total }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const pct = timeLeft / total;
  const offset = circ * (1 - pct);
  const color =
    timeLeft > 10 ? "#7c3aed" : timeLeft > 5 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="112" height="112">
        <circle
          cx="56"
          cy="56"
          r={r}
          fill="none"
          stroke="#1e1e35"
          strokeWidth="6"
        />
        <circle
          cx="56"
          cy="56"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
        />
      </svg>
      <div className="text-center">
        <div className="text-3xl font-black text-txt-primary" style={{ color }}>
          {timeLeft}
        </div>
        <div className="text-xs text-txt-muted">secs</div>
      </div>
    </div>
  );
}

function LeaderboardRow({ entry, index }) {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
      style={{
        background: index < 3 ? `rgba(124,58,237,0.07)` : "transparent",
        border:
          index < 3
            ? "1px solid rgba(124,58,237,0.15)"
            : "1px solid transparent",
      }}
    >
      <div className="w-7 text-center text-sm font-bold flex-shrink-0">
        {index < 3 ? (
          medals[index]
        ) : (
          <span className="text-txt-muted text-xs">#{index + 1}</span>
        )}
      </div>
      <Avatar
        size={28}
        style={{
          background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
          fontSize: 11,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {entry.avatar}
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-txt-primary truncate">
          {entry.name}
        </div>
        {entry.streak > 1 && (
          <div className="text-xs text-warning">🔥 {entry.streak} streak</div>
        )}
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-bold text-txt-primary text-sm">
          {entry.score.toLocaleString()}
        </div>
        <div className="text-xs text-txt-muted">
          {entry.correct}/{entry.answered}
        </div>
      </div>
    </div>
  );
}

export default function TeacherQuizRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [phase, setPhase] = useState("lobby");
  const [qIndex, setQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [answeredCount, setAnsweredCount] = useState(0);
  const timerRef = useRef(null);
  const questions = mockQuestions;
  const [totStudent, settotStudent] = useState(0)
  const TOTAL_STUDENTS = 24;
  const { on, nextQuestion } = useSocket();
  const currentQ = questions[qIndex];
  const [totTimeLeft, settotTimeLeft] = useState(0)
  const [curQues, setcurQues] = useState({})
  useEffect(() => {
    const newJoinee = on("student-joined",({studentName,totalStudents})=>{
        settotStudent(totalStudents);
        toast.success(`${studentName} joined`);
    })
    const newQues = on("new-question",({questionIndex,question,options,timeLimit,totalQuestions})=>{
        setcurQues({
            question:question,
            options:options,
            timeLimit:timeLimit,
            totalQuestions:totalQuestions,
            questionIndex:questionIndex
        })
        message.success("New Question Arrived")
    })
    const timeLeft = on("timer-tick",({timeLeft})=>{
        settotTimeLeft(timeLeft)
    })
    return ()=>{
        newJoinee(),
        newQues(),
        timeLeft()
    }
  }, [on])
  
  useEffect(() => {
    if (phase === "question") {
      setTimeLeft(QUESTION_TIME);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            setPhase("results");
            return 0;
          }
          if (t <= 20)
            setAnsweredCount((c) =>
              Math.min(c + Math.floor(Math.random() * 3), TOTAL_STUDENTS),
            );
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, qIndex]);

  const handleStart = () => {
    setPhase("question");
    setAnsweredCount(2);
    message.success("Quiz started! Broadcasting to students...");
  };
  const handleNextQ = () => {
    if (qIndex < questions.length - 1) {
      setQIndex(qIndex + 1);
      setPhase("question");
      setAnsweredCount(0);
    } else {
      setPhase("ended");
    }
  };
  const handleEndQuiz = () => {
    clearInterval(timerRef.current);
    navigate(`/teacher/room/${roomId}/results`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="px-3 py-1.5 rounded-lg font-mono text-sm font-bold"
              style={{
                background: "#0d0d18",
                border: "1px solid #1e1e35",
                color: "#a78bfa",
                letterSpacing: "0.1em",
              }}
            >
              {roomId}
            </div>
            {phase !== "lobby" && phase !== "ended" && <LiveBadge />}
            <span className="flex items-center gap-1.5 text-xs text-txt-secondary">
              <TeamOutlined /> {TOTAL_STUDENTS} students
            </span>
            <span className="flex items-center gap-1.5 text-xs text-success">
              <WifiOutlined /> Connected
            </span>
          </div>
          <div className="flex gap-2">
            {phase === "lobby" && (
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={handleStart}
                style={{
                  background: "linear-gradient(135deg,#10b981,#059669)",
                  border: "none",
                  fontWeight: 700,
                  borderRadius: 10,
                }}
              >
                Start Quiz
              </Button>
            )}
            {phase === "results" && qIndex < questions.length - 1 && (
              <Button
                type="primary"
                size="large"
                icon={<StepForwardOutlined />}
                onClick={handleNextQ}
                style={{
                  background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
                  border: "none",
                  fontWeight: 700,
                  borderRadius: 10,
                }}
              >
                Next Question ({qIndex + 2}/{questions.length})
              </Button>
            )}
            {(phase === "results" && qIndex === questions.length - 1) ||
            phase === "question" ? (
              <Button
                size="large"
                danger
                icon={<StopOutlined />}
                onClick={handleEndQuiz}
                style={{ borderRadius: 10, fontWeight: 600 }}
              >
                End Quiz
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {phase === "lobby" && (
              <div
                className="p-8 rounded-2xl text-center animate-fade-up"
                style={{ background: "#12121f", border: "1px solid #1e1e35" }}
              >
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: "rgba(124,58,237,0.15)",
                    border: "1px solid rgba(124,58,237,0.3)",
                  }}
                >
                  <TeamOutlined style={{ fontSize: 36, color: "#a78bfa" }} />
                </div>
                <h2 className="text-xl font-bold text-txt-primary mb-2">
                  Waiting for students...
                </h2>
                <p className="text-txt-secondary text-sm mb-6">
                  Share the room code with your students
                </p>
                <div
                  className="inline-block px-8 py-4 rounded-2xl mb-6"
                  style={{
                    background: "#0d0d18",
                    border: "2px dashed #1e1e35",
                  }}
                >
                  <div className="font-mono text-4xl font-black text-white tracking-widest">
                    {roomId}
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-txt-secondary">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse inline-block" />
                  <span className="font-semibold text-txt-primary">
                    {TOTAL_STUDENTS}
                  </span>{" "}
                  students joined
                </div>
              </div>
            )}

            {(phase === "question" || phase === "results") && currentQ && (
              <div
                className="p-6 rounded-2xl animate-fade-in"
                style={{ background: "#12121f", border: "1px solid #1e1e35" }}
              >
                <div className="flex items-center justify-between mb-5">
                  <Tag
                    style={{
                      background: "rgba(124,58,237,0.2)",
                      borderColor: "rgba(124,58,237,0.4)",
                      color: "#a78bfa",
                    }}
                  >
                    Question {qIndex + 1} of {questions.length}
                  </Tag>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-txt-secondary">
                      <ThunderboltOutlined /> {answeredCount}/{TOTAL_STUDENTS}{" "}
                      answered
                    </span>
                    {phase === "question" && (
                      <TimerRing timeLeft={totTimeLeft} total={curQues.timeLimit} />
                    )}
                    {phase === "results" && (
                      <span
                        className="px-3 py-1 rounded-lg text-sm font-bold"
                        style={{
                          background: "rgba(16,185,129,0.2)",
                          color: "#10b981",
                          border: "1px solid rgba(16,185,129,0.3)",
                        }}
                      >
                        Time's up!
                      </span>
                    )}
                  </div>
                </div>

                <h2 className="text-lg font-bold text-txt-primary mb-5 leading-relaxed">
                  {curQues.question}
                </h2>

                <Progress
                  percent={Math.round((answeredCount / TOTAL_STUDENTS) * 100)}
                  size="small"
                  strokeColor={{ from: "#7c3aed", to: "#06b6d4" }}
                  showInfo={false}
                  className="mb-5"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQ.options.map((opt, ind) => (
                    <div
                      key={ind}
                      className="flex items-center gap-3 p-4 rounded-xl"
                      style={{
                        background:
                          phase === "results" && ind === currentQ.correct
                            ? "rgba(16,185,129,0.12)"
                            : "#0d0d18",
                        border: `1.5px solid ${phase === "results" && ind === currentQ.correct ? "#10b981" : "#1e1e35"}`,
                      }}
                    >
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{
                          background: OPTION_COLORS[ind] + "25",
                          color: OPTION_COLORS[ind],
                        }}
                      >
                        {OPTION_LABELS[ind]}
                      </span>
                      <span className="text-sm text-txt-primary font-medium">
                        {opt}
                      </span>
                      {phase === "results" && ind === currentQ.correct && (
                        <span className="ml-auto text-success text-sm font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {phase === "ended" && (
              <div
                className="p-10 rounded-2xl text-center animate-fade-up"
                style={{ background: "#12121f", border: "1px solid #1e1e35" }}
              >
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-txt-primary mb-2">
                  Quiz Complete!
                </h2>
                <p className="text-txt-secondary text-sm mb-6">
                  All {questions.length} questions done. Ready to see results?
                </p>
                <Button
                  type="primary"
                  size="large"
                  icon={<TrophyOutlined />}
                  onClick={handleEndQuiz}
                  style={{
                    background: "linear-gradient(135deg,#f59e0b,#d97706)",
                    border: "none",
                    height: 48,
                    paddingInline: 36,
                    fontWeight: 700,
                    borderRadius: 12,
                  }}
                >
                  View Full Results
                </Button>
              </div>
            )}
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <div
              className="p-5 rounded-2xl sticky top-20"
              style={{ background: "#12121f", border: "1px solid #1e1e35" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <TrophyOutlined style={{ color: "#f59e0b" }} />
                <h3 className="font-bold text-txt-primary text-sm">
                  Live Leaderboard
                </h3>
                {phase !== "lobby" && (
                  <span
                    className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      background: "rgba(124,58,237,0.2)",
                      color: "#a78bfa",
                    }}
                  >
                    LIVE
                  </span>
                )}
              </div>
              <div className="space-y-1.5 max-h-[520px] overflow-auto">
                {mockLeaderboard.map((entry, i) => (
                  <LeaderboardRow key={entry.name} entry={entry} index={i} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
