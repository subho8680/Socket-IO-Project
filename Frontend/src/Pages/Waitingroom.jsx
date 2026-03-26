import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar } from "antd";
import { WifiOutlined } from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/common/Logo";

const FAKE_STUDENTS = [
  "Arjun M",
  "Priya S",
  "Karan P",
  "Sneha G",
  "Ravi K",
  "Ananya S",
  "Dev N",
  "Meera J",
  "Rohit V",
  "Divya R",
];

const COLORS = [
  "#7c3aed",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#a78bfa",
  "#67e8f9",
  "#6ee7b7",
  "#fcd34d",
  "#fca5a5",
];

export default function WaitingRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [students, setStudents] = useState([
    { name: user?.name || "You", isMe: true },
  ]);
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const addTimer = setInterval(() => {
      setStudents((prev) => {
        if (prev.length >= FAKE_STUDENTS.length + 1) {
          clearInterval(addTimer);
          return prev;
        }
        const next = FAKE_STUDENTS[prev.length - 1];
        return [...prev, { name: next, isMe: false }];
      });
    }, 900);
    const dotsTimer = setInterval(
      () => setDots((d) => (d.length >= 3 ? "." : d + ".")),
      500,
    );

    const startTimer = setTimeout(
      () => navigate(`/student/room/${roomId}`),
      10000,
    );

    return () => {
      clearInterval(addTimer);
      clearInterval(dotsTimer);
      clearTimeout(startTimer);
    };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10 font-sans"
      style={{ background: "#07070e" }}
    >
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 500,
          height: 500,
          background:
            "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      <div className="mb-8">
        <Logo size="md" />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-txt-secondary text-sm mb-2">You joined room</p>
          <div
            className="inline-block px-8 py-4 rounded-2xl mb-3"
            style={{ background: "#12121f", border: "2px dashed #1e1e35" }}
          >
            <div className="font-mono text-4xl font-black text-brand-light tracking-widest">
              {roomId}
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-txt-secondary">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse inline-block" />
            Waiting for teacher to start{dots}
          </div>
        </div>

        <div
          className="p-5 rounded-2xl mb-4"
          style={{ background: "#12121f", border: "1px solid #1e1e35" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-txt-primary text-sm">
              Players Joined
            </h3>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}
            >
              {students.length} online
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {students.map((s, i) => (
              <div
                key={s.name + i}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium animate-fade-in"
                style={{
                  background: s.isMe ? "rgba(124,58,237,0.25)" : "#0d0d18",
                  border: `1px solid ${s.isMe ? "#7c3aed" : "#1e1e35"}`,
                  color: s.isMe ? "#a78bfa" : "#8b8ba7",
                }}
              >
                <Avatar
                  size={18}
                  style={{
                    background: COLORS[i % COLORS.length],
                    fontSize: 9,
                    fontWeight: 700,
                  }}
                >
                  {s.name[0]}
                </Avatar>
                {s.name} {s.isMe && <span className="text-xs">(you)</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-success">
          <WifiOutlined />
          <span>Connected to quiz server</span>
        </div>

        <p className="text-center text-xs text-txt-muted mt-4">
          The quiz will start automatically when the teacher hits Start.
          <br />
          <span className="text-brand-light">
            (Demo: auto-starts in ~10 seconds)
          </span>
        </p>
      </div>
    </div>
  );
}
