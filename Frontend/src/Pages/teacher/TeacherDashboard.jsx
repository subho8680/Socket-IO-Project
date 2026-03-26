import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Tag, Avatar, Tooltip } from "antd";
import {
  PlusOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  TrophyOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  RightOutlined,
} from "@ant-design/icons";
import DashboardLayout from "../../components/common/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { mockRooms, mockTeacherStats } from "../../data/mockData";

const STAT_CARDS = (stats) => [
  {
    label: "Rooms Created",
    value: stats.totalRooms,
    icon: <ThunderboltOutlined />,
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.12)",
  },
  {
    label: "Total Students",
    value: stats.totalStudents,
    icon: <TeamOutlined />,
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.12)",
  },
  {
    label: "Quizzes Run",
    value: stats.quizzesRun,
    icon: <PlayCircleOutlined />,
    color: "#10b981",
    bg: "rgba(16,185,129,0.12)",
  },
  {
    label: "Avg Score %",
    value: `${stats.avgScore}%`,
    icon: <TrophyOutlined />,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
  },
];

const STATUS_CONFIG = {
  active: {
    color: "#10b981",
    bg: "rgba(16,185,129,0.15)",
    icon: <SyncOutlined spin />,
    label: "Live",
  },
  waiting: {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.15)",
    icon: <ClockCircleOutlined />,
    label: "Waiting",
  },
  completed: {
    color: "#8b8ba7",
    bg: "rgba(139,139,167,0.15)",
    icon: <CheckCircleOutlined />,
    label: "Completed",
  },
};

function RoomCard({ room }) {
  const navigate = useNavigate();
  const cfg = STATUS_CONFIG[room.status];

  return (
    <div
      className="p-5 rounded-2xl transition-all duration-200 cursor-pointer group"
      style={{ background: "#12121f", border: "1px solid #1e1e35" }}
      onClick={() =>
        navigate(
          room.status === "completed"
            ? `/teacher/room/${room.id}/results`
            : `/teacher/room/${room.id}`,
        )
      }
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="px-2 py-0.5 rounded-md text-xs font-semibold"
              style={{
                background: cfg.bg,
                color: cfg.color,
                border: `1px solid ${cfg.color}30`,
              }}
            >
              {cfg.icon} {cfg.label}
            </span>
          </div>
          <h3 className="font-bold text-txt-primary text-base truncate">
            {room.title}
          </h3>
          <p className="text-xs text-txt-secondary mt-0.5 truncate">
            {room.topic}
          </p>
        </div>
        <div
          className="ml-3 px-3 py-1.5 rounded-lg flex-shrink-0"
          style={{ background: "#0d0d18", border: "1px solid #1e1e35" }}
        >
          <div className="font-mono text-brand-light text-sm font-bold tracking-widest">
            {room.id}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-txt-secondary mb-4">
        <span className="flex items-center gap-1.5">
          <TeamOutlined /> {room.students} students
        </span>
        <span className="flex items-center gap-1.5">
          <ThunderboltOutlined /> {room.questions} questions
        </span>
        <span className="flex items-center gap-1.5">
          <ClockCircleOutlined /> {room.duration}m
        </span>
      </div>

      {room.status === "completed" && room.avgScore > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-txt-secondary">Avg. Score</span>
            <span className="text-txt-primary font-semibold">
              {room.avgScore.toLocaleString()} pts
            </span>
          </div>
          <div
            className="w-full h-1.5 rounded-full overflow-hidden"
            style={{ background: "#1e1e35" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${(room.avgScore / 10000) * 100}%`,
                background: "linear-gradient(90deg,#7c3aed,#06b6d4)",
              }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {room.status === "waiting" && (
          <Button
            size="small"
            type="primary"
            icon={<PlayCircleOutlined />}
            style={{
              background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
              border: "none",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/teacher/room/${room.id}`);
            }}
          >
            Start Quiz
          </Button>
        )}
        {room.status === "active" && (
          <Button
            size="small"
            type="primary"
            icon={<EyeOutlined />}
            style={{
              background: "rgba(16,185,129,0.2)",
              border: "1px solid rgba(16,185,129,0.4)",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: "#10b981",
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/teacher/room/${room.id}`);
            }}
          >
            View Live
          </Button>
        )}
        {room.status === "completed" && (
          <Button
            size="small"
            icon={<TrophyOutlined />}
            style={{
              background: "transparent",
              border: "1px solid #1e1e35",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: "#8b8ba7",
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/teacher/room/${room.id}/results`);
            }}
          >
            View Results
          </Button>
        )}
        <div className="ml-auto flex items-center text-txt-muted text-xs">
          {room.createdAt}
        </div>
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const stats = mockTeacherStats;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const filtered =
    filter === "all" ? mockRooms : mockRooms.filter((r) => r.status === filter);
  const firstName = user?.name?.split(" ")[0] || "Teacher";

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-up">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-txt-primary">
              {greeting()}, {firstName} 👋
            </h1>
            <p className="text-txt-secondary text-sm mt-1">
              {user?.subject ? `${user.subject} · ` : ""}Manage your quiz rooms
              below
            </p>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => navigate("/teacher/create-room")}
            style={{
              background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
              border: "none",
              height: 46,
              paddingInline: 24,
              fontWeight: 700,
              borderRadius: 12,
            }}
          >
            New Room
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {STAT_CARDS(stats).map((s, i) => (
            <div
              key={s.label}
              className="p-5 rounded-2xl animate-fade-up"
              style={{
                background: "#12121f",
                border: "1px solid #1e1e35",
                animationDelay: `${i * 0.07}s`,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-base"
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

        {mockRooms.some((r) => r.status === "active") && (
          <div
            className="mb-6 p-4 rounded-2xl flex items-center gap-4 animate-fade-up cursor-pointer"
            style={{
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.3)",
            }}
            onClick={() =>
              navigate(
                `/teacher/room/${mockRooms.find((r) => r.status === "active").id}`,
              )
            }
          >
            <span className="w-3 h-3 rounded-full bg-success animate-pulse flex-shrink-0" />
            <div className="flex-1">
              <span className="font-semibold text-success text-sm">
                You have a live session running!
              </span>
              <span className="text-txt-secondary text-xs ml-2">
                {mockRooms.find((r) => r.status === "active")?.title} ·{" "}
                {mockRooms.find((r) => r.status === "active")?.students}{" "}
                students connected
              </span>
            </div>
            <RightOutlined style={{ color: "#10b981", fontSize: 12 }} />
          </div>
        )}

        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-txt-primary text-lg">Your Rooms</h2>
          <div
            className="flex gap-1 p-1 rounded-xl"
            style={{ background: "#12121f", border: "1px solid #1e1e35" }}
          >
            {["all", "active", "waiting", "completed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                style={{
                  background:
                    filter === f
                      ? "linear-gradient(135deg,#7c3aed,#5b21b6)"
                      : "transparent",
                  color: filter === f ? "#fff" : "#8b8ba7",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((room, i) => (
            <div
              key={room.id}
              className="animate-fade-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <RoomCard room={room} />
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-16 text-txt-muted">
              <div className="text-4xl mb-3">📭</div>
              <p className="font-medium">No rooms in this category</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
