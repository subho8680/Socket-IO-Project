import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // Added for animations
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
  FireOutlined,
  BookOutlined,
  CalendarOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import DashboardLayout from "../../components/common/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { useGetAllQuizRooms, useUpdateRoom } from "../../ApiCall";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatScheduled(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normaliseRoom(raw) {
  const quiz = raw.quizId || {};
  const totalTime = (quiz.questions || []).reduce(
    (acc, q) => acc + (q.timeLimit || 30),
    0,
  );
  return {
    _id: raw._id,
    id: raw.roomCode,
    title: quiz.name || "Untitled Quiz",
    topic: quiz.topic || "",
    difficulty: quiz.difficulty || "",
    status: raw.status,
    questions: (quiz.questions || []).length,
    duration: Math.ceil(totalTime / 60),
    avgScore: 0,
    scheduledAt: raw.scheduledAt || null,
    createdAt: formatDate(raw.createdAt),
  };
}

function StatCard({ label, value, icon, change, iconBg, iconText }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 shadow-sm">
      <div className="flex items-center justify-between">
        <span
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-base ${iconBg} ${iconText}`}
        >
          {icon}
        </span>
        {change && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            <ArrowUpOutlined style={{ fontSize: 9 }} />
            {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-[28px] font-bold text-slate-800 tracking-tight leading-none mb-1">
          {value ?? "—"}
        </p>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
          {label}
        </p>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
      <div className="h-[3px] w-full bg-slate-100 rounded mb-5" />
      <div className="flex justify-between gap-3 mb-4">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-100 rounded-lg w-16" />
          <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
          <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
        </div>
        <div className="w-20 h-12 bg-slate-100 rounded-xl" />
      </div>
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-16 bg-slate-100 rounded-lg" />
        <div className="h-6 w-16 bg-slate-100 rounded-lg" />
      </div>
      <div className="flex justify-between pt-3 border-t border-slate-50">
        <div className="h-7 w-24 bg-slate-100 rounded-xl" />
        <div className="h-3 w-16 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

function RoomCard({ room }) {
  const navigate = useNavigate();

  const cfg = {
    active: {
      badgeBg: "bg-emerald-50",
      badgeText: "text-emerald-700",
      badgeBorder: "border-emerald-200",
      dot: "bg-emerald-500",
      pulse: true,
      icon: <SyncOutlined spin style={{ fontSize: 10 }} />,
      label: "Live",
      topBar: "bg-emerald-500",
      actionBg: "bg-emerald-600 hover:bg-emerald-700",
      actionText: "text-white",
      actionLabel: "View Live",
      actionIcon: <EyeOutlined />,
    },
    waiting: {
      badgeBg: "bg-orange-50",
      badgeText: "text-orange-700",
      badgeBorder: "border-orange-200",
      dot: "bg-orange-400",
      pulse: false,
      icon: <ClockCircleOutlined style={{ fontSize: 10 }} />,
      label: "Waiting",
      topBar: "bg-orange-400",
      actionBg: "bg-blue-600 hover:bg-blue-700",
      actionText: "text-white",
      actionLabel: "Start Quiz",
      actionIcon: <PlayCircleOutlined />,
    },
    scheduled: {
      badgeBg: "bg-violet-50",
      badgeText: "text-violet-700",
      badgeBorder: "border-violet-200",
      dot: "bg-violet-400",
      pulse: false,
      icon: <CalendarOutlined style={{ fontSize: 10 }} />,
      label: "Scheduled",
      topBar: "bg-violet-400",
      actionBg: "bg-violet-600 hover:bg-violet-700",
      actionText: "text-white",
      actionLabel: "View Room",
      actionIcon: <EyeOutlined />,
    },
    finished: {
      badgeBg: "bg-slate-100",
      badgeText: "text-slate-500",
      badgeBorder: "border-slate-200",
      dot: "bg-slate-400",
      pulse: false,
      icon: <CheckCircleOutlined style={{ fontSize: 10 }} />,
      label: "Completed",
      topBar: "bg-slate-300",
      actionBg: "bg-slate-700 hover:bg-slate-800",
      actionText: "text-white",
      actionLabel: "View Results",
      actionIcon: <TrophyOutlined />,
    },
  };

  const s = cfg[room.status] ?? cfg.waiting;
  const dest =
    room.status === "finished"
      ? `/teacher/room/${room._id}/results`
      : `/teacher/room/${room._id}`;

  return (
    <div
      onClick={() => navigate(dest)}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-250 cursor-pointer overflow-hidden group h-full"
    >
      <div className={`h-[3px] w-full ${s.topBar}`} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border mb-2.5 ${s.badgeBg} ${s.badgeText} ${s.badgeBorder}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${s.dot} ${s.pulse ? "animate-pulse" : ""}`}
              />
              {s.icon}&nbsp;{s.label}
            </span>
            <h3 className="text-[15px] font-bold text-slate-800 truncate leading-snug group-hover:text-blue-600 transition-colors duration-200">
              {room.title}
            </h3>
            {room.topic && (
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {room.topic}
              </p>
            )}
          </div>

          <div className="flex-shrink-0 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-center min-w-[80px]">
            <p className="font-mono text-[13px] font-bold tracking-[0.12em] text-blue-600">
              {room.id}
            </p>
            <p className="text-[9px] text-blue-400 font-semibold uppercase tracking-wider mt-0.5">
              Room
            </p>
          </div>
        </div>

        {room.status === "scheduled" && room.scheduledAt && (
          <div className="flex items-center gap-2 mb-3 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2">
            <CalendarOutlined className="text-violet-500 text-xs" />
            <p className="text-xs font-semibold text-violet-700">
              Starts {formatScheduled(room.scheduledAt)}
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
            <ThunderboltOutlined style={{ fontSize: 11, color: "#64748b" }} />
            {room.questions} Qs
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
            <ClockCircleOutlined style={{ fontSize: 11, color: "#64748b" }} />~
            {room.duration}m
          </span>
          {room.difficulty && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
              {room.difficulty}
            </span>
          )}
        </div>

        {room.status === "finished" && room.avgScore > 0 && (
          <div className="mb-4 bg-slate-50 rounded-xl p-3">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Avg. score</span>
              <span className="font-bold text-slate-700">
                {room.avgScore.toLocaleString()} pts
              </span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min((room.avgScore / 10000) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(dest);
            }}
            className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl active:scale-95 transition-all shadow-sm ${s.actionBg} ${s.actionText}`}
          >
            {s.actionIcon} {s.actionLabel}
          </button>
          <span className="text-[11px] text-slate-300">{room.createdAt}</span>
        </div>
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");
  const updateRoom = useUpdateRoom();
  const { data, isLoading, isError } = useGetAllQuizRooms();
  const rooms = (data?.rooms || []).map(normaliseRoom);
  console.log("all rooms are", data);
  const stats = {
    totalRooms: rooms.length,
    quizzesRun: rooms.filter(
      (r) => r.status === "finished" || r.status === "active",
    ).length,
    scheduled: rooms.filter((r) => r.status === "scheduled").length,
    activeRooms: rooms.filter((r) => r.status === "active").length,
  };

  const activeRoom = rooms.find((r) => r.status === "active") ?? null;
  const filters = ["all", "active", "waiting", "scheduled", "finished"];
  const filteredRooms =
    filter === "all" ? rooms : rooms.filter((r) => r.status === filter);

  const firstName =
    user?.user?.name?.split(" ")[0] || user?.name?.split(" ")[0] || "Teacher";
  const initials = firstName.slice(0, 2).toUpperCase();

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#F6F8FA]">
        <div className="bg-white border-b border-slate-100 px-6 py-6">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-base select-none shadow-md shadow-blue-200">
                  {initials}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium">
                  {getGreeting()}
                </p>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                  {firstName} 👋
                </h1>
              </div>
            </div>

            <button
              onClick={() => navigate("/teacher/create-room")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-200 transition-all duration-200 self-start sm:self-auto"
            >
              <PlusOutlined /> New Room
            </button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              Overview
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Rooms"
                value={isLoading ? null : stats.totalRooms}
                icon={<BookOutlined />}
                iconBg="bg-blue-50"
                iconText="text-blue-600"
              />
              <StatCard
                label="Quizzes Run"
                value={isLoading ? null : stats.quizzesRun}
                icon={<FireOutlined />}
                iconBg="bg-orange-50"
                iconText="text-orange-500"
              />
              <StatCard
                label="Scheduled"
                value={isLoading ? null : stats.scheduled}
                icon={<CalendarOutlined />}
                iconBg="bg-violet-50"
                iconText="text-violet-600"
              />
              <StatCard
                label="Live Now"
                value={isLoading ? null : stats.activeRooms}
                icon={<SyncOutlined />}
                iconBg="bg-emerald-50"
                iconText="text-emerald-600"
                change={
                  !isLoading && stats.activeRooms > 0 ? "Active" : undefined
                }
              />
            </div>
          </div>

          {isError && (
            <div className="flex items-center gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-2xl">
              <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
              <p className="text-sm font-semibold text-red-600">
                Failed to load rooms. Please refresh.
              </p>
            </div>
          )}

          {activeRoom && (
            <div
              onClick={() => navigate(`/teacher/room/${activeRoom.id}`)}
              className="flex items-center gap-4 px-5 py-4 bg-emerald-600 rounded-2xl cursor-pointer hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-100 group"
            >
              <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">
                  Live session running
                </p>
                <p className="text-xs text-emerald-100 mt-0.5 truncate">
                  {activeRoom.title} · {activeRoom.questions} questions
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex-shrink-0">
                View <RightOutlined style={{ fontSize: 9 }} />
              </span>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                  <CalendarOutlined className="text-blue-500 text-sm" />
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-slate-800 leading-tight">
                    Your Rooms
                  </h2>
                  {!isLoading && rooms.length > 0 && (
                    <p className="text-[11px] text-slate-400">
                      {rooms.length} rooms total
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-100 rounded-xl overflow-x-auto no-scrollbar relative">
                {filters.map((f) => {
                  const isActive = filter === f;
                  const count = rooms.filter((r) => r.status === f).length;
                  return (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-lg capitalize whitespace-nowrap transition-colors duration-300 z-10 ${
                        isActive
                          ? "text-blue-600"
                          : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeFilterPill"
                          className="absolute inset-0 bg-white border border-slate-200 shadow-sm rounded-lg z-[-1]"
                          transition={{
                            type: "spring",
                            bounce: 0.2,
                            duration: 0.6,
                          }}
                        />
                      )}
                      <span className="relative flex items-center">
                        {f}
                        {f !== "all" && !isLoading && count > 0 && (
                          <span
                            className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${
                              isActive
                                ? "bg-blue-100 text-blue-600"
                                : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <motion.div
                    key="skeleton-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {[...Array(4)].map((_, i) => (
                      <SkeletonCard key={i} />
                    ))}
                  </motion.div>
                ) : filteredRooms.length > 0 ? (
                  <motion.div
                    key="rooms-grid"
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {filteredRooms.map((room) => (
                      <motion.div
                        key={room._id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <RoomCard room={room} />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty-state"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center py-16 text-center"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                      <BookOutlined className="text-blue-400 text-xl" />
                    </div>
                    <p className="text-sm font-bold text-slate-500 mb-1">
                      No rooms yet
                    </p>
                    <p className="text-xs text-slate-400 mb-6 max-w-xs">
                      {filter === "all"
                        ? "Create your first room and share the code with students."
                        : `No ${filter} rooms right now.`}
                    </p>
                    {filter === "all" && (
                      <button
                        onClick={() => navigate("/teacher/create-room")}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-sm shadow-blue-100 transition-all"
                      >
                        <PlusOutlined /> Create first room
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
