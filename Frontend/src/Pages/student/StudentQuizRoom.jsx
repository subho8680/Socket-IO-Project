import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, Progress, Tag, Badge } from "antd";
import {
  TrophyOutlined,
  ThunderboltOutlined,
  CheckOutlined,
  CloseOutlined,
  FireOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { OPTION_COLORS, OPTION_LABELS } from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/common/Logo";
import { useSocket } from "../../Services/Usesocket";
import { toast } from "react-toastify";

export default function StudentQuizRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { on, submitAnswer,giveList } = useSocket();
  const myName = user?.user?.name;

  const [phase, setPhase] = useState("waiting");
  const [studentList, setStudentList] = useState([]);
  const [curQues, setCurQues] = useState(null);
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [myRank, setMyRank] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(null);
  useEffect(() => {
    giveList(roomId)
  }, [])
  
  useEffect(() => {
    const offJoinedList = on("joined-list", ({ studentList }) => {
      setStudentList(studentList);
    });
    const getList = on("take-list",({listStu})=>{
      setStudentList(listStu)
    })
    const onSuccess = on("join-success",({studentList})=>{
      setStudentList(studentList)
    })
    const offQuizStarted = on("quiz-started", ({ totalQuestions, message }) => {
      setTotalQuestions(totalQuestions);
      toast.success(message);
    });

    const offQuestion = on("new-question", ({
      questionIndex, question, options,
      timeLimit, totalQuestions, questionNumber,
    }) => {
      setCurQues({ questionIndex, question, options, timeLimit, questionNumber });
      setTotalQuestions(totalQuestions);
      setSelected(null);
      setCorrectAnswer(null);
      setAnsweredCorrectly(null);
      setPointsEarned(0);
      setTimeLeft(timeLimit);
      setIsPaused(false);
      setPhase("question");
    });

    const offTick = on("timer-tick", ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    });

    const offAnswerReceived = on("answer-received", ({ isCorrect, pointsEarned, totalScore }) => {
      setAnsweredCorrectly(isCorrect);
      setPointsEarned(pointsEarned);
      setScore(totalScore);
      setStreak(prev => isCorrect ? prev + 1 : 0);
    });

    const offTimeUp = on("time-up", ({ correctAnswer, leaderboard }) => {
      setCorrectAnswer(correctAnswer);
      setPhase("reveal");
      const me = leaderboard.find(s => s.name === myName);
      if (me) setMyRank(me.rank);
    });

    const offLeaderboard = on("leaderboard-update", (leaderboard) => {
      const me = leaderboard.find(s => s.name === myName);
      if (me) { setMyRank(me.rank); setScore(me.score); }
    });

    const offAlreadyAnswered = on("already-answered", () => { setPhase("answered"); });
    const offTooLate = on("answer-too-late", () => { });
    const offPaused = on("quiz-paused", () => { setIsPaused(true); toast.warning("Quiz paused by teacher"); });
    const offResumed = on("quiz-resumed", () => { setIsPaused(false); toast.success("Quiz resumed!"); });

    const offEnded = on("quiz-ended", ({ leaderboard, myStats }) => {
      navigate(`/student/room/${roomId}/results`, { state: { leaderboard, myStats } });
    });

    const offKicked = on("you-were-kicked", () => { toast.error("You were removed"); navigate("/student/dashboard"); });
    const offClosed = on("room-closed", () => { toast.info("Room was closed"); navigate("/student/dashboard"); });
    const offAutoClosed = on("room-auto-closed", () => { toast.info("Room was auto-closed"); navigate("/student/dashboard"); });

    return () => {
      offJoinedList(); offQuizStarted(); offQuestion(); offTick();
      offAnswerReceived(); offTimeUp(); offLeaderboard();
      offAlreadyAnswered(); offTooLate(); offPaused(); offResumed();
      offEnded(); offKicked(); offClosed(); offAutoClosed();onSuccess()
    };
  }, [on]);

  const handleAnswer = (idx) => {
    if (phase !== "question" || !curQues) return;
    setSelected(idx);
    setPhase("answered");
    submitAnswer(roomId, curQues.questionIndex, idx);
  };

  const timerPercent = curQues ? (timeLeft / curQues.timeLimit) * 100 : 100;
  const timerColor = timeLeft > 10 ? "#7c3aed" : timeLeft > 5 ? "#f59e0b" : "#ef4444";
  const timerStatus = timeLeft > 10 ? "active" : "exception";

  if (phase === "waiting") {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#07070e" }}>
        <header className="flex items-center justify-between px-6 h-14 border-b" style={{ borderColor: "#1e1e35", background: "rgba(7,7,14,0.95)" }}>
          <Logo size="sm" />
          <Tag color="purple" className="font-mono text-sm font-bold tracking-widest">{roomId}</Tag>
        </header>

        <div className="flex-1 flex flex-col items-center pt-12 px-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="text-4xl mb-3 animate-pulse">⏳</div>
              <p className="text-white font-bold text-xl mb-1">Waiting for teacher to start</p>
              <p className="text-gray-500 text-sm">The quiz will begin shortly</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <Badge status="processing" color="green" />
                <span className="text-green-400 text-sm font-semibold">
                  {studentList.length} student{studentList.length !== 1 ? "s" : ""} in room
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-600 font-semibold uppercase tracking-widest mb-3">
              Participants
            </p>
            <div className="grid grid-cols-2 gap-2">
              {studentList.map((s, i) => {
                const isMe = s.name === myName;
                return (
                  <div
                    key={s.socketId || i}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                    style={{
                      background: isMe ? "rgba(124,58,237,0.12)" : "#12121f",
                      border: `1px solid ${isMe ? "rgba(124,58,237,0.35)" : "#1e1e35"}`,
                    }}
                  >
                    <Avatar
                      size={24}
                      style={{
                        background: isMe ? "linear-gradient(135deg,#7c3aed,#06b6d4)" : "#1e1e35",
                        fontSize: 10, fontWeight: 700, flexShrink: 0,
                      }}
                    >
                      {s.name?.[0]?.toUpperCase()}
                    </Avatar>
                    <span className="text-sm font-medium truncate" style={{ color: isMe ? "#a78bfa" : "#8b8ba7" }}>
                      {s.name}{isMe && <span className="text-xs ml-1 text-gray-600">(you)</span>}
                    </span>
                  </div>
                );
              })}
            </div>

            {studentList.length === 0 && (
              <div className="text-center py-8 rounded-xl border border-dashed border-gray-800">
                <p className="text-gray-600 text-sm">No one else yet...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const optionStyle = (idx) => {
    if (phase === "answered" && selected === idx) {
      return { bg: "rgba(124,58,237,0.2)", border: "#7c3aed", text: "#a78bfa" };
    }
    if (phase === "reveal") {
      if (idx === correctAnswer) return { bg: "rgba(16,185,129,0.15)", border: "#10b981", text: "#10b981" };
      if (selected === idx) return { bg: "rgba(239,68,68,0.12)", border: "#ef4444", text: "#ef4444" };
      return { bg: "#0d0d18", border: "#1e1e35", text: "#4b4b68" };
    }
    return { bg: "#0d0d18", border: "#1e1e35", text: "#8b8ba7" };
  };

  const isLocked = phase === "answered" || phase === "reveal";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#07070e" }}>
      <header
        className="flex items-center justify-between px-4 md:px-8 h-14 border-b"
        style={{ background: "rgba(7,7,14,0.95)", borderColor: "#1e1e35", backdropFilter: "blur(12px)" }}
      >
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 font-mono hidden sm:block">{roomId}</span>

          {isPaused && <Tag color="warning" icon={<ClockCircleOutlined />}>Paused</Tag>}

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}>
            <TrophyOutlined style={{ color: "#f59e0b", fontSize: 12 }} />
            <span className="font-bold text-sm text-yellow-400">{score.toLocaleString()}</span>
          </div>

          {streak > 1 && (
            <div className="flex items-center gap-1 px-3 py-1 rounded-full" style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
              <FireOutlined style={{ color: "#ef4444", fontSize: 12 }} />
              <span className="text-red-400 text-xs font-bold">{streak}</span>
            </div>
          )}

          <Avatar size={28} style={{ background: "linear-gradient(135deg,#7c3aed,#06b6d4)", fontSize: 11, fontWeight: 700 }}>
            {myName?.[0]?.toUpperCase() || "U"}
          </Avatar>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6">
        {curQues && (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex gap-1 flex-1">
                {Array.from({ length: totalQuestions }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-1.5 rounded-full transition-all"
                    style={{
                      background:
                        i < curQues.questionIndex ? "#7c3aed"
                          : i === curQues.questionIndex ? "#a78bfa"
                            : "#1e1e35",
                    }}
                  />
                ))}
              </div>
              <Tag color="purple" className="flex-shrink-0 font-semibold">
                {curQues.questionNumber}/{totalQuestions}
              </Tag>
            </div>

            {phase !== "reveal" && (
              <div className="mb-5">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Time remaining</span>
                  <span className="font-bold" style={{ color: timerColor }}>{timeLeft}s</span>
                </div>
                <Progress
                  percent={timerPercent}
                  showInfo={false}
                  strokeColor={timerColor}
                  trailColor="#1e1e35"
                  size={["100%", 8]}
                  status={timerStatus}
                  strokeLinecap="round"
                />
              </div>
            )}

            <div className="p-5 rounded-2xl mb-4" style={{ background: "#12121f", border: "1px solid #1e1e35" }}>
              <div className="flex items-start gap-3">
                <Avatar
                  size={32}
                  style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa", flexShrink: 0, fontSize: 12, fontWeight: 700 }}
                >
                  {curQues.questionNumber}
                </Avatar>
                <p className="text-base md:text-lg font-bold text-white leading-relaxed">
                  {curQues.question}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 mb-5">
              {curQues.options.map((opt, oi) => {
                const s = optionStyle(oi);
                return (
                  <button
                    key={oi}
                    onClick={() => !isLocked && handleAnswer(oi)}
                    disabled={isLocked}
                    className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200"
                    style={{
                      background: s.bg,
                      border: `1.5px solid ${s.border}`,
                      cursor: isLocked ? "not-allowed" : "pointer",
                      opacity: phase === "reveal" && oi !== correctAnswer && selected !== oi ? 0.4 : 1,
                    }}
                  >
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{ background: OPTION_COLORS[oi] + "25", color: OPTION_COLORS[oi] }}
                    >
                      {phase === "reveal" && oi === correctAnswer ? (
                        <CheckOutlined style={{ color: "#10b981" }} />
                      ) : phase === "reveal" && selected === oi && oi !== correctAnswer ? (
                        <CloseOutlined style={{ color: "#ef4444" }} />
                      ) : (
                        OPTION_LABELS[oi]
                      )}
                    </span>
                    <span className="text-sm font-medium flex-1" style={{ color: s.text }}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>

            {phase === "answered" && (
              <div className="p-4 rounded-2xl text-center" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
                <div className="text-2xl mb-1">✅</div>
                <p className="font-bold text-purple-400">Answer submitted!</p>
                <p className="text-sm text-gray-500 mt-1 animate-pulse">Waiting for others...</p>
              </div>
            )}

            {phase === "reveal" && (
              <div
                className="p-4 rounded-2xl text-center"
                style={{
                  background:
                    answeredCorrectly === true ? "rgba(16,185,129,0.12)"
                      : answeredCorrectly === false ? "rgba(239,68,68,0.12)"
                        : "rgba(245,158,11,0.08)",
                  border: `1px solid ${answeredCorrectly === true ? "#10b98150"
                      : answeredCorrectly === false ? "#ef444450"
                        : "#f59e0b50"
                    }`,
                }}
              >
                {answeredCorrectly === true ? (
                  <>
                    <div className="text-3xl mb-1">🎉</div>
                    <p className="font-bold text-green-400 text-base">Correct!</p>
                    <p className="text-sm text-gray-400 mt-1">
                      +{pointsEarned.toLocaleString()} pts
                      {streak > 1 && <span className="ml-2 text-red-400">🔥 {streak} streak</span>}
                    </p>
                  </>
                ) : answeredCorrectly === false ? (
                  <>
                    <div className="text-3xl mb-1">❌</div>
                    <p className="font-bold text-red-400 text-base">Wrong answer</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Correct: <span className="text-green-400 font-semibold">{OPTION_LABELS[correctAnswer]}</span>
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-3xl mb-1">⏱️</div>
                    <p className="font-bold text-yellow-400 text-base">Time's up!</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Correct: <span className="text-green-400 font-semibold">{OPTION_LABELS[correctAnswer]}</span>
                    </p>
                  </>
                )}
                <p className="mt-2 text-xs text-gray-600">Next question in a moment...</p>
              </div>
            )}

            <div className="mt-auto pt-4 flex items-center justify-between text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <ThunderboltOutlined />
                Live rank:
                <span className="text-white font-bold ml-1">{myRank ? `#${myRank}` : "--"}</span>
              </span>
              <span>
                {Math.round((curQues.questionIndex / totalQuestions) * 100)}% complete
              </span>
            </div>
          </>
        )}
      </main>
    </div>
  );
}