import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ConfigProvider, Tooltip, message, Skeleton } from "antd";
import {
  TrophyOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  LockOutlined,
  GlobalOutlined,
  PlusOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  DeleteOutlined,
  CopyOutlined,
  FireOutlined,
  CodeOutlined,
  ReloadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  useGetAllContest,
  usegetContestById,
} from "../../../Services/ContestAPI"; // ← adjust path
import { useNavigate } from "react-router-dom";

dayjs.extend(relativeTime);

const STATUS_MAP = {
  scheduled: "upcoming",
  running: "live",
  ended: "finished",
};

const STATUS_CONFIG = {
  live: {
    label: "Live",
    color: "#16A34A",
    bg: "#DCFCE7",
    border: "#BBF7D0",
    dot: true,
  },
  upcoming: {
    label: "Upcoming",
    color: "#D97706",
    bg: "#FEF9C3",
    border: "#FDE68A",
    dot: false,
  },
  finished: {
    label: "Finished",
    color: "#6B7280",
    bg: "#F3F4F6",
    border: "#E5E7EB",
    dot: false,
  },
};

const RANK_EMOJI = { 1: "🥇", 2: "🥈", 3: "🥉" };

function getRatingColor(r) {
  if (!r) return "#9CA3AF";
  if (r < 1200) return "#9CA3AF";
  if (r < 1400) return "#22C55E";
  if (r < 1600) return "#06B6D4";
  if (r < 1900) return "#3B82F6";
  if (r < 2100) return "#A855F7";
  if (r < 2400) return "#F97316";
  return "#EF4444";
}

function normalizeContest(raw) {
  return {
    id: raw._id,
    name: raw.name ?? "Untitled Contest",
    description: raw.description ?? "",
    status: STATUS_MAP[raw.status] ?? "upcoming",
    visibility: raw.visibility ?? "private",
    durationMinutes: raw.durationMinutes ?? 120,
    scheduledAt: raw.scheduledAt ?? raw.createdAt,
    createdAt: raw.createdAt,
    createdBy: raw.createdBy ?? "",
    problemCount: raw.problems?.length ?? 0,
    minRating: raw.problems?.length
      ? Math.min(...raw.problems.map((p) => p.rating ?? 800))
      : 800,
    maxRating: raw.problems?.length
      ? Math.max(...raw.problems.map((p) => p.rating ?? 800))
      : 1600,
    participants: raw.invitedEmails ?? [],
    inviteEmails: raw.invitedEmails ?? [],
    myRank: raw.myRank ?? null,
    mySolved: raw.mySolved ?? null,
    scoring: raw.scoring ?? "icpc",
    allowLateJoin: raw.allowLateJoin ?? true,
  };
}


function ContestTimeInfo({ contest }) {
  if (contest.status === "live") {
    const start = dayjs(contest.scheduledAt);
    const endTime = start.add(contest.durationMinutes, "minute");
    const remaining = endTime.diff(dayjs(), "minute");
    return (
      <span style={{ fontSize: 12, color: "#16A34A", fontWeight: 600 }}>
        {remaining > 0 ? `${remaining}m remaining` : "Ending soon"}
      </span>
    );
  }
  if (contest.status === "upcoming") {
    return (
      <span style={{ fontSize: 12, color: "#D97706", fontWeight: 500 }}>
        Starts {dayjs(contest.scheduledAt).fromNow()}
      </span>
    );
  }
  return (
    <span style={{ fontSize: 12, color: "#9CA3AF" }}>
      Ended{" "}
      {dayjs(contest.scheduledAt)
        .add(contest.durationMinutes, "minute")
        .fromNow()}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #EBEBEB",
        padding: "18px 22px",
      }}
    >
      <Skeleton active paragraph={{ rows: 2 }} />
    </div>
  );
}

function ErrorState({ message: msg, onRetry }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "48px 20px",
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #FEE2E2",
      }}
    >
      <WarningOutlined
        style={{
          fontSize: 36,
          color: "#EF4444",
          marginBottom: 12,
          display: "block",
        }}
      />
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#374151",
          marginBottom: 6,
        }}
      >
        Failed to load contests
      </div>
      <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 16 }}>
        {msg}
      </div>
      <button
        onClick={onRetry}
        style={{
          padding: "8px 20px",
          borderRadius: 9,
          border: "none",
          background: "#4F46E5",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "'Outfit',sans-serif",
        }}
      >
        Try again
      </button>
    </div>
  );
}

function ContestCard({ contest, onEnter, onReview, onCopy, isCurrentUser }) {
  const [hovering, setHovering] = useState(false);
  const cfg = STATUS_CONFIG[contest.status] ?? STATUS_CONFIG.upcoming;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        background: "#fff",
        borderRadius: 16,
        border: `1px solid ${hovering ? "rgba(79,70,229,.2)" : "#EBEBEB"}`,
        padding: "18px 22px",
        cursor: "pointer",
        transition: "border-color .18s, box-shadow .18s, transform .18s",
        boxShadow: hovering
          ? "0 4px 20px rgba(79,70,229,.1)"
          : "0 1px 3px rgba(0,0,0,.04)",
        transform: hovering ? "translateY(-2px)" : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 9px",
                borderRadius: 20,
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                fontSize: 11,
                fontWeight: 700,
                color: cfg.color,
              }}
            >
              {cfg.dot && (
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: cfg.color,
                    animation: "pulse 1.5s infinite",
                    display: "inline-block",
                  }}
                />
              )}
              {cfg.label}
            </span>

            <span
              style={{
                fontSize: 11,
                color: "#9CA3AF",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {contest.visibility === "public" ? (
                <>
                  <GlobalOutlined style={{ fontSize: 10 }} />
                  Public
                </>
              ) : (
                <>
                  <LockOutlined style={{ fontSize: 10 }} />
                  Private
                </>
              )}
            </span>

          </div>

          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#0F172A",
              marginBottom: 3,
              letterSpacing: "-0.2px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {contest.name}
          </div>
          {contest.description && (
            <div
              style={{
                fontSize: 12,
                color: "#9CA3AF",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {contest.description}
            </div>
          )}
        </div>

        {contest.status === "finished" && contest.myRank && (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              flexShrink: 0,
              marginLeft: 12,
              background: contest.myRank <= 3 ? "#FEF9C3" : "#F9FAFB",
              border: `1px solid ${contest.myRank <= 3 ? "#FDE68A" : "#E5E7EB"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: contest.myRank <= 3 ? 20 : 13,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {contest.myRank <= 3
                ? RANK_EMOJI[contest.myRank]
                : `#${contest.myRank}`}
            </span>
          </div>
        )}
      </div>

      <div
        style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14 }}
      >
        <span
          style={{
            fontSize: 12,
            color: "#6B7280",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <CodeOutlined style={{ fontSize: 11, color: "#9CA3AF" }} />
          {contest.problemCount} problems
        </span>
        <span
          style={{
            fontSize: 12,
            color: "#6B7280",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <ClockCircleOutlined style={{ fontSize: 11, color: "#9CA3AF" }} />
          {contest.durationMinutes}m
        </span>
        <span
          style={{
            fontSize: 12,
            color: "#6B7280",
            display: "flex",
            alignItems: "center",
            gap: 5,
          }}
        >
          <TeamOutlined style={{ fontSize: 11, color: "#9CA3AF" }} />
          {contest.participants.length} invited
        </span>
        {contest.minRating !== contest.maxRating && (
          <span
            style={{
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontWeight: 500,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: `linear-gradient(135deg,${getRatingColor(contest.minRating)},${getRatingColor(contest.maxRating)})`,
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span style={{ color: getRatingColor(contest.minRating) }}>
              {contest.minRating}
            </span>
            <span style={{ color: "#D1D5DB" }}>–</span>
            <span style={{ color: getRatingColor(contest.maxRating) }}>
              {contest.maxRating}
            </span>
          </span>
        )}
        {contest.status === "finished" && contest.mySolved !== null && (
          <span
            style={{
              fontSize: 12,
              color: "#6B7280",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <CheckCircleOutlined style={{ fontSize: 11, color: "#22C55E" }} />
            {contest.mySolved}/{contest.problemCount} solved
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <ContestTimeInfo contest={contest} />

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Tooltip title="Copy room code">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCopy(contest.id);
              }}
              style={{
                width: 32,
                height: 32,
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                background: "#FAFAFA",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9CA3AF",
              }}
            >
              <CopyOutlined style={{ fontSize: 13 }} />
            </button>
          </Tooltip>

          {contest.status === "live" && (
            <button
              onClick={() => onEnter(contest.id)}
              style={{
                padding: "7px 16px",
                borderRadius: 9,
                border: "none",
                background: "linear-gradient(135deg,#16A34A,#15803D)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Outfit',sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 2px 8px rgba(22,163,74,.3)",
              }}
            >
              <PlayCircleOutlined style={{ fontSize: 13 }} /> Enter
            </button>
          )}
          {contest.status === "upcoming" && (
            <button
              onClick={() => onEnter(contest.id)}
              style={{
                padding: "7px 16px",
                borderRadius: 9,
                border: "1.5px solid #4F46E5",
                background: "#EEF2FF",
                color: "#4F46E5",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              View
            </button>
          )}
          {contest.status === "finished" && (
            <button
              onClick={() => onReview(contest.id)}
              style={{
                padding: "7px 16px",
                borderRadius: 9,
                border: "1px solid #E5E7EB",
                background: "#FAFAFA",
                color: "#374151",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "'Outfit',sans-serif",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <EyeOutlined style={{ fontSize: 13 }} /> Review
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ContestDashboard({ onCreateContest, onEnterContest }) {
  const [tab, setTab] = useState("all");
  const [joinCode, setJoinCode] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch, isFetching } =
    useGetAllContest();

  const rawContests = data?.contests ?? [];
  const allContests = rawContests.map(normalizeContest);

  const liveCount = allContests.filter((c) => c.status === "live").length;
  const upcomingCount = allContests.filter(
    (c) => c.status === "upcoming",
  ).length;
  const finishedCount = allContests.filter(
    (c) => c.status === "finished",
  ).length;

  const TABS = [
    { id: "all", label: "All", count: allContests.length },
    { id: "live", label: "Live", count: liveCount },
    { id: "upcoming", label: "Upcoming", count: upcomingCount },
    { id: "finished", label: "Finished", count: finishedCount },
  ];

  const filtered =
    tab === "all" ? allContests : allContests.filter((c) => c.status === tab);

  const handleCopy = (id) => {
    navigator.clipboard?.writeText(id);
    messageApi.success("Room code copied!");
  };

  const handleJoin = () => {
    const code = joinCode.trim();
    if (!code) return;
    if (onEnterContest) onEnterContest(code);
    setJoinCode("");
  };

  const handleRefresh = () => refetch();

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#4F46E5",
          borderRadius: 10,
          fontFamily: "'Outfit',sans-serif",
        },
      }}
    >
      {contextHolder}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box}
        .db-wrap{min-height:100vh;background:#FAFAF9;padding:40px 20px 80px;font-family:'Outfit',sans-serif}
        .db-inner{max-width:760px;margin:0 auto}
        .db-tab{padding:8px 16px;border-radius:9px;border:none;background:transparent;font-size:13px;font-weight:500;color:#9CA3AF;cursor:pointer;font-family:'Outfit',sans-serif;transition:all .15s;display:flex;align-items:center;gap:6px}
        .db-tab.on{background:#EEF2FF;color:#4F46E5;font-weight:600}
        .db-tab:hover:not(.on){color:#374151;background:#F3F4F6}
        .db-join{display:flex;gap:10px;padding:16px 20px;background:#fff;border-radius:14px;border:1px solid rgba(79,70,229,.1);box-shadow:0 1px 3px rgba(0,0,0,.04),0 4px 16px rgba(79,70,229,.05)}
        .db-join-input{flex:1;padding:10px 14px;border:1.5px solid #E5E7EB;border-radius:10px;font-size:14px;color:#111827;background:#FAFAFA;font-family:'JetBrains Mono',monospace;outline:none;transition:all .15s;letter-spacing:.05em}
        .db-join-input:focus{border-color:#4F46E5;box-shadow:0 0 0 3px rgba(79,70,229,.1);background:#fff}
        .db-join-btn{padding:10px 20px;border-radius:10px;border:none;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:#fff;font-size:14px;font-weight:600;cursor:pointer;font-family:'Outfit',sans-serif;white-space:nowrap;transition:all .15s}
        .db-join-btn:hover{opacity:.9;transform:translateY(-1px)}
        .db-join-btn:disabled{background:#E5E7EB;color:#9CA3AF;cursor:not-allowed;transform:none}
        .db-stat{background:#fff;border-radius:14px;border:1px solid #EBEBEB;padding:16px 20px;display:flex;flex-direction:column;gap:4px}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="db-wrap">
        <div className="db-inner">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 28 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 6,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "linear-gradient(135deg,#4F46E5,#7C3AED)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 12px rgba(79,70,229,.3)",
                    }}
                  >
                    <TrophyOutlined style={{ color: "#fff", fontSize: 16 }} />
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#4F46E5",
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                    }}
                  >
                    CodeClash
                  </div>
                </div>
                <h1
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: "#0F172A",
                    margin: 0,
                    letterSpacing: "-0.5px",
                  }}
                >
                  Contest Dashboard
                </h1>
                <p
                  style={{ color: "#9CA3AF", fontSize: 13, margin: "4px 0 0" }}
                >
                  Your contests — created, invited, and upcoming
                </p>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <Tooltip title="Refresh">
                  <button
                    onClick={handleRefresh}
                    style={{
                      width: 38,
                      height: 38,
                      border: "1px solid #E5E7EB",
                      borderRadius: 10,
                      background: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#6B7280",
                    }}
                  >
                    <ReloadOutlined
                      style={{
                        fontSize: 14,
                        animation: isFetching
                          ? "spin .8s linear infinite"
                          : "none",
                      }}
                    />
                  </button>
                </Tooltip>
                <button
                  onClick={() => navigate("/room/create-contest")}
                  style={{
                    padding: "9px 18px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg,#4F46E5,#7C3AED)",
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'Outfit',sans-serif",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    boxShadow: "0 4px 14px rgba(79,70,229,.3)",
                  }}
                >
                  <PlusOutlined style={{ fontSize: 13 }} /> New Contest
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {[
              {
                label: "Total",
                value: allContests.length,
                icon: <TrophyOutlined />,
                color: "#4F46E5",
              },
              {
                label: "Live Now",
                value: liveCount,
                icon: <FireOutlined />,
                color: "#16A34A",
              },
              {
                label: "Upcoming",
                value: upcomingCount,
                icon: <CalendarOutlined />,
                color: "#D97706",
              },
              {
                label: "Completed",
                value: finishedCount,
                icon: <CheckCircleOutlined />,
                color: "#6B7280",
              },
            ].map((s) => (
              <div key={s.label} className="db-stat">
                <div
                  style={{
                    fontSize: 12,
                    color: "#9CA3AF",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{ color: s.color, fontSize: 12 }}>{s.icon}</span>
                  {s.label}
                </div>
                {isLoading ? (
                  <Skeleton.Input
                    active
                    size="small"
                    style={{ marginTop: 4 }}
                  />
                ) : (
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: "#0F172A",
                      letterSpacing: "-0.5px",
                      lineHeight: 1.2,
                    }}
                  >
                    {s.value}
                  </div>
                )}
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ marginBottom: 20 }}
          >
            <div className="db-join">
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: "#EEF2FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <CodeOutlined style={{ color: "#4F46E5", fontSize: 16 }} />
              </div>
              <input
                className="db-join-input"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                placeholder="Enter room code e.g. contest_1776891404267"
                maxLength={32}
              />
              <button
                className="db-join-btn"
                onClick={handleJoin}
                disabled={!joinCode.trim()}
              >
                Join →
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              display: "flex",
              gap: 4,
              marginBottom: 16,
              background: "#F3F0EB",
              borderRadius: 11,
              padding: 4,
              width: "fit-content",
            }}
          >
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`db-tab ${tab === t.id ? "on" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                <span
                  style={{
                    padding: "1px 7px",
                    borderRadius: 20,
                    fontSize: 10,
                    fontWeight: 700,
                    background: tab === t.id ? "#4F46E5" : "#D1D5DB",
                    color: "#fff",
                    marginLeft: 2,
                  }}
                >
                  {isLoading ? "…" : t.count}
                </span>
              </button>
            ))}
          </motion.div>


          {isLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {isError && !isLoading && (
            <ErrorState
              message={error?.message ?? "Something went wrong"}
              onRetry={handleRefresh}
            />
          )}

          {!isLoading && !isError && (
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    textAlign: "center",
                    padding: "48px 20px",
                    background: "#fff",
                    borderRadius: 16,
                    border: "1px solid #EBEBEB",
                  }}
                >
                  <div style={{ fontSize: 40, marginBottom: 12 }}>
                    {tab === "live"
                      ? "🎯"
                      : tab === "upcoming"
                        ? "📅"
                        : tab === "finished"
                          ? "🏆"
                          : "🚀"}
                  </div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: 6,
                    }}
                  >
                    No {tab === "all" ? "" : tab} contests yet
                  </div>
                  <div
                    style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 16 }}
                  >
                    {tab === "finished"
                      ? "Complete a contest to see it here"
                      : "Create one or get invited to see contests here"}
                  </div>
                  <button
                    onClick={() => navigate("/room/create-contest")}
                    style={{
                      padding: "9px 20px",
                      borderRadius: 10,
                      border: "none",
                      background: "linear-gradient(135deg,#4F46E5,#7C3AED)",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "'Outfit',sans-serif",
                    }}
                  >
                    <PlusOutlined style={{ marginRight: 6 }} />
                    Create Contest
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key={tab}
                  style={{ display: "flex", flexDirection: "column", gap: 12 }}
                >
                  {filtered.map((c, i) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <ContestCard
                        contest={c}
                        onEnter={(id) => navigate(`/room/contest/${id}`)}
                        onReview={(id) => navigate(`/room/contest/${id}?mode=review`)}
                        onCopy={handleCopy}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </ConfigProvider>
  );
}
