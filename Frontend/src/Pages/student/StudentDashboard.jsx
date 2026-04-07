import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, message, Empty } from "antd";
import {
  ThunderboltOutlined,
  TrophyOutlined,
  PlayCircleOutlined,
  ArrowRightOutlined,
  HistoryOutlined,
  StarOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import DashboardLayout from "../../components/common/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../Services/Usesocket";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { on, joinRoom } = useSocket();

  const [roomCode, setRoomCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [navigating, setNavigating] = useState(false);

  const firstName = user?.user?.name?.split(" ")[0] || "Student";

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  };

  const stats = null;
  const recentQuizzes = []; 

  const handleJoin = async () => {
    if (!roomCode.trim()) {
      message.warning("Please enter a room code");
      return;
    }

    const code = roomCode.trim().toUpperCase();
    if (code.length < 4) {
      message.error("Invalid room code");
      return;
    }

    setJoining(true);
    joinRoom(code, user?.user?.name);
  };

  useEffect(() => {
    const joinSuccess = on("join-success", ({ roomId }) => {
      message.success("Joined room successfully! 🎉");
      setNavigating(true);
      setTimeout(() => {
        setNavigating(false);
        navigate(`/student/room/${roomId}`);
      }, 600);
    });

    const joinError = on("join-error", ({ msg }) => {
      message.error(msg || "Failed to join room");
      setJoining(false);
    });

    return () => {
      joinSuccess();
      joinError();
    };
  }, [on, navigate]);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="mb-10">
            <h1 className="text-3xl font-semibold tracking-tight">
              {greeting()}, {firstName} 👋
            </h1>
            <p className="text-zinc-400 mt-1 text-lg">
              Ready to test your knowledge? Join a live quiz now.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 mb-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-violet-500/10 to-transparent rounded-full -translate-y-1/3 translate-x-1/3" />

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-3xl">
                  🚀
                </div>
                <div>
                  <h2 className="text-2xl font-semibold">Join Live Quiz</h2>
                  <p className="text-zinc-400 text-sm">
                    Enter the room code shared by your teacher
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  onPressEnter={handleJoin}
                  placeholder="Enter room code (e.g. ABCD1234)"
                  size="large"
                  maxLength={12}
                  className="bg-zinc-950 border-zinc-700 text-lg font-mono tracking-widest h-14 rounded-2xl"
                />

                <Button
                  type="primary"
                  size="large"
                  loading={joining || navigating}
                  onClick={handleJoin}
                  className="h-14 px-10 text-base font-semibold rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110 flex-shrink-0"
                >
                  Join Quiz
                </Button>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-zinc-400 flex items-center gap-2">
                <RocketOutlined /> Your Performance
              </h3>
              {stats && (
                <span className="text-xs text-zinc-500">This month</span>
              )}
            </div>

            {stats ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  {
                    label: "Quizzes Taken",
                    value: stats.quizzesTaken || 0,
                    icon: <PlayCircleOutlined />,
                    color: "#7c3aed",
                    bg: "rgba(124,58,237,0.15)",
                  },
                  {
                    label: "Avg Score",
                    value: `${stats.avgScore || 0}%`,
                    icon: <ThunderboltOutlined />,
                    color: "#06b6d4",
                    bg: "rgba(6,182,212,0.15)",
                  },
                  {
                    label: "Best Rank",
                    value: stats.bestRank ? `#${stats.bestRank}` : "--",
                    icon: <TrophyOutlined />,
                    color: "#f59e0b",
                    bg: "rgba(245,158,11,0.15)",
                  },
                  {
                    label: "Total Points",
                    value: stats.totalPoints
                      ? `${(stats.totalPoints / 1000).toFixed(1)}k`
                      : "0k",
                    icon: <StarOutlined />,
                    color: "#10b981",
                    bg: "rgba(16,185,129,0.15)",
                  },
                ].map((stat, index) => (
                  <div
                    key={index}
                    className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-600 transition-all"
                  >
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5"
                      style={{ background: stat.bg, color: stat.color }}
                    >
                      {stat.icon}
                    </div>
                    <div className="text-3xl font-bold text-white mb-1 tabular-nums">
                      {stat.value}
                    </div>
                    <div className="text-sm text-zinc-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl py-16 text-center">
                <Empty
                  description={
                    <div>
                      <p className="text-zinc-400">No performance data yet</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Complete some quizzes to see your stats here
                      </p>
                    </div>
                  }
                />
              </div>
            )}
          </div>

          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <HistoryOutlined className="text-xl text-zinc-400" />
                <h3 className="text-lg font-semibold">Recent Activity</h3>
              </div>
            </div>

            {recentQuizzes.length > 0 ? (
              <div className="space-y-4">
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl py-20 text-center">
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div>
                      <p className="text-zinc-400 mb-1">
                        No recent quizzes yet
                      </p>
                      <p className="text-xs text-zinc-500">
                        Join your first live quiz to see history here
                      </p>
                    </div>
                  }
                />
                <Button
                  type="primary"
                  className="mt-6 rounded-2xl bg-violet-600 hover:bg-violet-500"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                >
                  Join a Quiz Now
                </Button>
              </div>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
              💡 Quick Tips to Improve
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: "⚡",
                  tip: "Answer quickly to earn speed bonus points",
                },
                {
                  icon: "🔥",
                  tip: "Maintain your streak for score multipliers",
                },
                {
                  icon: "🎯",
                  tip: "Every correct answer gives 1000 base points",
                },
              ].map((t, i) => (
                <div
                  key={i}
                  className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-600 transition-colors"
                >
                  <div className="text-2xl mb-3">{t.icon}</div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {t.tip}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
