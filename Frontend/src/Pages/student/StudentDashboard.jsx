import React, { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, message } from "antd";
import {
  ThunderboltOutlined,
  TrophyOutlined,
  PlayCircleOutlined,
  ArrowRightOutlined,
  HistoryOutlined,
  StarOutlined,
} from "@ant-design/icons";
import DashboardLayout from "../../components/common/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { mockStudentHistory, mockStudentStats } from "../../data/mockData";
import { useSocket } from "../../Services/Usesocket";
const RANK_COLORS = ["#f59e0b", "#8b8ba7", "#cd7f32"];

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  console.log("user data is", user);
  const [roomCode, setRoomCode] = useState("");
  const [joining, setJoining] = useState(false);
  const firstName = user?.user?.name?.split(" ")[0] || "Student";
  const stats = mockStudentStats;
  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  };
  const {on,joinRoom} = useSocket();
  const handleJoin = async () => {
    if (!roomCode.trim()) {
      message.warning("Enter a room code");
      return;
    }
    const code = roomCode.trim().toUpperCase();
    if (code.length < 4) {
      message.error("Invalid room code");
      return;
    }
    joinRoom(roomCode,user.user.name);
  };
  console.log("user details is",user)
  const [navigating, setnavigating] = useState(false)
  useEffect(() => {
    const joinSuccess = on("join-success",({roomId,studentName})=>{
      message.success("Joined Room Successfully");
      setnavigating(true);
      setTimeout(() => {
        setnavigating(false)
        navigate(`/room/${roomId}/waiting`);
      }, 500);
    })
    const joinError = on("join-error",({msg})=>{
      message.error(msg);
    })
    return ()=>{
      joinSuccess();
      joinError();
    }
  }, [on])
  
  const STAT_CARDS = [
    {
      label: "Quizzes Taken",
      value: stats.quizzesTaken,
      icon: <PlayCircleOutlined />,
      color: "#7c3aed",
      bg: "rgba(124,58,237,0.15)",
    },
    {
      label: "Avg Score %",
      value: `${stats.avgScore}%`,
      icon: <ThunderboltOutlined />,
      color: "#06b6d4",
      bg: "rgba(6,182,212,0.15)",
    },
    {
      label: "Best Rank",
      value: `#${stats.bestRank}`,
      icon: <TrophyOutlined />,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.15)",
    },
    {
      label: "Total Points",
      value: `${(stats.totalPoints / 1000).toFixed(1)}k`,
      icon: <StarOutlined />,
      color: "#10b981",
      bg: "rgba(16,185,129,0.15)",
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-8 animate-fade-up">
          <h1 className="text-2xl md:text-3xl font-bold text-txt-primary">
            {greeting()}, {firstName} 🎮
          </h1>
          <p className="text-txt-secondary text-sm mt-1">
            Ready to compete? Enter a room code to join a quiz.
          </p>
        </div>

        <div
          className="p-6 md:p-8 rounded-3xl mb-8 relative overflow-hidden animate-fade-up"
          style={{
            background:
              "linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(6,182,212,0.1) 100%)",
            border: "1px solid rgba(124,58,237,0.35)",
          }}
        >
          <div
            className="absolute pointer-events-none"
            style={{
              top: "-30%",
              right: "-5%",
              width: 250,
              height: 250,
              background:
                "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
              borderRadius: "50%",
            }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{
                  background: "rgba(124,58,237,0.3)",
                  border: "1px solid rgba(124,58,237,0.4)",
                }}
              >
                🚀
              </div>
              <div>
                <h2 className="text-lg font-bold text-txt-primary">
                  Join a Quiz Room
                </h2>
                <p className="text-xs text-txt-secondary">
                  Get the room code from your teacher
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                onPressEnter={handleJoin}
                placeholder="Enter room code  e.g. BB-4X9K"
                size="large"
                maxLength={10}
                style={{
                  borderRadius: 12,
                  height: 52,
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(124,58,237,0.4)",
                  color: "#f1f1f8",
                  flex: 1,
                }}
              />
              <Button
                type="primary"
                size="large"
                loading={joining}
                onClick={handleJoin}
                style={{
                  height: 52,
                  paddingInline: 28,
                  background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
                  border: "none",
                  fontWeight: 700,
                  borderRadius: 12,
                  fontSize: 15,
                }}
              >
                {joining ? "Joining..." : "Join →"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS.map((s, i) => (
            <div
              key={s.label}
              className="p-5 rounded-2xl animate-fade-up"
              style={{
                background: "#12121f",
                border: "1px solid #1e1e35",
                animationDelay: `${i * 0.05}s`,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: s.bg, color: s.color }}
              >
                {s.icon}
              </div>
              <div className="text-2xl font-black text-txt-primary">
                {s.value}
              </div>
              <div className="text-xs text-txt-secondary mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-2 mb-4">
            <HistoryOutlined style={{ color: "#8b8ba7" }} />
            <h2 className="font-bold text-txt-primary text-lg">
              Recent Quizzes
            </h2>
          </div>
          <div className="space-y-3">
            {mockStudentHistory.map((item) => {
              const rankColor =
                item.rank <= 3 ? RANK_COLORS[item.rank - 1] : "#8b8ba7";
              return (
                <div
                  key={item.roomId}
                  onClick={() =>
                    navigate(`/student/room/${item.roomId}/results`)
                  }
                  className="p-4 rounded-xl cursor-pointer transition-all duration-200 hover:border-bg-border flex items-start justify-between"
                  style={{ background: "#12121f", border: "1px solid #1e1e35" }}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-txt-primary text-sm truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-txt-secondary">
                      {item.subject} · {item.date}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-txt-secondary">
                      <span>
                        {item.correct}/{item.total_q} correct
                      </span>
                      <span className="font-bold text-txt-primary">
                        {item.score.toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end flex-shrink-0">
                    <div
                      className="font-black text-sm"
                      style={{ color: rankColor }}
                    >
                      {item.rank <= 3
                        ? ["🥇", "🥈", "🥉"][item.rank - 1]
                        : `#${item.rank}`}
                    </div>
                    <div className="text-xs text-txt-muted">
                      of {item.total}
                    </div>
                    <ArrowRightOutlined
                      style={{ fontSize: 11, color: "#4b4b68", marginTop: 8 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="mt-8 p-5 rounded-2xl animate-fade-up"
          style={{
            background: "#12121f",
            border: "1px solid #1e1e35",
            animationDelay: "0.25s",
          }}
        >
          <h3 className="font-bold text-txt-primary text-sm mb-3">
            💡 Pro Tips
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: "⚡", tip: "Answer faster for speed bonus points" },
              { icon: "🔥", tip: "Keep a streak alive for multiplier bonus" },
              { icon: "🎯", tip: "Every correct answer = 1000 base points" },
            ].map((t) => (
              <div
                key={t.tip}
                className="flex items-start gap-2 p-3 rounded-xl"
                style={{ background: "#0d0d18", border: "1px solid #1e1e35" }}
              >
                <span className="text-lg flex-shrink-0">{t.icon}</span>
                <span className="text-xs text-txt-secondary leading-relaxed">
                  {t.tip}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
