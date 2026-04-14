import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ThunderboltOutlined,
  TrophyOutlined,
  PlayCircleOutlined,
  HistoryOutlined,
  StarOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import DashboardLayout from "../../components/common/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../Services/Usesocket";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function StatCard({ icon, label, value, bg, text }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${bg}`}>
        <span className={`text-base ${text}`}>{icon}</span>
      </div>
      <div className="text-[26px] font-medium text-gray-800 tabular-nums leading-none mb-1">
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-widest text-gray-400">
        {label}
      </div>
    </div>
  );
}

function TipCard({ icon, tip }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-base flex-shrink-0">
        {icon}
      </div>
      <p className="text-[13px] text-gray-600 leading-relaxed pt-0.5">{tip}</p>
    </div>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { on, joinRoom } = useSocket();

  const [roomCode, setRoomCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState("");

  const firstName = user?.user?.name?.split(" ")[0] || "Student";

  const stats = null;
  const recentQuizzes = [];

  const handleJoin = () => {
    setError("");
    const code = roomCode.trim();
    if (!code) { setError("Please enter a room code"); return; }
    if (code.length < 4) { setError("Room code is too short"); return; }
    setJoining(true);
    joinRoom(code, user?.user?.name, user?.user?._id);
  };

  useEffect(() => {
    const offSuccess = on("join-success", ({ roomId }) => {
      setNavigating(true);
      setTimeout(() => {
        setNavigating(false);
        navigate(`/student/room/${roomId}`);
      }, 500);
    });
    const offError = on("join-error", ({ msg }) => {
      setError(msg || "Failed to join room");
      setJoining(false);
    });
    return () => { offSuccess?.(); offError?.(); };
  }, [on, navigate]);

  const isLoading = joining || navigating;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f5f5f0] p-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">

          <div>
            <h1 className="text-[24px] font-medium text-gray-800">
              {greeting()}, {firstName} 👋
            </h1>
            <p className="text-[13px] text-gray-400 mt-1">
              Ready to test your knowledge? Join a live quiz below.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600" />

            <div className="p-7">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                  <PlayCircleOutlined className="text-blue-600 text-lg" />
                </div>
                <div>
                  <h2 className="text-[16px] font-medium text-gray-800">
                    Join a live quiz
                  </h2>
                  <p className="text-[13px] text-gray-400 mt-0.5">
                    Enter the room code your teacher shared
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    value={roomCode}
                    onChange={(e) => {
                      setRoomCode(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                    placeholder="Enter room code e.g. XK-8291"
                    // maxLength={12}
                    className={`w-full h-11 px-4 font-mono text-[15px] tracking-widest bg-gray-50 border rounded-lg outline-none transition-colors placeholder:text-gray-300 placeholder:tracking-normal placeholder:font-sans text-gray-800 ${error
                        ? "border-red-300 focus:border-red-400"
                        : "border-gray-200 focus:border-blue-400"
                      }`}
                  />
                  {error && (
                    <p className="text-[11px] text-red-500 mt-1.5">{error}</p>
                  )}
                </div>

                <button
                  onClick={handleJoin}
                  disabled={isLoading}
                  className="h-11 px-7 rounded-lg text-[13px] font-medium bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 flex-shrink-0"
                >
                  {isLoading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
                        <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                      </svg>
                      Joining…
                    </>
                  ) : (
                    <>
                      Join quiz
                      <ArrowRightOutlined className="text-xs" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
                Your performance
              </p>
            </div>

            {stats ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                  icon={<PlayCircleOutlined />}
                  label="Quizzes taken"
                  value={stats.quizzesTaken || 0}
                  bg="bg-blue-50"
                  text="text-blue-600"
                />
                <StatCard
                  icon={<ThunderboltOutlined />}
                  label="Avg score"
                  value={`${stats.avgScore || 0}%`}
                  bg="bg-amber-50"
                  text="text-amber-600"
                />
                <StatCard
                  icon={<TrophyOutlined />}
                  label="Best rank"
                  value={stats.bestRank ? `#${stats.bestRank}` : "--"}
                  bg="bg-emerald-50"
                  text="text-emerald-600"
                />
                <StatCard
                  icon={<StarOutlined />}
                  label="Total points"
                  value={
                    stats.totalPoints
                      ? `${(stats.totalPoints / 1000).toFixed(1)}k`
                      : "0"
                  }
                  bg="bg-pink-50"
                  text="text-pink-600"
                />
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3">
                  <TrophyOutlined className="text-gray-300 text-xl" />
                </div>
                <p className="text-[13px] font-medium text-gray-500 mb-1">
                  No performance data yet
                </p>
                <p className="text-[12px] text-gray-400">
                  Complete some quizzes to see your stats here
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <HistoryOutlined className="text-gray-400 text-sm" />
              <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
                Recent activity
              </p>
            </div>

            {recentQuizzes.length > 0 ? (
              <div className="flex flex-col gap-2">
                {recentQuizzes.map((quiz, i) => (
                  <div
                    key={i}
                    className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-4"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <PlayCircleOutlined className="text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-gray-800 truncate">
                        {quiz.title || "Quiz"}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {quiz.date}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[15px] font-medium text-gray-800 tabular-nums">
                        {quiz.score?.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-gray-400">#{quiz.rank}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3">
                  <HistoryOutlined className="text-gray-300 text-xl" />
                </div>
                <p className="text-[13px] font-medium text-gray-500 mb-1">
                  No recent activity
                </p>
                <p className="text-[12px] text-gray-400 mb-5">
                  Join your first quiz to see history here
                </p>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="inline-flex items-center gap-2 border border-blue-200 rounded-lg px-4 py-2 text-[13px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <PlayCircleOutlined /> Join a quiz now
                </button>
              </div>
            )}
          </div>

          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400 mb-3">
              Tips to score higher
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <TipCard
                icon="⚡"
                tip="Answer quickly — faster responses earn speed bonus points on top of base score."
              />
              <TipCard
                icon="🔥"
                tip="Keep your answer streak alive. Consecutive correct answers multiply your points."
              />
              <TipCard
                icon="🎯"
                tip="Every correct answer starts at 1000 base points. Accuracy matters as much as speed."
              />
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}