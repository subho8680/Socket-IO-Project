import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, Progress } from "antd";
import {
  TrophyOutlined,
  ThunderboltOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import {
  mockQuestions,
  mockLeaderboard,
  OPTION_COLORS,
  OPTION_LABELS,
} from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/common/Logo";

const QUESTION_TIME = 30;

function TimerBar({ timeLeft, total }) {
  const pct = (timeLeft / total) * 100;
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

function AnswerOption({ opt, index, selected, correct, revealed, onClick }) {
  let bg = "#0d0d18";
  let border = "#1e1e35";
  let textColor = "#8b8ba7";

  if (selected && !revealed) {
    bg = "rgba(124,58,237,0.2)";
    border = "#7c3aed";
    textColor = "#a78bfa";
  }
  if (revealed && index === correct) {
    bg = "rgba(16,185,129,0.15)";
    border = "#10b981";
    textColor = "#10b981";
  }
  if (revealed && selected && index !== correct) {
    bg = "rgba(239,68,68,0.12)";
    border = "#ef4444";
    textColor = "#ef4444";
  }

  return (
    <button
      onClick={() => !revealed && onClick(index)}
      disabled={revealed}
      className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200"
      style={{
        background: bg,
        border: `1.5px solid ${border}`,
        cursor: revealed ? "not-allowed" : "pointer",
        opacity: revealed && index !== correct && !selected ? 0.5 : 1,
      }}
    >
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all"
        style={{
          background: OPTION_COLORS[index] + "25",
          color: OPTION_COLORS[index],
        }}
      >
        {revealed && index === correct ? (
          <CheckOutlined />
        ) : revealed && selected && index !== correct ? (
          <CloseOutlined />
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
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [phase, setPhase] = useState("question");
  const [pointsEarned, setPointsEarned] = useState(0);
  const timerRef = useRef(null);
  const questions = mockQuestions;
  const currentQ = questions[qIndex];

  useEffect(() => {
    setTimeLeft(QUESTION_TIME);
    setSelected(null);
    setRevealed(false);
    setPhase("question");
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [qIndex]);

  const handleTimeUp = () => {
    setRevealed(true);
    setStreak(0);
    setPhase("feedback");
    setTimeout(goNext, 2000);
  };

  const handleAnswer = (idx) => {
    clearInterval(timerRef.current);
    setSelected(idx);
    setRevealed(true);
    const isCorrect = idx === currentQ.correct;
    const speedBonus = Math.round((timeLeft / QUESTION_TIME) * 200);
    const pts = isCorrect
      ? 1000 + speedBonus + (isCorrect ? streak * 150 : 0)
      : 0;
    setPointsEarned(pts);
    if (isCorrect) {
      setScore((s) => s + pts);
      setStreak((s) => s + 1);
    } else setStreak(0);
    setPhase("feedback");
    setTimeout(goNext, 2000);
  };

  const goNext = () => {
    if (qIndex < questions.length - 1) setQIndex((i) => i + 1);
    else
      navigate(`/student/room/${roomId}/results`, { state: { score, streak } });
  };

  const userRank = 3;
  const myEntry = mockLeaderboard[userRank - 1];

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
          <div className="flex items-center gap-1.5 text-xs text-txt-secondary">
            <span className="font-mono">{roomId}</span>
          </div>
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
              className="flex items-center gap-1.5 px-3 py-1 rounded-full animate-fade-in"
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
            {user?.name?.[0] || "U"}
          </Avatar>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-6 md:py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex gap-1 flex-1">
            {questions.map((_, i) => (
              <div
                key={i}
                className="flex-1 h-1.5 rounded-full transition-all"
                style={{
                  background:
                    i < qIndex
                      ? "#7c3aed"
                      : i === qIndex
                        ? "#a78bfa"
                        : "#1e1e35",
                }}
              />
            ))}
          </div>
          <span className="text-xs text-txt-secondary flex-shrink-0 font-semibold">
            {qIndex + 1}/{questions.length}
          </span>
        </div>

        <div className="mb-6">
          <TimerBar timeLeft={timeLeft} total={QUESTION_TIME} />
        </div>

        <div
          className="p-6 rounded-2xl mb-5 animate-fade-in"
          style={{ background: "#12121f", border: "1px solid #1e1e35" }}
        >
          <div className="flex items-start gap-3">
            <span
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
              style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}
            >
              {qIndex + 1}
            </span>
            <p className="text-base md:text-lg font-bold text-txt-primary leading-relaxed">
              {currentQ.question}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 mb-6">
          {currentQ.options.map((opt, oi) => (
            <AnswerOption
              key={oi}
              opt={opt}
              index={oi}
              selected={selected === oi}
              correct={currentQ.correct}
              revealed={revealed}
              onClick={handleAnswer}
            />
          ))}
        </div>

        {phase === "feedback" && (
          <div
            className="p-4 rounded-2xl text-center animate-fade-up"
            style={{
              background:
                selected === currentQ.correct
                  ? "rgba(16,185,129,0.12)"
                  : selected === null
                    ? "rgba(239,68,68,0.08)"
                    : "rgba(239,68,68,0.12)",
              border: `1px solid ${selected === currentQ.correct ? "#10b981" : "#ef4444"}50`,
            }}
          >
            {selected === currentQ.correct ? (
              <>
                <div className="text-3xl mb-1">🎉</div>
                <div className="font-bold text-success text-base">Correct!</div>
                <div className="text-sm text-txt-secondary mt-1">
                  +{pointsEarned.toLocaleString()} pts{" "}
                  {streak > 1 && `· 🔥 ${streak} streak`}
                </div>
              </>
            ) : (
              <>
                <div className="text-3xl mb-1">
                  {selected === null ? "⏱️" : "❌"}
                </div>
                <div className="font-bold text-danger text-base">
                  {selected === null ? "Time's up!" : "Wrong answer"}
                </div>
                <div className="text-sm text-txt-secondary mt-1">
                  Correct:{" "}
                  <span className="text-success font-semibold">
                    {OPTION_LABELS[currentQ.correct]}
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
            <span className="text-txt-primary font-bold ml-1">#{userRank}</span>
          </span>
          <span>{Math.round((qIndex / questions.length) * 100)}% complete</span>
        </div>
      </main>
    </div>
  );
}
