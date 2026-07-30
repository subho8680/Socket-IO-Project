import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import {
  BookOpen,
  Settings,
  Wand2,
  CheckCircle2,
  Clock,
  BarChart3,
  Trash2,
  RotateCw,
  Rocket,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  TrendingUp,
  Users,
  Target,
  Zap,
  Check,
  X,
} from "lucide-react";
import DashboardLayout from "../../components/common/DashboardLayout";
import { OPTION_LABELS } from "../../data/mockData";
import { CreateQuiz, generateQuestions, useCreateQuiz, useGenerateQuesitions } from "../../ApiCall";
import { useSocket } from "../../Services/Usesocket";
import { useAuth } from "../../context/AuthContext";
const DIFFICULTIES = ["Easy", "Medium", "Hard", "Mixed"];
const QUESTION_COUNTS = [5, 10, 15, 20];

function getCorrectIndex(c) {
  return parseInt(c?.quesionNo ?? "1", 10) - 1;
}
function normaliseQuestion(apiQ, timePerQ = 30) {
  return {
    id: apiQ._id,
    question: apiQ.title,
    options: apiQ.options,
    correct: getCorrectIndex(apiQ.correctOption),
    answer: apiQ.correctOption?.answer ?? "",
    timeLimit: timePerQ,
    points: 100,
  };
}

function StepIndicator({ step }) {
  const steps = [
    { label: "Quiz Configuration", icon: Settings },
    { label: "Question Generation", icon: Wand2 },
    { label: "Review & Publish", icon: CheckCircle2 },
  ];
  const pct = (step / 2) * 100;

  return (
    <div className="mb-14">
      <div className="relative flex items-center justify-between">
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-200">
          <div
            className="h-full bg-blue-600 transition-all duration-500 ease-in-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        {steps.map((s, i) => {
          const done = i < step;
          const active = i === step;
          const Icon = s.icon;
          return (
            <div key={i} className="relative flex flex-col items-center flex-1">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                  done
                    ? "bg-green-600 text-white"
                    : active
                      ? "bg-blue-600 text-white"
                      : "bg-white border-2 border-slate-200 text-slate-400"
                }`}
                style={
                  active ? { boxShadow: "0 0 0 4px rgba(37,99,235,0.18)" } : {}
                }
              >
                {done ? <CheckCircle2 size={22} /> : <Icon size={20} />}
              </div>
              <p
                className={`mt-3 text-sm font-semibold text-center transition-colors ${
                  active ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {s.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Page({ children, dir = 1 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = `translateX(${dir * 24}px)`;
    requestAnimationFrame(() => {
      el.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      el.style.opacity = "1";
      el.style.transform = "translateX(0)";
    });
  }, []);
  return <div ref={ref}>{children}</div>;
}

function Card({ children, className = "", style = {} }) {
  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

function PillBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`h-11 px-4 rounded-xl font-semibold text-sm transition-all duration-150 border-2 ${
        active
          ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/20"
          : "bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
      }`}
    >
      {label}
    </button>
  );
}

function TextInput({ placeholder, value, onChange, error }) {
  return (
    <div>
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full h-11 px-4 rounded-xl border text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-150 ${
          error
            ? "border-red-400 ring-2 ring-red-100 bg-red-50"
            : "border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white"
        }`}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

function TimeSlider({ value, onChange }) {
  return (
    <div>
      <input
        type="range"
        min={10}
        max={60}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #2563eb ${((value - 10) / 50) * 100}%, #e2e8f0 ${((value - 10) / 50) * 100}%)`,
        }}
      />
      <div className="flex justify-between text-xs text-slate-400 mt-1.5 font-medium">
        <span>10s (Fast)</span>
        <span>30s (Standard)</span>
        <span>60s (Extended)</span>
      </div>
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: #2563eb;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(37,99,235,0.4);
          cursor: pointer;
        }
        input[type=range]::-moz-range-thumb {
          width: 18px; height: 18px;
          border-radius: 50%;
          background: #2563eb;
          border: 2px solid white;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
const OPT_PAL = [
  { idle: "bg-white border-slate-200", label: "bg-slate-100 text-slate-600" },
  { idle: "bg-white border-slate-200", label: "bg-slate-100 text-slate-600" },
  { idle: "bg-white border-slate-200", label: "bg-slate-100 text-slate-600" },
  { idle: "bg-white border-slate-200", label: "bg-slate-100 text-slate-600" },
];

function QuestionCard({ q, index, onDelete, animate, delay = 0 }) {
  const [show, setShow] = useState(!animate);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (!animate) return;
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [animate, delay]);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`transition-all duration-300 ${
        animate
          ? show
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3"
          : ""
      }`}
    >
      <Card
        className={`p-6 transition-all duration-200 ${
          hover ? "border-blue-300 shadow-md" : ""
        }`}
        style={hover ? { boxShadow: "0 4px 20px rgba(37,99,235,0.08)" } : {}}
      >
        <div className="flex gap-5">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
              <span className="font-bold text-blue-700 text-sm">
                {index + 1}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900 mb-4 leading-snug">
              {q.question}
            </h4>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {q.options.map((opt, oi) => {
                const correct = oi === q.correct;
                return (
                  <div
                    key={oi}
                    className={`p-3 rounded-xl border-2 transition-colors ${
                      correct
                        ? "border-green-400 bg-green-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                          correct
                            ? "bg-green-600 text-white"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {OPTION_LABELS[oi] || String.fromCharCode(65 + oi)}
                      </div>
                      <span className="text-sm text-slate-700 flex-1 leading-snug">
                        {opt}
                      </span>
                      {correct && (
                        <CheckCircle2
                          size={16}
                          className="text-green-600 flex-shrink-0"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-5 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock size={13} /> {q.timeLimit}s
              </span>
              <span className="flex items-center gap-1.5">
                <BarChart3 size={13} /> {q.points} pts
              </span>
              {q.answer && (
                <span className="flex items-center gap-1.5 text-green-600 font-medium ml-auto">
                  <Check size={13} /> {q.answer}
                </span>
              )}
            </div>
          </div>

          {/* Delete */}
          <div className="flex-shrink-0">
            <button
              onClick={() => onDelete(index)}
              className={`p-2 rounded-xl transition-all duration-150 ${
                hover
                  ? "opacity-100 bg-red-50 text-red-500 hover:bg-red-100"
                  : "opacity-0"
              }`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, color }) {
  const colors = {
    blue: {
      wrap: "from-blue-50 to-blue-100/40 border-blue-200",
      icon: "bg-blue-600",
    },
    green: {
      wrap: "from-green-50 to-green-100/40 border-green-200",
      icon: "bg-green-600",
    },
    purple: {
      wrap: "from-purple-50 to-purple-100/40 border-purple-200",
      icon: "bg-purple-600",
    },
  };
  const c = colors[color];
  return (
    <Card className={`p-6 bg-gradient-to-br ${c.wrap}`}>
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 ${c.icon} rounded-xl flex items-center justify-center flex-shrink-0`}
        >
          <Icon size={22} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
        </div>
      </div>
    </Card>
  );
}

function StatTile({ label, value, icon: Icon }) {
  return (
    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-slate-400" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
          {label}
        </span>
      </div>
      <p className="font-bold text-slate-900 text-lg leading-tight">{value}</p>
    </div>
  );
}

function Btn({
  children,
  onClick,
  loading,
  disabled,
  variant = "primary",
  size = "md",
}) {
  const [press, setPress] = useState(false);
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 select-none";
  const sizes = { md: "h-10 px-5 text-sm", lg: "h-12 px-8 text-sm" };
  const variants = {
    primary:
      "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20",
    outline:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300",
    white: "bg-white text-blue-700 hover:bg-blue-50 shadow-sm",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      onMouseLeave={() => setPress(false)}
      className={`${base} ${sizes[size]} ${variants[variant]} ${
        disabled || loading ? "opacity-50 cursor-not-allowed" : ""
      }`}
      style={{ transform: press && !disabled ? "scale(0.97)" : "scale(1)" }}
    >
      {loading ? (
        <svg
          className="animate-spin"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeOpacity=".25"
            strokeWidth="3"
          />
          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      ) : null}
      {children}
    </button>
  );
}

export default function CreateRoom() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const { user } = useAuth();
  const [roomData, setRoomData] = useState({
    title: "",
    topic: "",
    difficulty: "Medium",
    numQuestions: 5,
    timePerQ: 30,
    scheduledAt: null,
  });
  const [questions, setQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [genError, setGenError] = useState("");
  const [errors, setErrors] = useState({});
  const { createRoom, on } = useSocket();

  useEffect(() => {
    const off = on("room-created", ({ roomId }) => {
      message.success("Room launched!");
      setTimeout(() => navigate(`/teacher/room/${roomId}`), 700);
    });
    return () => off();
  }, [on, navigate]);

  const goTo = (n) => {
    setDir(n > step ? 1 : -1);
    setStep(n);
  };

  const validateStep0 = () => {
    const e = {};
    if (!roomData.title.trim()) e.title = "Quiz title is required";
    if (!roomData.topic.trim()) e.topic = "Topic is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleNext = () => {
    if (step === 0 && !validateStep0()) return;
    goTo(step + 1);
  };
  console.log("new questions are", questions);
  const generateQues = useGenerateQuesitions();
  const createQuizRoom = useCreateQuiz();
  const handleGenerate = async () => {
    setGenerating(true);
    setGenError("");
    try {
      const res = await generateQues.mutateAsync({
        topic: roomData.topic,
        quesNo: String(roomData.numQuestions),
        description: roomData.title || roomData.topic,
        difficulty: roomData.difficulty,
      });
      if (!res?.success || !res?.quiz)
        throw new Error(res?.msg || "Generation failed");
      const qs = (res.quiz || []).map((q) =>
        normaliseQuestion(q, roomData.timePerQ),
      );
      if (!qs.length)
        throw new Error("No questions returned. Please try again.");
      setQuestions(qs);
      message.success(`${qs.length} questions generated!`);
    } catch (err) {
      const m = err?.message || "Failed to generate questions";
      setGenError(m);
      message.error(m);
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setQuestions([]);
    setGenError("");
  };
  const handleDeleteQ = (idx) =>
    setQuestions((p) => p.filter((_, i) => i !== idx));

  const handleLaunch = async () => {
    if (!questions.length) {
      message.warning("Add at least one question");
      return;
    }
    setLaunching(true);
    try {
      // createRoom(user.user.name, questions, user.user._id);
      const formData = {
        name: roomData.title,
        topic: roomData.topic,
        difficulty: roomData.difficulty,
        questions: questions,
        scheduledAt: roomData.scheduledAt || null,
      };
      const res = await createQuizRoom.mutateAsync(formData);
      setLaunching(false);
      navigate("/teacher/dashboard");
    } catch {
      message.error("Failed to launch");
    } finally {
      setLaunching(false);
    }
  };

  return (
    <DashboardLayout>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 0.9s linear infinite; }
      `}</style>

      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <StepIndicator step={step} />

          {step === 0 && (
            <Page dir={dir} key="step0">
              <div className="max-w-4xl mx-auto">
                <div className="mb-10">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
                    Configure Your Quiz
                  </h2>
                  <p className="text-slate-500 text-base">
                    Set up the basic parameters for your quiz session
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-5 mb-10">
                  <FeatureCard
                    icon={Target}
                    title="Focused Learning"
                    desc="AI-powered questions tailored to your topic"
                    color="blue"
                  />
                  <FeatureCard
                    icon={TrendingUp}
                    title="Adaptive Difficulty"
                    desc="Choose challenge level that fits your audience"
                    color="green"
                  />
                  <FeatureCard
                    icon={Users}
                    title="Live Engagement"
                    desc="Real-time quiz sessions with instant feedback"
                    color="purple"
                  />
                </div>

                <Card className="p-8">
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Quiz Title <span className="text-red-500">*</span>
                        </label>
                        <TextInput
                          placeholder="Enter quiz title"
                          value={roomData.title}
                          onChange={(e) => {
                            setRoomData({ ...roomData, title: e.target.value });
                            if (errors.title)
                              setErrors({ ...errors, title: "" });
                          }}
                          error={errors.title}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Topic / Subject{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <TextInput
                          placeholder="e.g. JavaScript Fundamentals"
                          value={roomData.topic}
                          onChange={(e) => {
                            setRoomData({ ...roomData, topic: e.target.value });
                            if (errors.topic)
                              setErrors({ ...errors, topic: "" });
                          }}
                          error={errors.topic}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-3">
                        Difficulty Level
                      </label>
                      <div className="grid grid-cols-4 gap-3">
                        {DIFFICULTIES.map((d) => (
                          <PillBtn
                            key={d}
                            label={d}
                            active={roomData.difficulty === d}
                            onClick={() =>
                              setRoomData({ ...roomData, difficulty: d })
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          Number of Questions
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {QUESTION_COUNTS.map((n) => (
                            <PillBtn
                              key={n}
                              label={n}
                              active={roomData.numQuestions === n}
                              onClick={() =>
                                setRoomData({ ...roomData, numQuestions: n })
                              }
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-sm font-semibold text-slate-700">
                            Time per Question
                          </label>
                          <div className="bg-blue-50 border border-blue-200 px-3 py-1 rounded-lg">
                            <span className="text-base font-bold text-blue-700 tabular-nums">
                              {roomData.timePerQ}s
                            </span>
                          </div>
                        </div>
                        <TimeSlider
                          value={roomData.timePerQ}
                          onChange={(v) =>
                            setRoomData({ ...roomData, timePerQ: v })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">
                          When to start?
                        </label>
                        <div className="flex gap-3 mb-4">
                          <PillBtn
                            label="Start Immediately"
                            active={!roomData.scheduledAt}
                            onClick={() =>
                              setRoomData({ ...roomData, scheduledAt: null })
                            }
                          />
                          <PillBtn
                            label="Schedule for Later"
                            active={!!roomData.scheduledAt}
                            onClick={() =>
                              setRoomData({
                                ...roomData,
                                scheduledAt: new Date(
                                  Date.now() + 60 * 60 * 1000,
                                )
                                  .toISOString()
                                  .slice(0, 16), // 1hr from now as default
                              })
                            }
                          />
                        </div>

                        {roomData.scheduledAt && (
                          <div className="mt-2">
                            <input
                              type="datetime-local"
                              value={roomData.scheduledAt}
                              min={new Date(Date.now() + 5 * 60 * 1000)
                                .toISOString()
                                .slice(0, 16)}
                              onChange={(e) =>
                                setRoomData({
                                  ...roomData,
                                  scheduledAt: e.target.value,
                                })
                              }
                              className="h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                            />
                            <p className="text-xs text-slate-400 mt-1.5 font-medium">
                              Room code will be generated now — students can
                              join before it starts
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 flex justify-end">
                    <Btn size="lg" onClick={handleNext}>
                      Continue to Generation <ChevronRight size={18} />
                    </Btn>
                  </div>
                </Card>
              </div>
            </Page>
          )}

          {step === 1 && (
            <Page dir={dir} key="step1">
              <div className="max-w-5xl mx-auto">
                <div className="mb-10">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
                    AI Question Generation
                  </h2>
                  <p className="text-slate-500 text-base">
                    Generate high-quality questions powered by AI
                  </p>
                </div>

                <Card className="p-8 mb-8">
                  <div className="flex items-center justify-between gap-8">
                    <div className="flex items-start gap-5">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                        }}
                      >
                        <Wand2 size={28} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                          Generate {roomData.numQuestions} Questions
                        </h3>
                        <div className="space-y-0.5">
                          <p className="text-sm text-slate-500">
                            <span className="font-semibold text-slate-700">
                              Topic:{" "}
                            </span>
                            {roomData.topic}
                          </p>
                          <p className="text-sm text-slate-500">
                            <span className="font-semibold text-slate-700">
                              Difficulty:{" "}
                            </span>
                            {roomData.difficulty}
                          </p>
                          <p className="text-sm text-slate-500">
                            <span className="font-semibold text-slate-700">
                              Time:{" "}
                            </span>
                            {roomData.timePerQ}s per question
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {genError && (
                        <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 max-w-xs">
                          <AlertCircle size={14} className="flex-shrink-0" />
                          {genError}
                        </div>
                      )}

                      {questions.length === 0 ? (
                        <Btn
                          size="lg"
                          loading={generating}
                          onClick={handleGenerate}
                        >
                          {!generating && <Wand2 size={18} />}
                          {generating ? "Generating…" : "Generate Questions"}
                        </Btn>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                            <CheckCircle2 size={18} /> Generated
                          </span>
                          <Btn variant="outline" onClick={handleRegenerate}>
                            <RotateCw size={14} /> Regenerate
                          </Btn>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {questions.length > 0 && (
                  <div>
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="text-lg font-bold text-slate-900">
                        Questions ({questions.length})
                      </h3>
                    </div>

                    <div className="space-y-4 mb-8">
                      {questions.map((q, i) => (
                        <QuestionCard
                          key={q.id}
                          q={q}
                          index={i}
                          onDelete={handleDeleteQ}
                          animate
                          delay={i * 55}
                        />
                      ))}
                    </div>

                    <div className="flex justify-end">
                      <Btn size="lg" onClick={handleNext}>
                        Continue to Review <ChevronRight size={18} />
                      </Btn>
                    </div>
                  </div>
                )}
              </div>
            </Page>
          )}

          {step === 2 && (
            <Page dir={dir} key="step2">
              <div className="max-w-5xl mx-auto">
                <div className="mb-10">
                  <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
                    Review & Publish
                  </h2>
                  <p className="text-slate-500 text-base">
                    Review your quiz configuration before publishing
                  </p>
                </div>

                <Card className="p-8 mb-8">
                  <h3 className="text-base font-bold text-slate-900 mb-5">
                    Quiz Overview
                  </h3>
                  <div className="grid grid-cols-4 gap-4">
                    <StatTile
                      label="Quiz Title"
                      value={roomData.title}
                      icon={BookOpen}
                    />
                    <StatTile
                      label="Topic"
                      value={roomData.topic}
                      icon={Target}
                    />
                    <StatTile
                      label="Total Questions"
                      value={`${questions.length} questions`}
                      icon={BarChart3}
                    />
                    <StatTile
                      label="Est. Duration"
                      value={`${Math.ceil((questions.length * roomData.timePerQ) / 60)} min`}
                      icon={Clock}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <StatTile
                      label="Difficulty Level"
                      value={roomData.difficulty}
                      icon={Settings}
                    />
                    <StatTile
                      label="Time per Question"
                      value={`${roomData.timePerQ} seconds`}
                      icon={Clock}
                    />
                  </div>
                </Card>

                {questions.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-base font-bold text-slate-900 mb-4">
                      Question List
                    </h3>
                    <div className="space-y-4">
                      {questions.map((q, i) => (
                        <QuestionCard
                          key={q.id}
                          q={q}
                          index={i}
                          onDelete={handleDeleteQ}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div
                  className="rounded-2xl p-6 flex items-center justify-between"
                  style={{
                    background: "linear-gradient(135deg,#2563eb,#1d4ed8)",
                  }}
                >
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {roomData.scheduledAt
                        ? "Schedule Quiz"
                        : "Ready to Publish"}
                    </h3>
                    <p className="text-blue-200 text-sm">
                      {roomData.scheduledAt
                        ? `Will auto-start on ${new Date(roomData.scheduledAt).toLocaleString()}`
                        : "Your quiz will go live instantly via Room ID"}
                    </p>
                  </div>
                  <Btn
                    variant="white"
                    size="lg"
                    loading={launching}
                    disabled={!questions.length}
                    onClick={handleLaunch}
                  >
                    <Rocket size={18} />
                    {launching
                      ? "Launching…"
                      : roomData.scheduledAt
                        ? "Schedule Quiz"
                        : "Publish Quiz"}
                  </Btn>
                </div>
              </div>
            </Page>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
