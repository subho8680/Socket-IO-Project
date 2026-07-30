import React, { useState, useEffect, use } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  PlayCircleOutlined,
  StopOutlined,
  TrophyOutlined,
  TeamOutlined,
  WifiOutlined,
  PauseOutlined,
  CaretRightOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import DashboardLayout from "../../components/common/DashboardLayout";
import { OPTION_LABELS } from "../../data/mockData";
import { useSocket } from "../../Services/Usesocket";
import { useAuth } from "../../context/AuthContext";
import { useGetQuizRoomById } from "../../ApiCall";

const OPT_BG = ["bg-blue-100", "bg-emerald-100", "bg-amber-100", "bg-pink-100"];
const OPT_TEXT = [
  "text-blue-800",
  "text-emerald-800",
  "text-amber-800",
  "text-pink-800",
];

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 border border-red-300 rounded-full px-3 py-1 text-xs font-medium bg-red-50 text-red-700">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
      Live
    </span>
  );
}

function PausedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 border border-amber-300 rounded-full px-3 py-1 text-xs font-medium bg-amber-50 text-amber-700">
      ⏸ Paused
    </span>
  );
}

function ScheduledBadge({ scheduledAt }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      const scheduledTime = new Date(scheduledAt).getTime();
      const now = Date.now();
      const diffMs = scheduledTime - now;

      if (diffMs <= 0) {
        setTimeLeft("Live now ");
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);

      const days = Math.floor(totalSeconds / (24 * 3600));
      const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      let textParts = [];

      if (days > 0) textParts.push(`${days}d`);
      if (hours > 0 || days > 0) textParts.push(`${hours}h`);
      if (minutes > 0 || hours > 0 || days > 0) textParts.push(`${minutes}m`);

      textParts.push(`${seconds}s`);

      setTimeLeft(textParts.join(" "));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [scheduledAt]);

  const isStartingSoon =
    timeLeft.includes("s") &&
    !timeLeft.includes("m") &&
    !timeLeft.includes("h");

  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-full px-3 py-1 text-xs font-medium transition-all duration-300 ${
        timeLeft === "Live now 🚀"
          ? "border-green-300 bg-green-50 text-green-700"
          : isStartingSoon
            ? "border-amber-300 bg-amber-50 text-amber-700 animate-pulse"
            : "border-purple-300 bg-purple-50 text-purple-700"
      }`}
    >
      <ClockCircleOutlined />
      {timeLeft === "Live now " ? timeLeft : `Starts in ~ ${timeLeft}`}
    </span>
  );
}

function TimerRing({ timeLeft, total }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? timeLeft / total : 0;
  const offset = circ - circ * pct;
  const color =
    timeLeft > 15 ? "#378add" : timeLeft > 8 ? "#ba7517" : "#a32d2d";

  return (
    <div className="relative w-[76px] h-[76px] flex-shrink-0">
      <svg
        width="76"
        height="76"
        viewBox="0 0 76 76"
        className="absolute top-0 left-0"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx="38"
          cy="38"
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="7"
        />
        <circle
          cx="38"
          cy="38"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[22px] font-medium leading-none tabular-nums"
          style={{ color }}
        >
          {timeLeft}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-gray-400 mt-0.5">
          sec
        </span>
      </div>
    </div>
  );
}

function OptionCard({ opt, idx, phase, correctAnswer }) {
  const isCorrect = phase === "reveal" && idx === correctAnswer;
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border transition-colors duration-200 ${
        isCorrect
          ? "border-emerald-400 bg-emerald-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <div
        className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0 ${
          OPT_BG[idx] || "bg-blue-100"
        } ${OPT_TEXT[idx] || "text-blue-800"}`}
      >
        {OPTION_LABELS[idx] || String.fromCharCode(65 + idx)}
      </div>
      <span className="text-[13px] text-gray-800 leading-relaxed pt-1 flex-1">
        {opt}
      </span>
      {isCorrect && (
        <span className="text-emerald-600 text-base pt-1 flex-shrink-0">✓</span>
      )}
    </div>
  );
}

function LbRow({ entry, index }) {
  const medals = ["🥇", "🥈", "🥉"];
  const isTop = index < 3;
  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border ${
        isTop ? "bg-amber-50 border-amber-200" : "bg-white border-gray-100"
      }`}
    >
      <div className="w-6 text-center flex-shrink-0">
        {isTop ? (
          <span>{medals[index]}</span>
        ) : (
          <span className="font-mono text-xs text-gray-400">#{index + 1}</span>
        )}
      </div>
      <div className="w-[34px] h-[34px] rounded-full bg-blue-100 flex items-center justify-center text-[13px] font-medium text-blue-800 flex-shrink-0">
        {entry.name?.[0]?.toUpperCase() || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-gray-800 truncate">
          {entry.name}
        </div>
        {entry.streak > 1 && (
          <div className="text-[11px] text-amber-700 mt-0.5">
            🔥 {entry.streak} streak
          </div>
        )}
      </div>
      <div className="text-right">
        <div className="text-[15px] font-medium text-gray-800 tabular-nums">
          {(entry.score || 0).toLocaleString()}
        </div>
        <div className="text-[11px] text-gray-400 mt-0.5">
          {entry.correctAnswers || 0}/
          {(entry.correctAnswers || 0) + (entry.wrongAnswers || 0)}
        </div>
      </div>
    </div>
  );
}

export default function TeacherQuizRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const getQuizRoomById = useGetQuizRoomById(id);
  const { data, isLoading, isError } = getQuizRoomById;
  console.log("room details is", data);
  const [roomId, setRoomId] = useState(null);
  const [phase, setPhase] = useState("lobby");
  const [students, setStudents] = useState([]);
  const [curQues, setCurQues] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [quizEnded, setQuizEnded] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(null);
  useEffect(() => {
    if (data?.room) {
      const status = data.room.status;
      const time = data.room.scheduledAt;
      const roomCode = data.room.roomCode;
      setRoomId(roomCode);
      rejoinAsTeacher(roomCode);
      setScheduledAt(time);
      const phaseMap = {
        waiting: "lobby",
        scheduled: "scheduled",
        active: "question",
        paused: "question",
        ended: "ended",
      };
      setPhase(phaseMap[status] || "lobby");
    }
  }, [data]);
  console.log("phase is", phase);
  const { on, startQuiz, pauseQuiz, resumeQuiz, endQuiz, rejoinAsTeacher } =
    useSocket();
  console.log("question is", curQues);
  useEffect(() => {
    const cleanups = [];

    cleanups.push(
      on("student-joined", ({ studentName, studentList }) => {
        setStudents(studentList || []);
        toast.success(`${studentName} joined`);
      }),
    );

    cleanups.push(
      on("quiz-started", () => {
        setPhase("question");
        setAnsweredCount(0);
      }),
    );

    cleanups.push(
      on(
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
      ),
    );

    cleanups.push(on("timer-tick", ({ timeLeft: t }) => setTimeLeft(t)));

    cleanups.push(
      on("time-up", ({ correctAnswer, leaderboard: lb }) => {
        setCurQues((prev) => ({ ...prev, correctAnswer }));
        setLeaderboard(lb || []);
        setPhase("reveal");
      }),
    );

    cleanups.push(
      on("leaderboard-update", (data) => {
        setLeaderboard(data || []);
        setAnsweredCount((p) => p + 1);
      }),
    );

    cleanups.push(on("quiz-paused", () => setIsPaused(true)));
    cleanups.push(on("quiz-resumed", () => setIsPaused(false)));

    cleanups.push(
      on("quiz-ended", ({ leaderboard: lb }) => {
        setLeaderboard(lb || []);
        setQuizEnded(true);
        setPhase("ended");
      }),
    );

    cleanups.push(
      on("joined-list", ({ studentList }) => setStudents(studentList || [])),
    );
    cleanups.push(
      on("join-error", ({ message }) => {
        toast.error(message);
      }),
    );
    cleanups.push(
      on(
        "rejoin-success",
        ({
          studentList,
          leaderboard: lb,
          currentQuestionDetails: cq,
          scheduledAt: scheduledTime,
          status,
        }) => {
          setStudents(studentList || []);
          if (scheduledTime) setScheduledAt(scheduledTime);
          // console.log("hey")
          if (cq) {
            setCurQues({
              questionIndex: cq.questionIndex,
              question: cq.question,
              options: cq.options,
              timeLimit: cq.timeLeft,
              totalQuestions: cq.totalQuestions,
              questionNumber: cq.questionNumber,
              correctAnswer: null,
            });
            setLeaderboard(lb || []);
            setPhase("question");
            setTimeLeft(cq.timeLeft || 30);
          } else if (status === "scheduled") {
            setPhase("scheduled");
          } else if (status === "ended") {
            setLeaderboard(lb || []);
            setPhase("ended");
          } else {
            setPhase("lobby");
          }
        },
      ),
    );

    return () => cleanups.forEach((fn) => fn?.());
  }, [on]);

  useEffect(() => {}, []);

  const handleStart = () => startQuiz(roomId);
  const handlePause = () => pauseQuiz(roomId);
  const handleResume = () => resumeQuiz(roomId);
  const handleEnd = () => endQuiz(roomId);
  const handleViewResults = () =>
    navigate(`/teacher/room/${roomId}/results`, { state: { leaderboard } });

  const answeredPct =
    students.length > 0
      ? Math.round((answeredCount / students.length) * 100)
      : 0;

  const isActive = phase === "question" || phase === "reveal";
  console.log("studnet list", students);
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f5f5f0] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
            <div className="flex items-center flex-wrap gap-2">
              <div className="bg-white border border-gray-200 rounded-full px-4 py-1 font-mono text-[15px] font-medium text-blue-700 tracking-widest">
                {roomId}
              </div>

              {isActive && <LiveBadge />}
              {isPaused && <PausedBadge />}
              {phase === "scheduled" && scheduledAt && (
                <ScheduledBadge scheduledAt={scheduledAt} />
              )}

              <span className="inline-flex items-center gap-1.5 border border-gray-200 rounded-full px-3 py-1 text-xs bg-white text-gray-500">
                <TeamOutlined />
                <strong className="text-gray-700">{students.length}</strong>
                &nbsp;students
              </span>

              <span className="inline-flex items-center gap-1.5 border border-green-300 rounded-full px-3 py-1 text-xs bg-green-50 text-green-700">
                <WifiOutlined /> Connected
              </span>
              <span className="inline-flex items-center gap-1.5 border border-green-300 rounded-full px-3 py-1 text-xs bg-green-50 text-green-700">
                <ClockCircleOutlined />{" "}
                {new Date(scheduledAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
            <div className="flex flex-col gap-4">
              {phase === "scheduled" && scheduledAt && (
                <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
                  <div className="mx-auto w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center mb-6">
                    <ClockCircleOutlined className="text-5xl text-purple-600" />
                  </div>

                  <h2 className="text-3xl font-semibold text-gray-800 mb-3">
                    Quiz is Scheduled
                  </h2>
                  <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                    This quiz will start automatically from the server.
                  </p>

                  <div className="inline-block bg-purple-50 border border-purple-200 rounded-2xl px-10 py-6 mb-8">
                    <p className="text-sm uppercase tracking-widest text-purple-600 font-medium mb-1">
                      Scheduled Start Time
                    </p>
                    <p className="text-4xl font-semibold text-purple-700 tabular-nums">
                      {new Date(scheduledAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-sm text-purple-500 mt-1">
                      {new Date(scheduledAt).toLocaleDateString([], {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="text-[15px] text-gray-500 max-w-sm mx-auto">
                    Students will be allowed to join{" "}
                    <strong>10 minutes before</strong> the scheduled time.
                    <br />
                    You don’t need to manually start the quiz.
                  </div>
                </div>
              )}

              {phase === "lobby" && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400 mb-2.5">
                    Room code
                  </p>
                  <div className="font-mono text-[52px] font-medium tracking-[0.25em] text-blue-700 text-center py-8 border border-dashed border-blue-300 rounded-xl bg-blue-50 mb-5">
                    {roomId}
                  </div>
                  <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400 mb-3">
                    Students joined ({students.length})
                  </p>
                  {students.length === 0 ? (
                    <p className="text-[13px] text-gray-400 py-1">
                      Waiting for students to join…
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {students.slice(0, 10).map((s, i) => (
                        <div
                          key={i}
                          className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-[13px] text-gray-700"
                        >
                          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-medium text-blue-800 flex-shrink-0">
                            {s.name?.[0]?.toUpperCase()}
                          </div>
                          {s.name}
                        </div>
                      ))}
                      {students.length > 10 && (
                        <div className="inline-flex items-center bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-[13px] text-gray-400">
                          +{students.length - 10} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {isActive && curQues && (
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
                    <div className="flex-1">
                      <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400 mb-2">
                        Question {curQues.questionNumber} /{" "}
                        {curQues.totalQuestions}
                      </p>
                      <p className="text-[18px] font-medium text-gray-800 leading-relaxed">
                        {curQues.question}
                      </p>
                    </div>
                    {phase === "question" && !isPaused && (
                      <TimerRing
                        timeLeft={timeLeft}
                        total={curQues.timeLimit}
                      />
                    )}
                  </div>

                  <div className="mb-5">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${answeredPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-400 mt-1.5">
                      <span>{answeredCount} answered</span>
                      <span>{students.length} total</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {curQues.options?.map((opt, i) => (
                      <OptionCard
                        key={i}
                        opt={opt}
                        idx={i}
                        phase={phase}
                        correctAnswer={curQues.correctAnswer}
                      />
                    ))}
                  </div>

                  {phase === "reveal" && (
                    <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-300 rounded-lg text-[13px] text-emerald-700">
                      <span>✓</span> Time's up — correct answer highlighted
                      above
                    </div>
                  )}

                  {isPaused && (
                    <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-300 rounded-lg text-[13px] text-amber-700">
                      ⏸ Quiz paused — resume to continue
                    </div>
                  )}
                </div>
              )}

              {phase === "ended" && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 text-center py-14">
                  <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                    <TrophyOutlined className="text-2xl text-amber-600" />
                  </div>
                  <p className="text-[20px] font-medium text-gray-800 mb-2">
                    Quiz complete!
                  </p>
                  <p className="text-[13px] text-gray-400 mb-6">
                    All questions answered. Great session!
                  </p>
                  <button
                    onClick={handleViewResults}
                    className="inline-flex items-center gap-2 border border-teal-400 rounded-lg px-5 py-2.5 text-[13px] font-medium bg-teal-50 text-teal-800 hover:bg-teal-100 transition-colors"
                  >
                    <TrophyOutlined /> View full results
                  </button>
                </div>
              )}
            </div>

            <div className="lg:sticky lg:top-6 self-start">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-[14px] font-medium text-gray-800">
                    <span>🏆</span> Live leaderboard
                  </div>
                  {isActive && (
                    <span className="text-[11px] bg-red-50 text-red-700 border border-red-200 rounded-full px-2.5 py-0.5 font-medium">
                      live
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  <div className="bg-gray-50 rounded-lg px-3.5 py-3">
                    <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-1">
                      Students
                    </p>
                    <p className="text-[22px] font-medium text-gray-800 tabular-nums">
                      {students.length}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-3.5 py-3">
                    <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-1">
                      Answered
                    </p>
                    <p className="text-[22px] font-medium text-gray-800 tabular-nums">
                      {answeredPct}%
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto">
                  {leaderboard.length === 0 ? (
                    <p className="text-[13px] text-gray-400 text-center py-8">
                      Leaderboard updates as students answer
                    </p>
                  ) : (
                    leaderboard.map((entry, i) => (
                      <LbRow
                        key={entry.socketId || i}
                        entry={entry}
                        index={i}
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
