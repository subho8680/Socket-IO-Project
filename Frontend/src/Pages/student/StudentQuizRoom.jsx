import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Avatar, Progress, Spin } from "antd";
import {
  TrophyOutlined,
  ThunderboltOutlined,
  CheckOutlined,
  CloseOutlined,
  FireOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { OPTION_COLORS, OPTION_LABELS } from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/common/Logo";
import { useSocket } from "../../Services/Usesocket";
import { toast } from "react-toastify";

export default function StudentQuizRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { on, submitAnswer, giveList, rejoinAsStudent } = useSocket();

  const myUserId = user?.user?._id || user?._id;
  const myName = user?.user?.name || user?.name;

  const [phase, setPhase] = useState("waiting");
  const [studentList, setStudentList] = useState([]);
  const [curQues, setCurQues] = useState(null);
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [myRank, setMyRank] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(null);
  const [nextQuesLoader, setNextQuesLoader] = useState(false);
  const [hasAnsweredCurrent, setHasAnsweredCurrent] = useState(false);
  console.log("selected index is and correctlyanswer", selected + " " + answeredCorrectly);
  useEffect(() => {
    if (!myUserId || !roomId) return;

    rejoinAsStudent(roomId);

    giveList(roomId);
  }, [roomId, myUserId, rejoinAsStudent, giveList]);

  useEffect(() => {
    const cleanupFunctions = [];

    const offJoinedList = on("joined-list", ({ studentList }) => {
      setStudentList(studentList || []);
    });
    cleanupFunctions.push(offJoinedList);

    const getList = on("take-list", ({ listStu }) => {
      setStudentList(listStu || []);
    });
    cleanupFunctions.push(getList);

    const offRejoinSuccess = on("rejoin-success", (data) => {
      setStudentList(data.studentList || []);
      setTotalQuestions(data.totalQuestions || 0);
      setScore(data.score || 0);

      if (data.status === "active" && data.question) {
        const q = data.question;
        setCurQues({
          questionIndex: q.questionIndex,
          question: q.question,
          options: q.options,
          questionNumber: q.questionIndex + 1,
        });

        setTimeLeft(q.timeLeft || 30);
        setHasAnsweredCurrent(q.hasAnsweredCurrent || false);
        setPhase("question");

        if (q.hasAnsweredCurrent) {
          setPhase("answered");
          // setSelected(null);
          setSelected(q.lastSelectedOption ?? null);
          setPointsEarned(q.pointsEarned || 0);
          setHasAnsweredCurrent(true);
        }
      } else if (data.status === "waiting") {
        setPhase("waiting");
      }
    });
    cleanupFunctions.push(offRejoinSuccess);

    const offQuizStarted = on("quiz-started", ({ totalQuestions, message }) => {
      setTotalQuestions(totalQuestions);
      toast.success(message);
    });
    cleanupFunctions.push(offQuizStarted);

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
        setNextQuesLoader(true);
        setCurQues({
          questionIndex,
          question,
          options,
          timeLimit,
          questionNumber,
        });
        setTotalQuestions(totalQuestions);
        setSelected(null);
        setCorrectAnswer(null);
        setAnsweredCorrectly(null);
        setPointsEarned(0);
        setTimeLeft(timeLimit);
        setHasAnsweredCurrent(false);
        setIsPaused(false);
        setPhase("question");
        setNextQuesLoader(false);
      },
    );
    cleanupFunctions.push(offQuestion);

    const offTick = on("timer-tick", ({ timeLeft }) => setTimeLeft(timeLeft));
    cleanupFunctions.push(offTick);

    const offAnswerReceived = on(
      "answer-received",
      ({ isCorrect, pointsEarned, totalScore }) => {
        setAnsweredCorrectly(isCorrect);
        setPointsEarned(pointsEarned);
        setScore(totalScore);
        setStreak((prev) => (isCorrect ? prev + 1 : 0));
        setHasAnsweredCurrent(true);
      },
    );
    cleanupFunctions.push(offAnswerReceived);

    const offTimeUp = on("time-up", ({ correctAnswer, leaderboard }) => {
      setCorrectAnswer(correctAnswer);
      setPhase("reveal");

      const me = leaderboard.find((s) => s.userId === myUserId);
      if (me) setMyRank(me.rank);
    });
    cleanupFunctions.push(offTimeUp);

    const offLeaderboard = on("leaderboard-update", (leaderboard) => {
      const me = leaderboard.find((s) => s.userId === myUserId);
      if (me) {
        setMyRank(me.rank);
        setScore(me.score);
      }
    });
    cleanupFunctions.push(offLeaderboard);

    const offAlreadyAnswered = on("already-answered", () => {
      setPhase("answered");
      setHasAnsweredCurrent(true);
    });
    cleanupFunctions.push(offAlreadyAnswered);

    const offPaused = on("quiz-paused", () => {
      setIsPaused(true);
      toast.warning("Quiz paused by teacher");
    });
    cleanupFunctions.push(offPaused);

    const offResumed = on("quiz-resumed", () => {
      setIsPaused(false);
      toast.success("Quiz resumed!");
    });
    cleanupFunctions.push(offResumed);

    const offEnded = on("quiz-ended", ({ leaderboard, myStats }) => {
      navigate(`/student/room/${roomId}/results`, {
        state: { leaderboard, myStats },
      });
    });
    cleanupFunctions.push(offEnded);

    const offKicked = on("you-were-kicked", () => {
      toast.error("You were removed from the room");
      navigate("/student/dashboard");
    });
    cleanupFunctions.push(offKicked);

    const offClosed = on("room-closed", () => {
      toast.info("Room was closed by teacher");
      navigate("/student/dashboard");
    });
    cleanupFunctions.push(offClosed);

    return () => cleanupFunctions.forEach((cleanup) => cleanup?.());
  }, [on, myUserId, navigate, roomId]);

  const handleAnswer = (idx) => {
    if (phase !== "question" || !curQues || hasAnsweredCurrent) return;

    setSelected(idx);
    setPhase("answered");
    submitAnswer(roomId, curQues.questionIndex, idx);
  };

  const timerPercent = curQues
    ? (timeLeft / (curQues.timeLimit || 30)) * 100
    : 100;

  if (phase === "waiting") {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
        <header className="h-16 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md flex items-center px-6">
          <Logo size="sm" />
          <div className="ml-auto font-mono text-indigo-400 font-bold tracking-widest text-sm">
            {roomId}
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="text-center mb-10">
              <div className="text-5xl mb-6 animate-pulse">⏳</div>
              <h1 className="text-2xl font-semibold mb-2">
                Waiting for the quiz to start
              </h1>
              <p className="text-zinc-400">The teacher will begin shortly</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              <div className="flex justify-between items-center mb-5 text-sm">
                <span className="text-zinc-400">Students joined</span>
                <span className="font-semibold text-emerald-400 text-lg">
                  {studentList.length}
                </span>
              </div>

              <div className="space-y-2 max-h-80 overflow-auto pr-2 custom-scrollbar">
                {studentList.length > 0 ? (
                  studentList.map((s, i) => {
                    const isMe = s.userId === myUserId;
                    return (
                      <div
                        key={s.userId || s.socketId || i}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
                          isMe
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-zinc-800"
                        }`}
                      >
                        <Avatar
                          size={32}
                          style={{
                            background: isMe
                              ? "linear-gradient(135deg, #6366f1, #22d3ee)"
                              : "#27272a",
                          }}
                        >
                          {s.name?.[0]?.toUpperCase()}
                        </Avatar>
                        <span
                          className={
                            isMe
                              ? "text-indigo-400 font-medium"
                              : "text-zinc-300"
                          }
                        >
                          {s.name}{" "}
                          {isMe && (
                            <span className="text-xs text-zinc-500">(you)</span>
                          )}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center py-8 text-zinc-500 text-sm">
                    No other students yet...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <header className="h-16 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-md flex items-center px-6">
        <Logo size="sm" />

        <div className="ml-auto flex items-center gap-3">
          {isPaused && (
            <div className="text-amber-400 text-xs font-medium flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
              <ClockCircleOutlined /> Paused
            </div>
          )}

          <div className="flex items-center gap-2 bg-zinc-800 px-4 py-1.5 rounded-2xl text-sm">
            <TrophyOutlined className="text-amber-400" />
            <span className="font-semibold tabular-nums">{score}</span>
          </div>

          {streak > 1 && (
            <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-2xl text-sm font-medium">
              <FireOutlined /> {streak}
            </div>
          )}

          <Avatar
            size={34}
            style={{ background: "linear-gradient(135deg, #6366f1, #22d3ee)" }}
          >
            {myName?.[0]?.toUpperCase() || "U"}
          </Avatar>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-6">
        <Spin
          spinning={nextQuesLoader}
          size="large"
          tip="Loading next question..."
        >
          {curQues && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden flex gap-px">
                  {Array.from({ length: totalQuestions }).map((_, i) => (
                    <div
                      key={i}
                      className="h-full transition-all"
                      style={{
                        background:
                          i < curQues.questionIndex
                            ? "#22d3ee"
                            : i === curQues.questionIndex
                              ? "#6366f1"
                              : "#3f3f46",
                        flex: 1,
                      }}
                    />
                  ))}
                </div>
                <span className="font-mono text-xs text-zinc-400 whitespace-nowrap">
                  {curQues.questionNumber}/{totalQuestions}
                </span>
              </div>

              {phase !== "reveal" && (
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                    <span>Time left</span>
                    <span
                      className="font-mono font-semibold"
                      style={{
                        color:
                          timeLeft > 10
                            ? "#67e8f9"
                            : timeLeft > 5
                              ? "#fbbf24"
                              : "#f87171",
                      }}
                    >
                      {timeLeft}s
                    </span>
                  </div>
                  <Progress
                    percent={timerPercent}
                    showInfo={false}
                    strokeColor={
                      timeLeft > 10
                        ? "#67e8f9"
                        : timeLeft > 5
                          ? "#fbbf24"
                          : "#f87171"
                    }
                    trailColor="#27272a"
                    strokeLinecap="round"
                  />
                </div>
              )}

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8">
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-semibold text-base flex-shrink-0">
                    {curQues.questionNumber}
                  </div>
                  <p className="text-lg font-medium leading-relaxed text-zinc-100">
                    {curQues.question}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {curQues.options.map((opt, idx) => {
                  const isSelected = selected === idx;
                  const isCorrect = phase === "reveal" && idx === correctAnswer;
                  const isWrong =
                    phase === "reveal" &&
                    selected === idx &&
                    idx !== correctAnswer;

                  let cardClass =
                    "bg-zinc-900 border border-zinc-700 hover:border-zinc-600";
                  let textClass = "text-zinc-200";

                  if (isCorrect) {
                    cardClass = "bg-emerald-500/10 border-emerald-500";
                    textClass = "text-emerald-400";
                  } else if (isWrong) {
                    cardClass = "bg-red-500/10 border-red-500";
                    textClass = "text-red-400";
                  } else if (isSelected && phase === "answered") {
                    cardClass = "bg-indigo-500/10 border-indigo-500";
                    textClass = "text-indigo-400";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={phase !== "question" || hasAnsweredCurrent}
                      className={`w-full flex items-start gap-4 p-5 rounded-2xl text-left transition-all ${cardClass}`}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center font-semibold text-sm flex-shrink-0 mt-0.5"
                        style={{
                          background: (OPTION_COLORS[idx] || "#6366f1") + "20",
                          color: OPTION_COLORS[idx] || "#6366f1",
                        }}
                      >
                        {phase === "reveal" && isCorrect ? (
                          <CheckOutlined />
                        ) : phase === "reveal" && isWrong ? (
                          <CloseOutlined />
                        ) : (
                          OPTION_LABELS[idx] || String.fromCharCode(65 + idx)
                        )}
                      </div>

                      <span
                        className={`text-base leading-relaxed ${textClass}`}
                      >
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>

              {phase === "answered" && (
                <div className="mt-8 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-6 text-center">
                  <p className="text-indigo-400 font-medium">
                    Answer submitted successfully
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Waiting for the reveal...
                  </p>
                </div>
              )}

              {phase === "reveal" && (
                <div
                  className={`mt-8 rounded-2xl p-6 text-center border ${
                    answeredCorrectly === true
                      ? "bg-emerald-500/10 border-emerald-500"
                      : answeredCorrectly === false
                        ? "bg-red-500/10 border-red-500"
                        : "bg-amber-500/10 border-amber-500"
                  }`}
                >
                  {answeredCorrectly === true ? (
                    <div>
                      <p className="text-xl font-semibold text-emerald-400">
                        Correct!
                      </p>
                      <p className="text-sm text-emerald-300 mt-1">
                        +{pointsEarned} points{" "}
                        {streak > 1 && `• 🔥 ${streak} streak`}
                      </p>
                    </div>
                  ) : answeredCorrectly === false ? (
                    <div>
                      <p className="text-xl font-semibold text-red-400">
                        Incorrect
                      </p>
                      <p className="text-sm text-zinc-400 mt-2">
                        Correct answer:{" "}
                        <span className="text-emerald-400 font-medium">
                          Option {OPTION_LABELS[correctAnswer]}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xl font-semibold text-amber-400">
                        Time's Up
                      </p>
                      <p className="text-sm text-zinc-400 mt-2">
                        Correct answer:{" "}
                        <span className="text-emerald-400 font-medium">
                          Option {OPTION_LABELS[correctAnswer]}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-10 flex justify-between text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <ThunderboltOutlined />
                  Rank:{" "}
                  <span className="text-white font-medium">
                    #{myRank || "--"}
                  </span>
                </div>
                <div>
                  {Math.round(
                    ((curQues.questionIndex || 0) / totalQuestions) * 100,
                  )}
                  % completed
                </div>
              </div>
            </>
          )}
        </Spin>
      </main>
    </div>
  );
}
