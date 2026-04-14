import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Spin, Skeleton } from "antd";
import {
  TrophyOutlined,
  ThunderboltOutlined,
  CheckOutlined,
  CloseOutlined,
  FireOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { OPTION_COLORS, OPTION_LABELS } from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/common/Logo";
import { useSocket } from "../../Services/Usesocket";
import { toast } from "react-toastify";
import { useGetQuizRoomById2 } from "../../ApiCall";

const OPT_BG = ["bg-blue-100", "bg-emerald-100", "bg-amber-100", "bg-pink-100"];
const OPT_TEXT = [
  "text-blue-800",
  "text-emerald-800",
  "text-amber-800",
  "text-pink-800",
];

function WaitingScreen({ roomId, studentList, myUserId }) {
  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col">
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4">
        <Logo size="sm" />
        <div className="ml-auto font-mono text-[13px] font-medium text-blue-700 tracking-widest bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
          {roomId}
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center mb-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#378add" strokeWidth="1.5" />
                <path d="M12 7v5l3 3" stroke="#378add" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-[17px] font-medium text-gray-800 mb-1">
              Waiting for quiz to start
            </p>
            <p className="text-[13px] text-gray-400">The teacher will begin shortly</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
                Students joined
              </p>
              <span className="text-[13px] font-medium text-gray-800 tabular-nums">
                {studentList.length}
              </span>
            </div>

            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
              {studentList.length > 0 ? (
                studentList.map((s, i) => {
                  const isMe = s.userId === myUserId;
                  return (
                    <div
                      key={s.userId || s.socketId || i}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border ${isMe ? "border-blue-300 bg-blue-50" : "border-gray-100 bg-white"
                        }`}
                    >
                      <div
                        className={`w-[30px] h-[30px] rounded-full flex items-center justify-center text-[12px] font-medium flex-shrink-0 ${isMe ? "bg-blue-200 text-blue-800" : "bg-gray-100 text-gray-600"
                          }`}
                      >
                        {s.name?.[0]?.toUpperCase()}
                      </div>
                      <span className={`text-[13px] ${isMe ? "text-blue-700 font-medium" : "text-gray-700"}`}>
                        {s.name}
                        {isMe && <span className="text-[11px] text-gray-400 ml-1">(you)</span>}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <LoadingOutlined className="text-3xl text-gray-400 mb-3" />
                  <p className="text-[13px] text-gray-400">Waiting for others to join...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Skeleton.Input active size="small" className="flex-1 h-1.5" />
        <Skeleton.Input active size="small" className="w-16" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <Skeleton active paragraph={{ rows: 1 }} />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex gap-3">
          <Skeleton.Avatar active size={32} />
          <Skeleton active paragraph={{ rows: 2 }} />
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
            <Skeleton active paragraph={{ rows: 1 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StudentQuizRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { on, submitAnswer, giveList, rejoinAsStudent, joinRoom } = useSocket();
  const getQuizRoomById = useGetQuizRoomById2(roomId);
  const { data, isLoading: isRoomLoading, isError } = getQuizRoomById;

  const myUserId = user?.user?._id || user?._id;
  const myName = user?.user?.name || user?.name || "Student";

  const [phase, setPhase] = useState("loading"); // loading, waiting, question, answered, reveal
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

  useEffect(() => {
    if (!myUserId || !roomId || !data?.room) return;

    const status = data.room.status;

    if (status === "active") {
      rejoinAsStudent(roomId);
      giveList(roomId);
    } else if (status === "waiting") {
      joinRoom(roomId, myName, myUserId);
    }
  }, [data, roomId, myUserId, myName, rejoinAsStudent, giveList, joinRoom]);

  useEffect(() => {
    const cleanups = [];

    cleanups.push(on("joined-list", ({ studentList }) => setStudentList(studentList || [])));
    cleanups.push(on("take-list", ({ listStu }) => setStudentList(listStu || [])));
    cleanups.push(on("join-success", ({ studentList }) => setStudentList(studentList)));

    cleanups.push(
      on("rejoin-success", (data) => {
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
          setPhase(q.hasAnsweredCurrent ? "answered" : "question");

          if (q.hasAnsweredCurrent) {
            setSelected(q.lastSelectedOption ?? null);
          }
        } else if (data.status === "waiting") {
          setPhase("waiting");
        }
      })
    );

    cleanups.push(
      on("quiz-started", ({ totalQuestions, message }) => {
        setTotalQuestions(totalQuestions);
        toast.success(message);
      })
    );

    cleanups.push(
      on("new-question", ({
        questionIndex, question, options, timeLimit, totalQuestions, questionNumber,
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

        setTimeout(() => setNextQuesLoader(false), 600);
      })
    );

    cleanups.push(on("timer-tick", ({ timeLeft }) => setTimeLeft(timeLeft)));

    cleanups.push(
      on("answer-received", ({ isCorrect, pointsEarned, totalScore }) => {
        setAnsweredCorrectly(isCorrect);
        setPointsEarned(pointsEarned);
        setScore(totalScore);
        setStreak((prev) => (isCorrect ? prev + 1 : 0));
        setHasAnsweredCurrent(true);
      })
    );

    cleanups.push(
      on("time-up", ({ correctAnswer, leaderboard }) => {
        setCorrectAnswer(correctAnswer);
        setPhase("reveal");
        const me = leaderboard.find((s) => s.userId === myUserId);
        if (me) setMyRank(me.rank);
      })
    );

    cleanups.push(
      on("leaderboard-update", (leaderboard) => {
        const me = leaderboard.find((s) => s.userId === myUserId);
        if (me) {
          setMyRank(me.rank);
          setScore(me.score);
        }
      })
    );

    cleanups.push(on("already-answered", () => {
      setPhase("answered");
      setHasAnsweredCurrent(true);
    }));

    cleanups.push(on("quiz-paused", () => {
      setIsPaused(true);
      toast.warning("Quiz paused by teacher");
    }));

    cleanups.push(on("quiz-resumed", () => {
      setIsPaused(false);
      toast.success("Quiz resumed!");
    }));

    cleanups.push(
      on("quiz-ended", ({ leaderboard, myStats }) => {
        navigate(`/student/room/${roomId}/results`, { state: { leaderboard, myStats } });
      })
    );

    cleanups.push(
      on("you-were-kicked", () => {
        toast.error("You were removed from the room");
        navigate("/student/dashboard");
      })
    );

    cleanups.push(
      on("room-closed", () => {
        toast.info("Room was closed by teacher");
        navigate("/student/dashboard");
      })
    );

    return () => cleanups.forEach((fn) => fn?.());
  }, [on, myUserId, navigate, roomId]);

  const handleAnswer = (idx) => {
    if (phase !== "question" || !curQues || hasAnsweredCurrent) return;
    setSelected(idx);
    setPhase("answered");
    submitAnswer(roomId, curQues.questionIndex, idx);
  };

  const timerPct = curQues ? (timeLeft / (curQues.timeLimit || 30)) * 100 : 100;
  const timerColor = timeLeft > 15 ? "#378add" : timeLeft > 8 ? "#ba7517" : "#a32d2d";

  if (isRoomLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="text-center">
          <LoadingOutlined className="text-5xl text-blue-600 mb-4" spin />
          <p className="text-gray-600">Loading quiz room...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">Failed to load quiz room</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (phase === "waiting") {
    return (
      <WaitingScreen
        roomId={roomId}
        studentList={studentList}
        myUserId={myUserId}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col">
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-5 gap-3">
        <Logo size="sm" />

        <div className="ml-auto flex items-center gap-2">
          {isPaused && (
            <span className="inline-flex items-center gap-1.5 border border-amber-300 rounded-full px-3 py-1 text-xs font-medium bg-amber-50 text-amber-700">
              <ClockCircleOutlined /> Paused
            </span>
          )}

          <div className="inline-flex items-center gap-1.5 border border-gray-200 rounded-full px-3 py-1 text-xs bg-white text-gray-700">
            <TrophyOutlined className="text-amber-500" />
            <span className="font-medium tabular-nums">{score.toLocaleString()}</span>
          </div>

          {streak > 1 && (
            <span className="inline-flex items-center gap-1 border border-red-300 rounded-full px-3 py-1 text-xs font-medium bg-red-50 text-red-700">
              <FireOutlined /> {streak}
            </span>
          )}

          <div className="w-[30px] h-[30px] rounded-full bg-blue-100 flex items-center justify-center text-[12px] font-medium text-blue-800 flex-shrink-0">
            {myName?.[0]?.toUpperCase() || "U"}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-xl mx-auto w-full px-5 py-6">
        <Spin
          spinning={nextQuesLoader}
          size="large"
          tip="Loading next question..."
          indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />}
        >
          {curQues ? (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-2">
                <div className="flex-1 flex gap-1">
                  {Array.from({ length: totalQuestions }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        background:
                          i < curQues.questionIndex
                            ? "#5dcaa5"
                            : i === curQues.questionIndex
                              ? "#378add"
                              : "#e5e7eb",
                      }}
                    />
                  ))}
                </div>
                <span className="font-mono text-[11px] text-gray-400 whitespace-nowrap">
                  {curQues.questionNumber}/{totalQuestions}
                </span>
              </div>

              {phase !== "reveal" && (
                <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                  <div className="flex justify-between text-[11px] text-gray-400 mb-2">
                    <span className="uppercase tracking-widest">Time left</span>
                    <span className="font-mono font-medium tabular-nums" style={{ color: timerColor }}>
                      {timeLeft}s
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${timerPct}%`, background: timerColor }}
                    />
                  </div>
                </div>
              )}

              {isPaused && (
                <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-300 rounded-xl text-[13px] text-amber-700">
                  ⏸ Quiz paused — resume to continue
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-[13px] font-medium text-blue-800 flex-shrink-0">
                    {curQues.questionNumber}
                  </div>
                  <p className="text-[16px] font-medium text-gray-800 leading-relaxed pt-0.5">
                    {curQues.question}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {curQues.options.map((opt, idx) => {
                  const isSelected = selected === idx;
                  const isCorrect = phase === "reveal" && idx === correctAnswer;
                  const isWrong = phase === "reveal" && selected === idx && idx !== correctAnswer;

                  let cardCls = "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50";
                  let textCls = "text-gray-800";

                  if (isCorrect) {
                    cardCls = "border-emerald-400 bg-emerald-50";
                    textCls = "text-emerald-800";
                  } else if (isWrong) {
                    cardCls = "border-red-300 bg-red-50";
                    textCls = "text-red-700";
                  } else if (isSelected && phase === "answered") {
                    cardCls = "border-blue-300 bg-blue-50";
                    textCls = "text-blue-800";
                  }

                  const disabled = phase !== "question" || hasAnsweredCurrent;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={disabled}
                      className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-colors duration-150 ${cardCls} ${disabled ? "cursor-default" : "cursor-pointer"
                        }`}
                    >
                      <div
                        className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0 ${isCorrect
                            ? "bg-emerald-200 text-emerald-800"
                            : isWrong
                              ? "bg-red-200 text-red-700"
                              : `${OPT_BG[idx] || "bg-blue-100"} ${OPT_TEXT[idx] || "text-blue-800"}`
                          }`}
                      >
                        {phase === "reveal" && isCorrect ? (
                          <CheckOutlined />
                        ) : phase === "reveal" && isWrong ? (
                          <CloseOutlined />
                        ) : (
                          OPTION_LABELS[idx] || String.fromCharCode(65 + idx)
                        )}
                      </div>

                      <span className={`text-[14px] leading-relaxed pt-0.5 flex-1 ${textCls}`}>
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>

              {phase === "answered" && (
                <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-300 rounded-xl text-[13px] text-blue-700">
                  <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                    <CheckOutlined className="text-[10px] text-blue-800" />
                  </div>
                  <div>
                    <span className="font-medium">Answer submitted</span>
                    <span className="text-blue-400 ml-1">— waiting for reveal…</span>
                  </div>
                </div>
              )}

              {phase === "reveal" && (
                <div
                  className={`px-5 py-4 rounded-xl border text-center ${answeredCorrectly === true
                      ? "bg-emerald-50 border-emerald-300"
                      : answeredCorrectly === false
                        ? "bg-red-50 border-red-300"
                        : "bg-amber-50 border-amber-300"
                    }`}
                >
                  {answeredCorrectly === true ? (
                    <>
                      <p className="text-[16px] font-medium text-emerald-700 mb-1">Correct!</p>
                      <p className="text-[13px] text-emerald-600">
                        +{pointsEarned} points
                        {streak > 1 && <span className="ml-2 text-amber-600">🔥 {streak} streak</span>}
                      </p>
                    </>
                  ) : answeredCorrectly === false ? (
                    <>
                      <p className="text-[16px] font-medium text-red-700 mb-1">Incorrect</p>
                      <p className="text-[13px] text-gray-500">
                        Correct answer:{" "}
                        <span className="text-emerald-600 font-medium">
                          Option {OPTION_LABELS[correctAnswer]}
                        </span>
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[16px] font-medium text-amber-700 mb-1">Time's up!</p>
                      <p className="text-[13px] text-gray-500">
                        Correct answer:{" "}
                        <span className="text-emerald-600 font-medium">
                          Option {OPTION_LABELS[correctAnswer]}
                        </span>
                      </p>
                    </>
                  )}
                </div>
              )}

              <div className="flex justify-between text-[11px] text-gray-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <ThunderboltOutlined />
                  Rank:{" "}
                  <span className="text-gray-700 font-medium ml-0.5">#{myRank || "--"}</span>
                </div>
                <div>
                  {Math.round(((curQues.questionIndex || 0) / totalQuestions) * 100)}% completed
                </div>
              </div>
            </div>
          ) : (
            <QuestionSkeleton />
          )}
        </Spin>
      </main>
    </div>
  );
}