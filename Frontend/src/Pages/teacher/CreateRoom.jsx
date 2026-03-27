import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Slider, Select, message, Spin } from "antd";
import {
  ArrowLeftOutlined,
  ThunderboltOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  RobotOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  TrophyOutlined,
  BookOutlined,
  FireOutlined,
} from "@ant-design/icons";
import DashboardLayout from "../../components/common/DashboardLayout";
import { OPTION_LABELS, OPTION_COLORS } from "../../data/mockData";
import { createQuiz } from "../../ApiCall";
import { useSocket } from "../../Services/Usesocket";
import { useAuth } from "../../context/AuthContext";
const DIFFICULTIES = ["Easy", "Medium", "Hard", "Mixed"];
const TOPICS_SUGGESTIONS = [
  "React Hooks",
  "JavaScript Closures",
  "Data Structures",
  "Python Basics",
  "SQL Queries",
  "System Design",
];
function getCorrectIndex(correctOption) {
  return parseInt(correctOption?.quesionNo ?? "1", 10) - 1;
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
  const steps = ["Room Details", "Generate Questions", "Review & Launch"];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className="flex flex-col items-center">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={{
                background:
                  i < step
                    ? "#7c3aed"
                    : i === step
                      ? "linear-gradient(135deg,#7c3aed,#06b6d4)"
                      : "#1e1e35",
                color: i <= step ? "#fff" : "#4b4b68",
                border:
                  i < step
                    ? "none"
                    : `2px solid ${i === step ? "#7c3aed" : "#1e1e35"}`,
              }}
            >
              {i < step ? <CheckOutlined style={{ fontSize: 10 }} /> : i + 1}
            </div>
            <span
              className="text-xs mt-1 hidden sm:block"
              style={{
                color: i === step ? "#a78bfa" : "#4b4b68",
                fontWeight: i === step ? 600 : 400,
              }}
            >
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="flex-1 h-px mx-2 mb-4 transition-all"
              style={{ background: i < step ? "#7c3aed" : "#1e1e35" }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function QuestionCard({ q, index, onDelete }) {
  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: "#0d0d18",
        border: "1px solid #1e1e35",
        animation: "fadeUp 0.3s ease both",
        animationDelay: `${index * 0.04}s`,
      }}
    >
      {/* Question header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "rgba(124,58,237,0.2)", color: "#a78bfa" }}
          >
            {index + 1}
          </span>
          <p className="text-sm text-txt-primary leading-relaxed font-medium">
            {q.question}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            onClick={() => onDelete(index)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{
              background: "#12121f",
              border: "1px solid #1e1e35",
              color: "#4b4b68",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#4b4b68")}
            title="Delete question"
          >
            <DeleteOutlined style={{ fontSize: 11 }} />
          </button>
        </div>
      </div>

      {/* Options grid */}
      <div className="grid grid-cols-2 gap-2">
        {q.options.map((opt, oi) => {
          const isCorrect = oi === q.correct;
          // parse hex color to rgba for background
          const hex = (OPTION_COLORS[oi] || "#7c3aed").replace("#", "");
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          const bgRgba = isCorrect ? `rgba(${r},${g},${b},0.15)` : "#12121f";
          const borderColor = isCorrect
            ? `rgba(${r},${g},${b},0.5)`
            : "#1e1e35";

          return (
            <div
              key={oi}
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: bgRgba, border: `1px solid ${borderColor}` }}
            >
              <span
                className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background: (OPTION_COLORS[oi] || "#7c3aed") + "25",
                  color: OPTION_COLORS[oi] || "#7c3aed",
                }}
              >
                {OPTION_LABELS[oi] || String.fromCharCode(65 + oi)}
              </span>
              <span className="text-xs text-txt-secondary truncate flex-1">
                {opt}
              </span>
              {isCorrect && (
                <CheckOutlined
                  style={{ fontSize: 10, color: "#10b981", flexShrink: 0 }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 mt-3 text-xs text-txt-muted">
        <span className="flex items-center gap-1">
          <ClockCircleOutlined /> {q.time}s
        </span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <TrophyOutlined /> {q.points} pts
        </span>
        {q.answer && (
          <>
            <span>·</span>
            <span className="text-emerald-500 font-medium truncate max-w-[120px]">
              ✓ {q.answer}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyQuestions() {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 rounded-xl"
      style={{ border: "1px dashed #1e1e35", background: "#0d0d18" }}
    >
      <BookOutlined
        style={{ fontSize: 32, color: "#2d2d4a", marginBottom: 8 }}
      />
      <p className="text-txt-muted text-sm">No questions yet</p>
      <p className="text-txt-muted text-xs mt-1">Generate with AI above</p>
    </div>
  );
}

export default function CreateRoom() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form] = Form.useForm();
  const { user } = useAuth();
  const [roomData, setRoomData] = useState({});
  const [questions, setQuestions] = useState([]);
  const [quizMeta, setQuizMeta] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [genError, setGenError] = useState("");
  const { createRoom, on } = useSocket();
  useEffect(() => {
    const roomSuccess = on("room-created", ({ roomId }) => {
      message.success(`Room created! Share the Room ID with students.`);
      setTimeout(() => {
        navigate(`/teacher/room/${roomId}`);
      }, 500);
    });
    return () => {
      roomSuccess();
    };
  }, [on]);

  const handleRoomDetails = async () => {
    try {
      const vals = await form.validateFields();
      setRoomData(vals);
      setStep(1);
    } catch {}
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError("");

    try {
      const payload = {
        topic: roomData.topic,
        quesNo: String(roomData.numQuestions || 5),
        description: roomData.title || roomData.topic,
      };

      const response = await createQuiz(payload);
      if (!response?.success || !response?.quiz) {
        throw new Error(response?.msg || "Failed to generate questions");
      }

      const { quiz } = response;

      setQuizMeta({
        _id: quiz._id,
        name: quiz.name,
        createdBy: quiz.createdBy,
      });

      const timePerQ = roomData.timePerQ || 30;
      const normalised = (quiz.questions || []).map((q) =>
        normaliseQuestion(q, timePerQ),
      );

      if (normalised.length === 0) {
        throw new Error("API returned 0 questions. Try again.");
      }

      setQuestions(normalised);
      message.success(`${normalised.length} questions generated ✨`);
    } catch (err) {
      const errMsg = err?.message || "Something went wrong. Please try again.";
      setGenError(errMsg);
      message.error(errMsg);
      console.error("Generate error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setQuestions([]);
    setQuizMeta(null);
    setGenError("");
  };

  const handleDeleteQ = (idx) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
    message.info("Question removed");
  };

  const handleLaunch = async () => {
    if (questions.length === 0) {
      message.warning("Add at least one question before launching");
      return;
    }
    setLaunching(true);
    console.log("clicked")
    try {
      createRoom(user.user.name, questions);
      // console.log("questions are",questions)
    } catch (err) {
      message.error("Failed to launch room. Try again.");
      console.error("Launch error:", err);
    } finally {
      setLaunching(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
        <button
          onClick={() =>
            step > 0 ? setStep(step - 1) : navigate("/teacher/dashboard")
          }
          className="flex items-center gap-2 text-txt-secondary hover:text-txt-primary text-sm mb-8 transition-colors"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <ArrowLeftOutlined />
          {step > 0 ? "Back" : "Back to Dashboard"}
        </button>

        <h1 className="text-2xl font-bold text-txt-primary mb-2">
          Create New Room
        </h1>
        <p className="text-txt-secondary text-sm mb-8">
          Set up your quiz room and generate questions with AI
        </p>

        <StepIndicator step={step} />
        {step === 0 && (
          <div>
            <div
              className="p-6 rounded-2xl"
              style={{ background: "#12121f", border: "1px solid #1e1e35" }}
            >
              <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                initialValues={{
                  numQuestions: 5,
                  timePerQ: 30,
                  difficulty: "Medium",
                }}
              >
                <Form.Item
                  label={
                    <span className="text-txt-secondary text-sm font-medium">
                      Room title
                    </span>
                  }
                  name="title"
                  rules={[{ required: true, message: "Title is required" }]}
                >
                  <Input
                    placeholder="e.g. React Fundamentals Quiz"
                    size="large"
                    style={{ borderRadius: 10, height: 46 }}
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span className="text-txt-secondary text-sm font-medium">
                      Topic / Subject
                    </span>
                  }
                  name="topic"
                  rules={[{ required: true, message: "Topic is required" }]}
                >
                  <Input
                    placeholder="e.g. React Hooks & State Management"
                    size="large"
                    style={{ borderRadius: 10, height: 46 }}
                  />
                </Form.Item>

                {/* <div className="flex flex-wrap gap-2 mb-4">
                  {TOPICS_SUGGESTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => form.setFieldValue("topic", t)}
                      className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: "#0d0d18",
                        border: "1px solid #1e1e35",
                        color: "#8b8ba7",
                        cursor: "pointer",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div> */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Form.Item
                    label={
                      <span className="text-txt-secondary text-sm font-medium">
                        Difficulty
                      </span>
                    }
                    name="difficulty"
                  >
                    <Select
                      size="large"
                      options={DIFFICULTIES.map((d) => ({
                        label: d,
                        value: d,
                      }))}
                      style={{ height: 46 }}
                    />
                  </Form.Item>

                  <Form.Item
                    label={
                      <span className="text-txt-secondary text-sm font-medium">
                        Number of questions
                      </span>
                    }
                    name="numQuestions"
                  >
                    <Select
                      size="large"
                      options={[5, 10, 15, 20].map((n) => ({
                        label: `${n} questions`,
                        value: n,
                      }))}
                      style={{ height: 46 }}
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  label={
                    <div className="flex justify-between w-full">
                      <span className="text-txt-secondary text-sm font-medium">
                        Time per question
                      </span>
                      <Form.Item noStyle shouldUpdate>
                        {({ getFieldValue }) => (
                          <span className="text-brand-light text-sm font-bold">
                            {getFieldValue("timePerQ") || 30}s
                          </span>
                        )}
                      </Form.Item>
                    </div>
                  }
                  name="timePerQ"
                >
                  <Slider
                    min={10}
                    max={60}
                    step={5}
                    marks={{ 10: "10s", 30: "30s", 60: "60s" }}
                    styles={{
                      track: { background: "#7c3aed" },
                      handle: { borderColor: "#7c3aed", background: "#7c3aed" },
                    }}
                  />
                </Form.Item>
              </Form>
            </div>

            <Button
              block
              size="large"
              onClick={handleRoomDetails}
              style={{
                marginTop: 16,
                background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
                border: "none",
                height: 50,
                fontWeight: 700,
                fontSize: 15,
                borderRadius: 12,
                color: "#fff",
              }}
            >
              Continue to Questions →
            </Button>
          </div>
        )}

        {step === 1 && (
          <div>
            <div
              className="p-8 rounded-2xl text-center mb-4"
              style={{ background: "#12121f", border: "1px solid #1e1e35" }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: "rgba(124,58,237,0.15)",
                  border: "1px solid rgba(124,58,237,0.3)",
                }}
              >
                <RobotOutlined style={{ fontSize: 28, color: "#a78bfa" }} />
              </div>

              <h3 className="text-lg font-bold text-txt-primary mb-2">
                AI Question Generator
              </h3>
              <p className="text-txt-secondary text-sm mb-1">
                Generating{" "}
                <span className="text-brand-light font-semibold">
                  {roomData.numQuestions || 5} questions
                </span>{" "}
                on
              </p>
              <p className="text-txt-primary font-semibold mb-6">
                "{roomData.topic}"
              </p>

              {generating ? (
                <div className="space-y-3">
                  <Spin size="large" />
                  <p className="text-txt-secondary text-sm mt-3 animate-pulse">
                    Generating with AI magic... ✨
                  </p>
                </div>
              ) : genError ? (
                <div>
                  <div
                    className="px-4 py-3 rounded-xl mb-4 text-sm"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      color: "#f87171",
                    }}
                  >
                    {genError}
                  </div>
                  <Button
                    size="large"
                    onClick={handleGenerate}
                    icon={<ReloadOutlined />}
                    style={{
                      background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
                      border: "none",
                      height: 48,
                      paddingInline: 36,
                      fontWeight: 700,
                      borderRadius: 12,
                      color: "#fff",
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              ) : questions.length === 0 ? (
                <Button
                  size="large"
                  onClick={handleGenerate}
                  icon={<ThunderboltOutlined />}
                  style={{
                    background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
                    border: "none",
                    height: 48,
                    paddingInline: 36,
                    fontWeight: 700,
                    borderRadius: 12,
                    color: "#fff",
                  }}
                >
                  Generate with AI
                </Button>
              ) : (
                <div
                  className="flex items-center gap-2 justify-center"
                  style={{ color: "#10b981" }}
                >
                  <CheckOutlined />
                  <span className="font-semibold">
                    {questions.length} questions ready
                  </span>
                </div>
              )}
            </div>

            {questions.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-txt-primary text-sm">
                    {questions.length} Questions
                  </span>
                  <button
                    onClick={handleRegenerate}
                    className="flex items-center gap-1 text-xs text-txt-secondary transition-colors"
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "#8b8ba7",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#f59e0b")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#8b8ba7")
                    }
                  >
                    <ReloadOutlined style={{ fontSize: 11 }} /> Regenerate
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  {questions.map((q, i) => (
                    <QuestionCard
                      key={q.id}
                      q={q}
                      index={i}
                      onDelete={handleDeleteQ}
                    />
                  ))}
                </div>

                <Button
                  block
                  size="large"
                  onClick={() => setStep(2)}
                  style={{
                    background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
                    border: "none",
                    height: 50,
                    fontWeight: 700,
                    fontSize: 15,
                    borderRadius: 12,
                    color: "#fff",
                  }}
                >
                  Review & Launch →
                </Button>
              </>
            )}

            {!generating && questions.length === 0 && !genError && (
              <EmptyQuestions />
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <div
              className="p-6 rounded-2xl mb-4"
              style={{ background: "#12121f", border: "1px solid #1e1e35" }}
            >
              <h3 className="font-bold text-txt-primary mb-4 flex items-center gap-2">
                <FireOutlined style={{ color: "#f59e0b" }} /> Room Summary
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Title", value: roomData.title },
                  { label: "Topic", value: roomData.topic },
                  {
                    label: "Questions",
                    value: `${questions.length} questions`,
                  },
                  { label: "Time per Q", value: `${roomData.timePerQ || 30}s` },
                  {
                    label: "Difficulty",
                    value: roomData.difficulty || "Medium",
                  },
                  {
                    label: "Total time",
                    value: `~${Math.ceil(
                      (questions.length * (roomData.timePerQ || 30)) / 60,
                    )} min`,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-3 rounded-xl"
                    style={{
                      background: "#0d0d18",
                      border: "1px solid #1e1e35",
                    }}
                  >
                    <div className="text-xs text-txt-muted mb-1">
                      {item.label}
                    </div>
                    <div className="font-semibold text-txt-primary text-sm truncate">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {quizMeta?._id && (
                <div
                  className="mt-3 px-3 py-2 rounded-lg flex items-center gap-2"
                  style={{
                    background: "rgba(6,182,212,0.08)",
                    border: "1px solid rgba(6,182,212,0.2)",
                  }}
                >
                  <span className="text-xs text-txt-muted">Quiz ID:</span>
                  <code
                    className="text-xs font-mono"
                    style={{ color: "#22d3ee" }}
                  >
                    {quizMeta._id}
                  </code>
                </div>
              )}
            </div>

            {questions.length > 0 ? (
              <div className="space-y-3 mb-4">
                {questions.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    q={q}
                    index={i}
                    onDelete={handleDeleteQ}
                  />
                ))}
              </div>
            ) : (
              <div className="mb-4">
                <EmptyQuestions />
                <p className="text-xs text-center text-red-400 mt-2">
                  All questions deleted — go back and regenerate
                </p>
              </div>
            )}

            <div
              className="p-4 rounded-xl mb-4"
              style={{
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.25)",
              }}
            >
              <p className="text-sm text-txt-secondary text-center">
                🚀 Launching creates your live room. Share the{" "}
                <span className="text-brand-light font-semibold">Room ID</span>{" "}
                with students to join.
              </p>
            </div>

            <Button
              block
              size="large"
              loading={launching}
              disabled={questions.length === 0}
              onClick={handleLaunch}
              style={{
                background:
                  questions.length === 0
                    ? "#1e1e35"
                    : "linear-gradient(135deg,#10b981,#059669)",
                border: "none",
                height: 50,
                fontWeight: 700,
                fontSize: 15,
                borderRadius: 12,
                color: questions.length === 0 ? "#4b4b68" : "#fff",
              }}
            >
              {launching ? "Launching..." : "🚀 Launch Room"}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
