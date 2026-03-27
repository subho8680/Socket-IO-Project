import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar } from "antd";
import {
  TrophyOutlined,
  ThunderboltOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { OPTION_COLORS, OPTION_LABELS } from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/common/Logo";
import { useSocket } from "../../Services/Usesocket";
import { toast } from "react-toastify";
function TimerBar({ timeLeft, total }) {
  const pct = total > 0 ? (timeLeft / total) * 100 : 0;
  const color =
    timeLeft > 10 ? "#7c3aed" : timeLeft > 5 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative">
      <div className="flex justify-between text-xs text-txt-secondary mb-1.5">
        <span>Time remaining</span>
        <span className="font-bold" style={{ color }}>
          {timeLeft}s
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ background: "#1e1e35" }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function AnswerOption({ opt, index, selected, correctAnswer, phase, onClick }) {
  let bg = "#0d0d18";
  let border = "#1e1e35";
  let textColor = "#8b8ba7";

  if (phase === "answered" && selected) {
    bg = "rgba(124,58,237,0.2)";
    border = "#7c3aed";
    textColor = "#a78bfa";
  }

  if (phase === "reveal") {
    if (index === correctAnswer) {
      bg = "rgba(16,185,129,0.15)";
      border = "#10b981";
      textColor = "#10b981";
    } else if (selected && index !== correctAnswer) {
      bg = "rgba(239,68,68,0.12)";
      border = "#ef4444";
      textColor = "#ef4444";
    } else {
      bg = "#0d0d18";
      border = "#1e1e35";
      textColor = "#4b4b68";
    }
  }

  const isLocked = phase === "answered" || phase === "reveal";

  return (
    <button
      onClick={() => !isLocked && onClick(index)}
      disabled={isLocked}
      className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200"
      style={{
        background: bg,
        border: `1.5px solid ${border}`,
        cursor: isLocked ? "not-allowed" : "pointer",
        opacity:
          phase === "reveal" && index !== correctAnswer && !selected ? 0.4 : 1,
      }}
    >
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
        style={{
          background: OPTION_COLORS[index] + "25",
          color: OPTION_COLORS[index],
        }}
      >
        {phase === "reveal" && index === correctAnswer ? (
          <CheckOutlined style={{ color: "#10b981" }} />
        ) : phase === "reveal" && selected && index !== correctAnswer ? (
          <CloseOutlined style={{ color: "#ef4444" }} />
        ) : (
          OPTION_LABELS[index]
        )}
      </span>
      <span className="text-sm font-medium flex-1" style={{ color: textColor }}>
        {opt}
      </span>
    </button>
  );
}

export default function StudentQuizRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { on, submitAnswer } = useSocket();

  const [phase, setPhase] = useState("waiting");
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
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    const offQuestion = on(
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
          questionNumber,
        });
        setTotalQuestions(totalQuestions);
        setSelected(null);
        // setRevealed(false);
        setPhase("question");
        setTimeLeft(timeLimit);
        setPointsEarned(0);
        setCorrectAnswer(null);
        setIsPaused(false);
      },
    );
    const joinedList = on("joined-list", ({ studentList }) => {
      setstudentList(studentList);
    });
    const quizStart = on("quiz-started", ({ totalQuestions, message }) => {
      toast.success(message);
    });
    const offTick = on("timer-tick", ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    });

    const offTimeUp = on("time-up", ({ correctAnswer, leaderboard }) => {
      setCorrectAnswer(correctAnswer);
      setRevealed(true);
      setPhase("feedback");
      setStreak(0);
      const me = leaderboard.find((s) => s.name === user?.user?.name);
      if (me) setMyRank(me.rank);
    });

    const offAnswerReceived = on(
      "answer-received",
      ({ isCorrect, pointsEarned, totalScore }) => {
        setScore(totalScore);
        setPointsEarned(pointsEarned);
        setPhase("feedback");
        if (isCorrect) {
          setStreak((prev) => prev + 1);
        } else {
          setStreak(0);
        }
      },
    );

    const offAlreadyAnswered = on("already-answered", () => {
      setPhase("feedback");
    });

    const offTooLate = on("answer-too-late", () => {
      setPhase("feedback");
    });

    const offLeaderboard = on("leaderboard-update", (leaderboard) => {
      const me = leaderboard.find((s) => s.name === user?.user?.name);
      if (me) {
        setMyRank(me.rank);
        setScore(me.score);
      }
    });

    const offPaused = on("quiz-paused", () => {
      setIsPaused(true);
    });

    const offResumed = on("quiz-resumed", () => {
      setIsPaused(false);
    });

    const offEnded = on("quiz-ended", ({ leaderboard, myStats }) => {
      navigate(`/student/room/${roomId}/results`, {
        state: { leaderboard, myStats },
      });
    });

    const offKicked = on("you-were-kicked", () => {
      navigate("/student/dashboard");
    });

    const offRoomClosed = on("room-closed", () => {
      navigate("/student/dashboard");
    });

    const offAutoClosed = on("room-auto-closed", () => {
      navigate("/student/dashboard");
    });

    return () => {
      offQuestion();
      offTick();
      offTimeUp();
      offAnswerReceived();
      offAlreadyAnswered();
      offTooLate();
      offLeaderboard();
      offPaused();
      offResumed();
      offEnded();
      offKicked();
      offRoomClosed();
      offAutoClosed();
      quizStart();
      joinedList();
    };
  }, [on]);

  const handleAnswer = (idx) => {
    if (phase !== "question" || !curQues) return;
    setSelected(idx);
    setPhase("answered");
    submitAnswer(roomId, curQues.questionIndex, idx);
  };

  if (phase === "waiting") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: "#07070e" }}
      >
        <Logo size="sm" />
        <div className="mt-8 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: "rgba(124,58,237,0.15)",
              border: "1px solid rgba(124,58,237,0.3)",
            }}
          >
            <span className="text-2xl animate-pulse">⏳</span>
          </div>
          <p className="text-txt-primary font-bold text-lg mb-2">
            Waiting for teacher to start...
          </p>
          <p className="text-txt-muted text-sm">
            Room: <span className="font-mono text-brand-light">{roomId}</span>
          </p>
          {totalStudents > 0 && (
            <p className="text-txt-muted text-xs mt-2">
              {totalStudents} student{totalStudents > 1 ? "s" : ""} in room
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{ background: "#07070e" }}
    >
      <header
        className="flex items-center justify-between px-4 md:px-8 h-14 border-b border-bg-border"
        style={{ background: "rgba(7,7,14,0.9)", backdropFilter: "blur(12px)" }}
      >
        <Logo size="sm" />
        <div className="flex items-center gap-4">
          <span className="text-xs text-txt-secondary font-mono">{roomId}</span>

          {isPaused && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                background: "rgba(245,158,11,0.15)",
                color: "#f59e0b",
                border: "1px solid rgba(245,158,11,0.3)",
              }}
            >
              PAUSED
            </span>
          )}

          <div
            className="flex items-center gap-2 px-3 py-1 rounded-full"
            style={{
              background: "rgba(245,158,11,0.15)",
              border: "1px solid rgba(245,158,11,0.3)",
            }}
          >
            <TrophyOutlined style={{ color: "#f59e0b", fontSize: 12 }} />
            <span className="font-bold text-sm text-warning">
              {score.toLocaleString()}
            </span>
          </div>

          {streak > 1 && (
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-full"
              style={{
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
            >
              <span className="text-danger text-xs font-bold">🔥 {streak}</span>
            </div>
          )}

          <Avatar
            size={28}
            style={{
              background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {user?.user?.name?.[0]?.toUpperCase() || "U"}
          </Avatar>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6 md:py-10">
        {curQues && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex gap-1 flex-1">
                {Array.from({ length: totalQuestions }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-1.5 rounded-full transition-all"
                    style={{
                      background:
                        i < curQues.questionIndex
                          ? "#7c3aed"
                          : i === curQues.questionIndex
                            ? "#a78bfa"
                            : "#1e1e35",
                    }}
                  />
                ))}
              </div>
              <span className="text-xs text-txt-secondary flex-shrink-0 font-semibold">
                {curQues.questionNumber}/{totalQuestions}
              </span>
            </div>

            {phase !== "reveal" && (
              <div className="mb-6">
                <TimerBar timeLeft={timeLeft} total={curQues.timeLimit} />
              </div>
            )}

            <div
              className="p-6 rounded-2xl mb-5"
              style={{ background: "#12121f", border: "1px solid #1e1e35" }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{
                    background: "rgba(124,58,237,0.2)",
                    color: "#a78bfa",
                  }}
                >
                  {curQues.questionNumber}
                </span>
                <p className="text-base md:text-lg font-bold text-txt-primary leading-relaxed">
                  {curQues.question}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 mb-6">
              {curQues.options.map((opt, oi) => (
                <AnswerOption
                  key={oi}
                  opt={opt}
                  index={oi}
                  selected={selected === oi}
                  correctAnswer={correctAnswer}
                  phase={phase}
                  onClick={handleAnswer}
                />
              ))}
            </div>

            {phase === "answered" && (
              <div
                className="p-4 rounded-2xl text-center"
                style={{
                  background: "rgba(124,58,237,0.08)",
                  border: "1px solid rgba(124,58,237,0.2)",
                }}
              >
                <div className="text-2xl mb-1">✅</div>
                <div className="font-bold text-brand-light text-base">
                  Answer submitted!
                </div>
                <div className="text-sm text-txt-muted mt-1 animate-pulse">
                  Waiting for others...
                </div>
              </div>
            )}

            {phase === "reveal" && (
              <div
                className="p-4 rounded-2xl text-center"
                style={{
                  background:
                    answeredCorrectly === true
                      ? "rgba(16,185,129,0.12)"
                      : answeredCorrectly === false
                        ? "rgba(239,68,68,0.12)"
                        : "rgba(245,158,11,0.08)",
                  border: `1px solid ${
                    answeredCorrectly === true
                      ? "#10b98150"
                      : answeredCorrectly === false
                        ? "#ef444450"
                        : "#f59e0b50"
                  }`,
                }}
              >
                {answeredCorrectly === true ? (
                  <>
                    <div className="text-3xl mb-1">🎉</div>
                    <div className="font-bold text-success text-base">
                      Correct!
                    </div>
                    <div className="text-sm text-txt-secondary mt-1">
                      +{pointsEarned.toLocaleString()} pts
                      {streak > 1 && ` · 🔥 ${streak} streak`}
                    </div>
                  </>
                ) : answeredCorrectly === false ? (
                  <>
                    <div className="text-3xl mb-1">❌</div>
                    <div className="font-bold text-danger text-base">
                      Wrong answer
                    </div>
                    <div className="text-sm text-txt-secondary mt-1">
                      Correct:{" "}
                      <span className="text-success font-semibold">
                        {OPTION_LABELS[correctAnswer]}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-3xl mb-1">⏱️</div>
                    <div className="font-bold text-warning text-base">
                      Time's up!
                    </div>
                    <div className="text-sm text-txt-secondary mt-1">
                      Correct:{" "}
                      <span className="text-success font-semibold">
                        {OPTION_LABELS[correctAnswer]}
                      </span>
                    </div>
                  </>
                )}
                <div className="mt-2 text-xs text-txt-muted">
                  Next question in a moment...
                </div>
              </div>
            )}

            <div className="mt-auto pt-4 flex items-center justify-between text-xs text-txt-muted">
              <span className="flex items-center gap-1">
                <ThunderboltOutlined /> Live rank:{" "}
                <span className="text-txt-primary font-bold ml-1">
                  {myRank ? `#${myRank}` : "--"}
                </span>
              </span>
              <span>
                {Math.round((curQues.questionIndex / totalQuestions) * 100)}%
                complete
              </span>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
