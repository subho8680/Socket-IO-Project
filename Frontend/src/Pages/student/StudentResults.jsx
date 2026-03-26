import React, { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button, Avatar, Progress } from "antd";
import {
  TrophyOutlined,
  HomeOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { mockLeaderboard, mockQuestions } from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/common/Logo";

const OPTION_COLORS = ["#7c3aed", "#06b6d4", "#10b981", "#f59e0b"];
const OPTION_LABELS = ["A", "B", "C", "D"];

const MY_ANSWERS = [1, 1, 2, 1, 0];

export default function StudentResults() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showAI, setShowAI] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiText, setAiText] = useState("");

  const finalScore = location.state?.score ?? 8200;
  const myRank = 3;
  const totalStudents = mockLeaderboard.length;
  const correct = MY_ANSWERS.filter(
    (a, i) => a === mockQuestions[i].correct,
  ).length;
  const accuracy = Math.round((correct / mockQuestions.length) * 100);

  const MEDALS = ["🥇", "🥈", "🥉"];
  const rankLabel = myRank <= 3 ? MEDALS[myRank - 1] : `#${myRank}`;
  const rankColor =
    myRank === 1
      ? "#f59e0b"
      : myRank === 2
        ? "#c0c0c0"
        : myRank === 3
          ? "#cd7f32"
          : "#8b8ba7";

  const handleAI = async () => {
    setLoadingAI(true);
    setShowAI(true);
    await new Promise((r) => setTimeout(r, 1400));
    setAiText(
      `Great effort, ${user?.name?.split(" ")[0] || "Student"}! 🎯\n\nYou scored ${finalScore.toLocaleString()} points with ${accuracy}% accuracy, landing you at rank #${myRank} out of ${totalStudents} students.\n\n✅ You nailed Questions 1 and 2 — solid understanding of useEffect and dependency arrays.\n\n⚠️ Question 5 (infinite loops with setState) tripped you up. This is a common React pitfall — review how the dependency array controls re-render cycles.\n\n📚 Recommended: Practice more useEffect cleanup patterns and controlled component updates to boost your next score!`,
    );
    setLoadingAI(false);
  };

  return (
    <div className="min-h-screen font-sans" style={{ background: "#07070e" }}>
      <header
        className="flex items-center justify-between px-4 md:px-8 h-14 border-b border-bg-border"
        style={{ background: "rgba(7,7,14,0.9)", backdropFilter: "blur(12px)" }}
      >
        <Logo size="sm" />
        <Button
          onClick={() => navigate("/student/dashboard")}
          icon={<HomeOutlined />}
          style={{
            background: "#12121f",
            border: "1px solid #1e1e35",
            color: "#8b8ba7",
            borderRadius: 10,
            fontWeight: 600,
          }}
        >
          Dashboard
        </Button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div
          className="p-8 rounded-3xl text-center mb-6 relative overflow-hidden animate-fade-up"
          style={{
            background:
              "linear-gradient(135deg,rgba(124,58,237,0.2),rgba(6,182,212,0.1))",
            border: "1px solid rgba(124,58,237,0.35)",
          }}
        >
          <div
            className="absolute pointer-events-none"
            style={{
              top: "-20%",
              right: "-10%",
              width: 250,
              height: 250,
              background:
                "radial-gradient(circle,rgba(245,158,11,0.1) 0%,transparent 70%)",
              borderRadius: "50%",
            }}
          />
          <div className="text-5xl mb-2 animate-float inline-block">
            {myRank <= 3 ? MEDALS[myRank - 1] : "🎮"}
          </div>
          <div
            className="text-5xl font-black text-txt-primary mb-1"
            style={{
              background: "linear-gradient(90deg,#a78bfa,#67e8f9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {finalScore.toLocaleString()}
          </div>
          <div className="text-txt-secondary text-sm mb-4">Total Points</div>
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <div className="text-xl font-black" style={{ color: rankColor }}>
                {rankLabel}
              </div>
              <div className="text-xs text-txt-muted">
                Rank of {totalStudents}
              </div>
            </div>
            <div className="w-px h-8" style={{ background: "#1e1e35" }} />
            <div className="text-center">
              <div className="text-xl font-black text-txt-primary">
                {accuracy}%
              </div>
              <div className="text-xs text-txt-muted">Accuracy</div>
            </div>
            <div className="w-px h-8" style={{ background: "#1e1e35" }} />
            <div className="text-center">
              <div className="text-xl font-black text-success">
                {correct}/{mockQuestions.length}
              </div>
              <div className="text-xs text-txt-muted">Correct</div>
            </div>
          </div>
        </div>

        <div
          className="p-5 rounded-2xl mb-5 animate-fade-up"
          style={{
            background: "#12121f",
            border: "1px solid #1e1e35",
            animationDelay: "0.1s",
          }}
        >
          <h3 className="font-bold text-txt-primary text-sm mb-4">
            Your Answers
          </h3>
          <div className="space-y-3">
            {mockQuestions.map((q, i) => {
              const myAns = MY_ANSWERS[i];
              const isCorrect = myAns === q.correct;
              return (
                <div
                  key={q.id}
                  className="p-3 rounded-xl"
                  style={{ background: "#0d0d18", border: "1px solid #1e1e35" }}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span
                      className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background: isCorrect
                          ? "rgba(16,185,129,0.2)"
                          : "rgba(239,68,68,0.15)",
                        color: isCorrect ? "#10b981" : "#ef4444",
                      }}
                    >
                      {isCorrect ? "✓" : "✗"}
                    </span>
                    <p className="text-xs text-txt-secondary leading-relaxed">
                      {q.question}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pl-8">
                    {q.options.map((opt, oi) => (
                      <div
                        key={oi}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                        style={{
                          background:
                            oi === q.correct
                              ? "rgba(16,185,129,0.12)"
                              : oi === myAns && !isCorrect
                                ? "rgba(239,68,68,0.08)"
                                : "transparent",
                          border: `1px solid ${oi === q.correct ? "#10b98150" : oi === myAns && !isCorrect ? "#ef444430" : "#1e1e35"}`,
                          color:
                            oi === q.correct
                              ? "#10b981"
                              : oi === myAns && !isCorrect
                                ? "#ef4444"
                                : "#4b4b68",
                        }}
                      >
                        <span className="font-bold w-4">
                          {OPTION_LABELS[oi]}
                        </span>
                        <span className="truncate">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="p-5 rounded-2xl mb-5 animate-fade-up"
          style={{
            background: "#12121f",
            border: "1px solid #1e1e35",
            animationDelay: "0.15s",
          }}
        >
          <h3 className="font-bold text-txt-primary text-sm mb-4">
            🏆 Leaderboard
          </h3>
          <div className="space-y-2">
            {mockLeaderboard.slice(0, 5).map((entry, i) => {
              const isMe = i === myRank - 1;
              return (
                <div
                  key={entry.name}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all"
                  style={{
                    background: isMe ? "rgba(124,58,237,0.12)" : "transparent",
                    border: `1px solid ${isMe ? "rgba(124,58,237,0.3)" : "transparent"}`,
                  }}
                >
                  <div className="w-6 text-sm text-center">
                    {i < 3 ? (
                      ["🥇", "🥈", "🥉"][i]
                    ) : (
                      <span className="text-txt-muted text-xs">#{i + 1}</span>
                    )}
                  </div>
                  <Avatar
                    size={26}
                    style={{
                      background: "linear-gradient(135deg,#7c3aed,#06b6d4)",
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {entry.avatar}
                  </Avatar>
                  <div
                    className="flex-1 text-sm font-medium"
                    style={{ color: isMe ? "#a78bfa" : "#f1f1f8" }}
                  >
                    {isMe ? `${entry.name} (You)` : entry.name}
                  </div>
                  <div className="font-bold text-sm text-txt-primary">
                    {entry.score.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="p-5 rounded-2xl mb-6 animate-fade-up"
          style={{
            background: "#12121f",
            border: "1px solid rgba(124,58,237,0.3)",
            animationDelay: "0.2s",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(124,58,237,0.2)",
                border: "1px solid rgba(124,58,237,0.3)",
              }}
            >
              <RobotOutlined style={{ color: "#a78bfa", fontSize: 16 }} />
            </div>
            <div>
              <h3 className="font-bold text-txt-primary text-sm">
                AI Personal Feedback
              </h3>
              <p className="text-xs text-txt-secondary">
                Get personalized improvement tips
              </p>
            </div>
          </div>
          {!showAI ? (
            <Button
              block
              onClick={handleAI}
              style={{
                background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
                border: "none",
                height: 44,
                fontWeight: 700,
                borderRadius: 10,
                color: "#fff",
              }}
            >
              Get AI Feedback
            </Button>
          ) : loadingAI ? (
            <div className="text-center py-5">
              <div className="w-7 h-7 rounded-full border-2 border-brand border-t-transparent mx-auto animate-spin-slow mb-2" />
              <p className="text-txt-secondary text-sm animate-pulse">
                Analyzing your performance...
              </p>
            </div>
          ) : (
            <div
              className="p-4 rounded-xl text-sm text-txt-secondary leading-relaxed whitespace-pre-line animate-fade-in"
              style={{ background: "#0d0d18", border: "1px solid #1e1e35" }}
            >
              {aiText}
            </div>
          )}
        </div>

        <Button
          block
          size="large"
          onClick={() => navigate("/student/dashboard")}
          style={{
            background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
            border: "none",
            height: 50,
            fontWeight: 700,
            fontSize: 15,
            borderRadius: 12,
            color: "#fff",
          }}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
