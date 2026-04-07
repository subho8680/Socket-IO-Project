import React, { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Button, Avatar, Progress } from "antd";
import {
  HomeOutlined,
  RobotOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/common/Logo";

const MEDALS = ["🥇", "🥈", "🥉"];

const AVATAR_COLORS = [
  "linear-gradient(135deg,#7c3aed,#06b6d4)",
  "linear-gradient(135deg,#10b981,#06b6d4)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#ec4899,#8b5cf6)",
  "linear-gradient(135deg,#3b82f6,#06b6d4)",
];

function getAvatarColor(name) {
  const idx = name ? name.charCodeAt(0) % AVATAR_COLORS.length : 0;
  return AVATAR_COLORS[idx];
}

export default function StudentResults() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [showAI, setShowAI] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiText, setAiText] = useState("");

  const leaderboard = location.state?.leaderboard ?? [];
  const myStats = location.state?.myStats ?? {};

  const {
    totalScore = 0,
    correctAnswers = 0,
    wrongAnswers = 0,
    accuracy = "0%",
    rank = "--",
  } = myStats;

  const totalAnswered = correctAnswers + wrongAnswers;
  const totalStudents = leaderboard.length;
  const myName = user?.user?.name;

  const rankLabel = rank <= 3 ? MEDALS[rank - 1] || "#" + rank : `#${rank}`;
  const rankColor =
    rank === 1
      ? "#fbbf24"
      : rank === 2
        ? "#e5e7eb"
        : rank === 3
          ? "#cd7f32"
          : "#9ca3af";

  const handleAI = async () => {
    setLoadingAI(true);
    setShowAI(true);
    await new Promise((r) => setTimeout(r, 1400));
    setAiText(
      `Great effort, ${myName?.split(" ")[0] || "Student"}! 🎯\n\n` +
        `You scored ${totalScore.toLocaleString()} points with ${accuracy} accuracy, landing you at rank #${rank} out of ${totalStudents} students.\n\n` +
        `✅ You answered ${correctAnswers} questions correctly.\n` +
        `⚠️ You got ${wrongAnswers} questions wrong.\n\n` +
        `📚 Keep practicing — consistency is key to climbing the leaderboard!`,
    );
    setLoadingAI(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="h-16 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md flex items-center px-6">
        <Logo size="sm" />
        <Button
          onClick={() => navigate("/student/dashboard")}
          icon={<HomeOutlined />}
          className="ml-auto h-9 px-5 text-sm border-zinc-700 text-zinc-300 hover:text-white"
        >
          Dashboard
        </Button>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-10 space-y-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center relative overflow-hidden">
          <div className="text-6xl mb-4">
            {rank <= 3 ? MEDALS[rank - 1] : "🏆"}
          </div>

          <div
            className="text-6xl font-bold tracking-tighter mb-1"
            style={{
              background: "linear-gradient(90deg, #a5b4fc, #67e8f9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {totalScore.toLocaleString()}
          </div>
          <p className="text-zinc-400 text-sm mb-8">TOTAL POINTS</p>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: rankColor }}>
                {rankLabel}
              </div>
              <p className="text-xs text-zinc-500 mt-1">RANK</p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-white">{accuracy}</div>
              <p className="text-xs text-zinc-500 mt-1">ACCURACY</p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {correctAnswers}/{totalAnswered}
              </div>
              <p className="text-xs text-zinc-500 mt-1">CORRECT</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-7">
          <div className="flex items-center gap-3 mb-6">
            <TrophyOutlined className="text-2xl text-amber-400" />
            <h3 className="text-lg font-semibold">Final Leaderboard</h3>
            <div className="ml-auto text-xs text-zinc-500">
              {totalStudents} students
            </div>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-auto pr-2 custom-scrollbar">
            {leaderboard.map((entry, i) => {
              const isMe = entry.name === myName;
              return (
                <div
                  key={entry.socketId || i}
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                    isMe
                      ? "bg-indigo-500/10 border border-indigo-500"
                      : "bg-zinc-950 hover:bg-zinc-900 border border-transparent"
                  }`}
                >
                  <div className="w-8 text-center font-medium">
                    {i < 3 ? (
                      <span className="text-xl">{MEDALS[i]}</span>
                    ) : (
                      <span className="text-zinc-500 text-sm">#{i + 1}</span>
                    )}
                  </div>

                  <Avatar
                    size={36}
                    style={{
                      background: getAvatarColor(entry.name),
                      fontWeight: 700,
                    }}
                  >
                    {entry.name?.[0]?.toUpperCase()}
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-medium truncate ${isMe ? "text-indigo-400" : "text-white"}`}
                    >
                      {entry.name}
                      {isMe && (
                        <span className="ml-2 text-xs text-zinc-500">
                          (You)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {entry.correctAnswers} correct • {entry.wrongAnswers}{" "}
                      wrong
                      {entry.streak > 1 && ` • 🔥 ${entry.streak}`}
                    </div>
                  </div>

                  <div className="font-bold text-lg tabular-nums text-white">
                    {entry.score?.toLocaleString() || 0}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-7">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <RobotOutlined className="text-white text-2xl" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">AI Performance Feedback</h3>
              <p className="text-zinc-400 text-sm">
                Personalized insights from AI
              </p>
            </div>
          </div>

          {!showAI ? (
            <Button
              block
              onClick={handleAI}
              className="h-12 text-base font-semibold rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110"
            >
              Get AI Feedback
            </Button>
          ) : loadingAI ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-4 border-zinc-700 border-t-violet-500 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-zinc-400">Analyzing your performance...</p>
            </div>
          ) : (
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-sm leading-relaxed text-zinc-300 whitespace-pre-line">
              {aiText}
            </div>
          )}
        </div>

        <Button
          block
          size="large"
          onClick={() => navigate("/student/dashboard")}
          className="h-12 text-base font-semibold rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
