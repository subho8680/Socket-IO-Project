import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Avatar, Empty } from "antd";
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
      className="p-6 rounded-3xl transition-all duration-200 cursor-pointer hover:border-zinc-600 group"
      style={{ background: "#12121f", border: "1px solid #1e1e35" }}
      onClick={() =>
        navigate(
          room.status === "completed"
            ? `/teacher/room/${room.id}/results`
            : `/teacher/room/${room.id}`,
        )
      }
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              style={{
                background: cfg.bg,
                color: cfg.color,
                border: `1px solid ${cfg.color}40`,
              }}
            >
              {cfg.icon} {cfg.label}
            </span>
          </div>
          <h3 className="font-semibold text-lg text-white truncate group-hover:text-violet-400 transition-colors">
            {room.title}
          </h3>
          <p className="text-sm text-zinc-400 mt-1 truncate">{room.topic}</p>
        </div>

        <div
          className="ml-4 px-4 py-2 rounded-2xl flex-shrink-0 text-center"
          style={{ background: "#0d0d18", border: "1px solid #1e1e35" }}
        >
          <div className="font-mono text-sm font-bold tracking-widest text-indigo-400">
            {room.id}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5 text-sm text-zinc-400 mb-6">
        <span className="flex items-center gap-1.5">
          <TeamOutlined /> {room.students} students
        </span>
        <span className="flex items-center gap-1.5">
          <ThunderboltOutlined /> {room.questions} Qs
        </span>
        <span className="flex items-center gap-1.5">
          <ClockCircleOutlined /> {room.duration}m
        </span>
      </div>

      {room.status === "completed" && room.avgScore > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-zinc-400 mb-2">
            <span>Avg. Score</span>
            <span className="text-white font-medium">
              {room.avgScore.toLocaleString()} pts
            </span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min((room.avgScore / 10000) * 100, 100)}%`,
                background: "linear-gradient(90deg, #7c3aed, #06b6d4)",
              }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {room.status === "waiting" && (
          <Button
            size="small"
            type="primary"
            icon={<PlayCircleOutlined />}
            className="rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 border-0"
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
            icon={<EyeOutlined />}
            className="rounded-xl text-sm font-semibold border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
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
            className="rounded-xl text-sm font-semibold border-zinc-700 text-zinc-400 hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/teacher/room/${room.id}/results`);
            }}
          >
            View Results
          </Button>
        )}

        <div className="ml-auto text-xs text-zinc-500 flex items-center">
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

  // Will be replaced with real data from API later
  const stats = null;
  const rooms = [];
  const activeRoom = null;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const filteredRooms =
    filter === "all" ? rooms : rooms.filter((r) => r.status === filter);

  const firstName = user?.name?.split(" ")[0] || "Teacher";

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {greeting()}, {firstName} 👋
            </h1>
            <p className="text-zinc-400 mt-1">Manage your quiz rooms</p>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => navigate("/teacher/create-room")}
            className="h-12 px-8 text-base font-semibold rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-110"
          >
            New Room
          </Button>
        </div>

        {/* Stats Section */}
        <div className="mb-12">
          <h3 className="text-lg font-medium text-zinc-400 mb-6">Overview</h3>

          {stats ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Stats cards will go here when data is available */}
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl py-16 text-center">
              <Empty
                description={
                  <div>
                    <p className="text-zinc-400">No stats available yet</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Create rooms and run quizzes to see overview
                    </p>
                  </div>
                }
              />
            </div>
          )}
        </div>

        {/* Live Session Alert */}
        {activeRoom && (
          <div
            className="mb-8 p-5 rounded-3xl flex items-center gap-4 cursor-pointer hover:bg-emerald-500/5 transition-colors"
            style={{
              background: "rgba(16,185,129,0.08)",
              border: "1px solid rgba(16,185,129,0.3)",
            }}
            onClick={() => navigate(`/teacher/room/${activeRoom.id}`)}
          >
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <div className="flex-1">
              <span className="font-medium text-emerald-400">
                Live session is running
              </span>
              <span className="text-zinc-400 text-sm ml-3">
                {activeRoom.title} • {activeRoom.students} students
              </span>
            </div>
            <RightOutlined className="text-emerald-400" />
          </div>
        )}

        {/* Rooms Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Your Rooms</h2>

          <div className="flex gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
            {["all", "active", "waiting", "completed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 text-sm font-medium rounded-xl capitalize transition-all ${
                  filter === f
                    ? "bg-violet-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filteredRooms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredRooms.map((room, i) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl py-20 text-center">
            <Empty
              description={
                <div>
                  <p className="text-zinc-400">No rooms found</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Create a new room to get started
                  </p>
                </div>
              }
            />
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => navigate("/teacher/create-room")}
              className="mt-6 rounded-2xl bg-violet-600 hover:bg-violet-500"
            >
              Create New Room
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
