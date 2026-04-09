import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Avatar, Progress } from "antd";
import {
  PlayCircleOutlined,
  StopOutlined,
  TrophyOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  WifiOutlined,
  PauseOutlined,
  CaretRightOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import DashboardLayout from "../../components/common/DashboardLayout";
import { OPTION_COLORS, OPTION_LABELS } from "../../data/mockData";
import { useSocket } from "../../Services/Usesocket";
import { useAuth } from "../../context/AuthContext";

function LiveBadge() {
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
      <span className="text-emerald-400 text-xs font-bold tracking-widest">
        LIVE
      </span>
    </div>
  );
}

function TimerRing({ timeLeft, total }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? (timeLeft / total) * 100 : 0;
  const offset = circumference - (circumference * progress) / 100;

  const color =
    timeLeft > 15 ? "#22d3ee" : timeLeft > 8 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth="10"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-linear"
        />
      </svg>

      <div className="absolute text-center">
        <div className="text-3xl font-bold tabular-nums" style={{ color }}>
          {timeLeft}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-zinc-500 -mt-1">
          SECONDS
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({ entry, index }) {
  const medals = ["🥇", "🥈", "🥉"];
  const isTopThree = index < 3;

  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
        isTopThree
          ? "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30"
          : "bg-zinc-900 hover:bg-zinc-800 border border-transparent hover:border-zinc-700"
      }`}
    >
      <div className="w-8 text-center">
        {isTopThree ? (
          <span className="text-2xl">{medals[index]}</span>
        ) : (
          <span className="text-zinc-500 font-mono text-sm">#{index + 1}</span>
        )}
      </div>

      <Avatar
        size={38}
        className="ring-2 ring-offset-2 ring-offset-zinc-950 ring-zinc-700"
        style={{
          background: "linear-gradient(135deg, #6366f1, #22d3ee)",
          fontWeight: 700,
        }}
      >
        {entry.name?.[0]?.toUpperCase() || "?"}
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="font-medium text-white truncate text-base">
          {entry.name}
        </div>
        {entry.streak > 1 && (
          <div className="flex items-center gap-1 text-amber-400 text-xs mt-0.5">
            🔥 <span>{entry.streak} streak</span>
          </div>
        )}
      </div>

      <div className="text-right">
        <div className="text-xl font-bold text-white tabular-nums">
          {entry.score?.toLocaleString() || 0}
        </div>
        <div className="text-xs text-emerald-400 font-medium">
          {entry.correctAnswers || 0} /{" "}
          {(entry.correctAnswers || 0) + (entry.wrongAnswers || 0)}
        </div>
      </div>
    </div>
  );
}

export default function TeacherQuizRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase] = useState("lobby");
  const [students, setStudents] = useState([]);
  const [curQues, setCurQues] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [quizEnded, setQuizEnded] = useState(false);

  const { on, startQuiz, pauseQuiz, resumeQuiz, endQuiz, rejoinAsTeacher } =
    useSocket();

  useEffect(() => {
    const cleanupFunctions = [];

    const offJoined = on(
      "student-joined",
      ({ studentName, studentList: updatedList }) => {
        setStudents(updatedList || []);
        toast.success(`${studentName} joined the room`);
      },
    );
    cleanupFunctions.push(offJoined);

    const offStarted = on("quiz-started", () => {
      setPhase("question");
      setAnsweredCount(0);
    });
    cleanupFunctions.push(offStarted);

    const offQuestion = on(
      "new-question",
      ({
        questionIndex,
        question,
        options,
        timeLimit,
        totalQuestions,
        questionNumber,
      }) => {
        setCurQues({
          questionIndex,
          question,
          options,
          timeLimit,
          totalQuestions,
          questionNumber,
          correctAnswer: null,
        });
        setPhase("question");
        setTimeLeft(timeLimit);
        setAnsweredCount(0);
        setIsPaused(false);
      },
    );
    cleanupFunctions.push(offQuestion);

    const offTick = on("timer-tick", ({ timeLeft: newTime }) =>
      setTimeLeft(newTime),
    );
    cleanupFunctions.push(offTick);

    const offTimeUp = on(
      "time-up",
      ({ correctAnswer, leaderboard: updatedLB }) => {
        setCurQues((prev) => ({ ...prev, correctAnswer }));
        setLeaderboard(updatedLB || []);
        setPhase("reveal");
      },
    );
    cleanupFunctions.push(offTimeUp);

    const offLeaderboard = on("leaderboard-update", (data) => {
      setLeaderboard(data || []);
      setAnsweredCount((prev) => prev + 1);
    });
    cleanupFunctions.push(offLeaderboard);

    const offPaused = on("quiz-paused", () => setIsPaused(true));
    cleanupFunctions.push(offPaused);

    const offResumed = on("quiz-resumed", () => setIsPaused(false));
    cleanupFunctions.push(offResumed);

    const offEnded = on("quiz-ended", ({ leaderboard: finalLB }) => {
      setLeaderboard(finalLB || []);
      setQuizEnded(true);
      setPhase("ended");
    });
    const getList = on("joined-list", ({ studentList }) =>
      setStudents(studentList || []),
    );
    cleanupFunctions.push(getList);
    cleanupFunctions.push(offEnded);
    const offRejoin = on(
      "rejoin-success",
      ({ studentList, leaderboard, currentQuestionDetails }) => {
        setCurQues({
          questionIndex: currentQuestionDetails?.questionIndex,
          question: currentQuestionDetails?.question,
          options: currentQuestionDetails?.options,
          timeLimit: currentQuestionDetails?.timeLeft,
          totalQuestions: currentQuestionDetails?.totalQuestions,
          questionNumber: currentQuestionDetails?.questionNumber,
          correctAnswer: null,
        });
        if(currentQuestionDetails)setLeaderboard(leaderboard || []);
        setStudents(studentList || []);
        if (currentQuestionDetails) {
          setPhase("question");
        }
        console.log("Current question details on rejoin:", currentQuestionDetails);
        setTimeLeft(currentQuestionDetails?.timeLeft || 30);
      },
    );
    cleanupFunctions.push(offRejoin);
    return () => cleanupFunctions.forEach((cleanup) => cleanup?.());
  }, [on]);

  useEffect(() => {
    rejoinAsTeacher(roomId);
  }, []);

  const handleStart = () => startQuiz(roomId);
  const handlePause = () => pauseQuiz(roomId);
  const handleResume = () => resumeQuiz(roomId);
  const handleEnd = () => endQuiz(roomId);
  const handleViewResults = () => {
    navigate(`/teacher/room/${roomId}/results`, { state: { leaderboard } });
  };

  const answeredPercentage =
    students.length > 0
      ? Math.round((answeredCount / students.length) * 100)
      : 0;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
            <div className="flex items-center gap-4">
              <div className="bg-zinc-900 border border-zinc-700 px-5 py-2.5 rounded-2xl font-mono text-lg font-bold tracking-widest text-indigo-400">
                {roomId}
              </div>

              {(phase === "question" || phase === "reveal") && <LiveBadge />}

              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <TeamOutlined className="text-lg" />
                <span className="font-medium text-white">
                  {students.length}
                </span>
                <span>students online</span>
              </div>

              <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
                <WifiOutlined /> Connected
              </div>

              {isPaused && (
                <div className="px-4 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-bold">
                  PAUSED
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {phase === "lobby" && (
                <Button
                  type="primary"
                  size="large"
                  icon={<PlayCircleOutlined />}
                  onClick={handleStart}
                  disabled={students.length === 0}
                  className="h-11 px-8 text-sm font-semibold rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110"
                >
                  Start Quiz
                </Button>
              )}

              {(phase === "question" || phase === "reveal") && !quizEnded && (
                <>
                  {!isPaused ? (
                    <Button
                      size="large"
                      icon={<PauseOutlined />}
                      onClick={handlePause}
                      className="h-11 px-6 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 rounded-2xl text-sm"
                    >
                      Pause Quiz
                    </Button>
                  ) : (
                    <Button
                      size="large"
                      icon={<CaretRightOutlined />}
                      onClick={handleResume}
                      className="h-11 px-6 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 rounded-2xl text-sm"
                    >
                      Resume
                    </Button>
                  )}

                  <Button
                    size="large"
                    danger
                    icon={<StopOutlined />}
                    onClick={handleEnd}
                    className="h-11 px-6 rounded-2xl text-sm"
                  >
                    End Quiz
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              {phase === "lobby" && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">
                  <div className="mx-auto w-20 h-20 bg-zinc-800 rounded-3xl flex items-center justify-center mb-6">
                    <TeamOutlined className="text-5xl text-indigo-400" />
                  </div>

                  <h1 className="text-3xl font-semibold mb-3">
                    Waiting for Students
                  </h1>
                  <p className="text-zinc-400 text-base mb-8 max-w-md mx-auto">
                    Share the Room ID with your students to join
                  </p>

                  <div className="bg-zinc-950 border-2 border-dashed border-zinc-700 rounded-2xl py-8 px-10 inline-block mb-8">
                    <div className="font-mono text-5xl font-black tracking-[0.4em] text-white">
                      {roomId}
                    </div>
                  </div>

                  <div className="text-zinc-400 text-base">
                    <span className="font-semibold text-white">
                      {students.length}
                    </span>{" "}
                    students have joined
                  </div>

                  {students.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center mt-6">
                      {students.slice(0, 8).map((student, idx) => (
                        <div
                          key={idx}
                          className="bg-zinc-800 text-zinc-300 px-4 py-1.5 rounded-full text-sm flex items-center gap-2"
                        >
                          <Avatar size={20} className="bg-indigo-600 text-xs">
                            {student.name?.[0]?.toUpperCase()}
                          </Avatar>
                          {student.name}
                        </div>
                      ))}
                      {students.length > 8 && (
                        <div className="text-xs text-zinc-500 px-4 py-1.5">
                          +{students.length - 8} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {(phase === "question" || phase === "reveal") && curQues && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="uppercase tracking-widest text-xs text-zinc-500 mb-1">
                        QUESTION {curQues.questionNumber} /{" "}
                        {curQues.totalQuestions}
                      </div>
                      <h2 className="text-xl font-semibold leading-tight text-white">
                        {curQues.question}
                      </h2>
                    </div>

                    {phase === "question" && !isPaused && (
                      <TimerRing
                        timeLeft={timeLeft}
                        total={curQues.timeLimit}
                      />
                    )}
                  </div>

                  <div className="mb-8">
                    <Progress
                      percent={answeredPercentage}
                      strokeColor={{ from: "#6366f1", to: "#22d3ee" }}
                      showInfo={false}
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-zinc-400 mt-2">
                      <span>{answeredCount} answered</span>
                      <span>{students.length} total</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {curQues.options.map((opt, idx) => {
                      const isCorrect =
                        phase === "reveal" && idx === curQues.correctAnswer;

                      return (
                        <div
                          key={idx}
                          className={`p-5 rounded-2xl border transition-all flex items-start gap-4 text-sm ${
                            isCorrect
                              ? "border-emerald-500 bg-emerald-500/10"
                              : "border-zinc-700 hover:border-zinc-600 bg-zinc-950"
                          }`}
                        >
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                            style={{
                              background:
                                (OPTION_COLORS[idx] || "#6366f1") + "20",
                              color: OPTION_COLORS[idx] || "#6366f1",
                            }}
                          >
                            {OPTION_LABELS[idx] ||
                              String.fromCharCode(65 + idx)}
                          </div>

                          <div className="flex-1 pt-0.5">
                            <p className="text-zinc-200 leading-relaxed">
                              {opt}
                            </p>
                          </div>

                          {isCorrect && (
                            <div className="text-emerald-500 text-xl">✓</div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {phase === "reveal" && (
                    <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center text-emerald-400 text-sm font-medium">
                      Time's up! Correct answer revealed.
                    </div>
                  )}

                  {isPaused && (
                    <div className="mt-6 text-center text-amber-400 text-sm font-medium">
                      Quiz is currently paused
                    </div>
                  )}
                </div>
              )}

              {phase === "ended" && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center">
                  <div className="text-6xl mb-4">🏆</div>
                  <h2 className="text-3xl font-semibold mb-2">
                    Quiz Completed!
                  </h2>
                  <p className="text-zinc-400 mb-8">
                    All questions have been answered.
                  </p>

                  <Button
                    type="primary"
                    size="large"
                    icon={<TrophyOutlined />}
                    onClick={handleViewResults}
                    className="h-12 px-10 text-base font-semibold rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500"
                  >
                    View Full Results
                  </Button>
                </div>
              )}
            </div>

            <div className="lg:col-span-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sticky top-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <TrophyOutlined className="text-xl text-amber-400" />
                    <h3 className="text-lg font-semibold">Live Leaderboard</h3>
                  </div>
                  {(phase === "question" || phase === "reveal") && (
                    <div className="text-xs bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full">
                      LIVE
                    </div>
                  )}
                </div>

                <div className="space-y-3 max-h-[580px] overflow-y-auto pr-2 custom-scrollbar">
                  {leaderboard.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500 text-sm">
                      Leaderboard updates as students answer
                    </div>
                  ) : (
                    leaderboard.map((entry, index) => (
                      <LeaderboardRow
                        key={entry.socketId || index}
                        entry={entry}
                        index={index}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
