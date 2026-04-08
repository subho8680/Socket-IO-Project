import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Input, Button, Slider, Select, message, Spin } from "antd";
import {
  ArrowLeftOutlined,
  ThunderboltOutlined,
  EditOutlined,
  DeleteOutlined,
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
  const steps = [
    { title: "Room Details", icon: <EditOutlined /> },
    { title: "Generate Questions", icon: <RobotOutlined /> },
    { title: "Review & Launch", icon: <FireOutlined /> },
  ];

  return (
    <div className="flex items-center justify-between mb-10 px-2">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                i < step
                  ? "bg-emerald-500 text-white"
                  : i === step
                    ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white ring-4 ring-indigo-500/30"
                    : "bg-zinc-800 text-zinc-400"
              }`}
            >
              {i < step ? <CheckOutlined className="text-lg" /> : s.icon}
            </div>
            <p
              className={`mt-2 text-sm font-medium transition-colors ${
                i === step ? "text-white" : "text-zinc-400"
              }`}
            >
              {s.title}
            </p>
          </div>

          {i < steps.length - 1 && (
            <div className="flex-1 h-px bg-zinc-800 mx-6 mt-5" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function QuestionCard({ q, index, onDelete }) {
  return (
    <div className="group bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {index + 1}
          </div>

          <div>
            <p className="text-base text-white leading-relaxed font-medium">
              {q.question}
            </p>
          </div>
        </div>

        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onDelete(index)}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {q.options.map((opt, oi) => {
          const isCorrect = oi === q.correct;
          const color = OPTION_COLORS[oi] || "#6366f1";

          return (
            <div
              key={oi}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all ${
                isCorrect
                  ? "border-emerald-500 bg-emerald-500/10"
                  : "border-zinc-800 hover:border-zinc-700"
              }`}
            >
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{
                  backgroundColor: `${color}20`,
                  color: color,
                }}
              >
                {OPTION_LABELS[oi] || String.fromCharCode(65 + oi)}
              </div>
              <span className="text-zinc-300 text-sm leading-relaxed flex-1">
                {opt}
              </span>
              {isCorrect && (
                <CheckOutlined className="text-emerald-500 text-xl" />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-6 mt-6 text-sm text-zinc-400">
        <div className="flex items-center gap-2">
          <ClockCircleOutlined />
          <span>{q.timeLimit}s</span>
        </div>
        <div className="flex items-center gap-2">
          <TrophyOutlined />
          <span>{q.points} pts</span>
        </div>
        {q.answer && (
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <CheckOutlined />
            {q.answer}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyQuestions() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-950/50">
      <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center mb-5">
        <BookOutlined style={{ fontSize: 32, color: "#4b5563" }} />
      </div>
      <h3 className="text-lg font-semibold text-zinc-300 mb-1">
        No questions yet
      </h3>
      <p className="text-zinc-500 text-sm max-w-xs">
        Generate high-quality questions using AI
      </p>
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
      message.success("Room created successfully! 🎉");
      setTimeout(() => {
        navigate(`/teacher/room/${roomId}`);
      }, 800);
    });
    return () => roomSuccess();
  }, [on, navigate]);

  const handleRoomDetails = async () => {
    try {
      const vals = await form.validateFields();
      setRoomData(vals);
      setStep(1);
    } catch (e) {}
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
        throw new Error("No questions were generated. Please try again.");
      }

      setQuestions(normalised);
      message.success(`${normalised.length} questions generated successfully!`);
    } catch (err) {
      const errMsg = err?.message || "Failed to generate questions";
      setGenError(errMsg);
      message.error(errMsg);
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
      message.warning("Please add at least one question");
      return;
    }

    setLaunching(true);
    try {
      createRoom(user.user.name, questions,user.user._id);
    } catch (err) {
      message.error("Failed to launch room");
    } finally {
      setLaunching(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-zinc-950 text-white">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex items-center gap-4 mb-10">
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() =>
                step > 0 ? setStep(step - 1) : navigate("/teacher/dashboard")
              }
              className="text-zinc-400 hover:text-white"
            >
              {step > 0 ? "Back" : "Dashboard"}
            </Button>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Create Quiz Room
              </h1>
              <p className="text-zinc-400 mt-1">
                Design, generate, and launch engaging quizzes
              </p>
            </div>
          </div>

          <StepIndicator step={step} />

          {step === 0 && (
            <div className="bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  numQuestions: 5,
                  timePerQ: 30,
                  difficulty: "Medium",
                }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Form.Item
                    label="Room Title"
                    name="title"
                    rules={[
                      { required: true, message: "Please enter a room title" },
                    ]}
                  >
                    <Input
                      size="large"
                      placeholder="e.g. React Advanced Concepts"
                      className="bg-zinc-950 border-zinc-700 rounded-2xl py-3 text-base"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Topic / Subject"
                    name="topic"
                    rules={[{ required: true, message: "Topic is required" }]}
                  >
                    <Input
                      size="large"
                      placeholder="e.g. useEffect, Custom Hooks & Performance"
                      className="bg-zinc-950 border-zinc-700 rounded-2xl py-3 text-base"
                    />
                  </Form.Item>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <Form.Item label="Difficulty" name="difficulty">
                    <Select size="large" className="rounded-2xl">
                      {DIFFICULTIES.map((d) => (
                        <Select.Option key={d} value={d}>
                          {d}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item label="Number of Questions" name="numQuestions">
                    <Select size="large" className="rounded-2xl">
                      {[5, 10, 15, 20].map((n) => (
                        <Select.Option key={n} value={n}>
                          {n} Questions
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label={
                      <div className="flex justify-between w-full text-sm">
                        <span>Time per Question</span>
                        <span className="font-mono text-indigo-400">
                          {form.getFieldValue("timePerQ") || 30}s
                        </span>
                      </div>
                    }
                    name="timePerQ"
                  >
                    <Slider
                      min={10}
                      max={60}
                      step={5}
                      marks={{ 10: "10s", 30: "30s", 60: "60s" }}
                      className="pt-4"
                    />
                  </Form.Item>
                </div>
              </Form>

              <Button
                type="primary"
                size="large"
                block
                onClick={handleRoomDetails}
                className="mt-10 h-12 text-base font-semibold rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500"
              >
                Continue to AI Generation →
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-10 text-center">
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-3xl flex items-center justify-center border border-indigo-500/20 mb-6">
                  <RobotOutlined style={{ fontSize: 40, color: "#a5b4fc" }} />
                </div>

                <h2 className="text-2xl font-semibold mb-2">
                  AI Question Generator
                </h2>
                <p className="text-zinc-400">
                  Generating{" "}
                  <span className="text-indigo-400 font-medium">
                    {roomData.numQuestions || 5}
                  </span>{" "}
                  questions on
                </p>
                <p className="text-lg font-medium text-white mt-1">
                  "{roomData.topic}"
                </p>

                {generating ? (
                  <div className="mt-10">
                    <Spin size="large" />
                    <p className="mt-5 text-zinc-400 text-sm">
                      Crafting intelligent questions with AI...
                    </p>
                  </div>
                ) : genError ? (
                  <div className="mt-8">
                    <div className="bg-red-950/50 border border-red-500/30 text-red-400 p-5 rounded-2xl mb-6 text-sm">
                      {genError}
                    </div>
                    <Button
                      size="large"
                      onClick={handleGenerate}
                      icon={<ReloadOutlined />}
                      className="bg-red-600 hover:bg-red-500 h-11 px-8 rounded-2xl"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : questions.length === 0 ? (
                  <Button
                    size="large"
                    onClick={handleGenerate}
                    icon={<ThunderboltOutlined />}
                    className="mt-8 h-12 px-10 text-base font-semibold rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600"
                  >
                    Generate Questions with AI
                  </Button>
                ) : (
                  <div className="mt-8 flex items-center justify-center gap-3 text-emerald-400 text-base font-medium">
                    <CheckOutlined className="text-xl" />
                    Questions Generated Successfully
                  </div>
                )}
              </div>

              {questions.length > 0 && (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold">
                      Generated Questions ({questions.length})
                    </h3>
                    <Button
                      onClick={handleRegenerate}
                      icon={<ReloadOutlined />}
                      className="text-zinc-400 hover:text-white text-sm"
                    >
                      Regenerate All
                    </Button>
                  </div>

                  <div className="space-y-5">
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
                    type="primary"
                    size="large"
                    block
                    onClick={() => setStep(2)}
                    className="h-12 text-base font-semibold rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600"
                  >
                    Review & Launch Room →
                  </Button>
                </>
              )}

              {!generating && questions.length === 0 && !genError && (
                <EmptyQuestions />
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8">
                <h3 className="text-xl font-semibold flex items-center gap-3 mb-6">
                  <FireOutlined className="text-orange-500" /> Room Summary
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                  {[
                    { label: "Room Title", value: roomData.title },
                    { label: "Topic", value: roomData.topic },
                    {
                      label: "Questions",
                      value: `${questions.length} questions`,
                    },
                    {
                      label: "Time per Question",
                      value: `${roomData.timePerQ || 30}s`,
                    },
                    {
                      label: "Difficulty",
                      value: roomData.difficulty || "Medium",
                    },
                    {
                      label: "Estimated Duration",
                      value: `~${Math.ceil((questions.length * (roomData.timePerQ || 30)) / 60)} min`,
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5"
                    >
                      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
                        {item.label}
                      </p>
                      <p className="text-base font-medium text-white">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {questions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-5">
                    Final Questions
                  </h3>
                  <div className="space-y-5">
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

              <div className="bg-gradient-to-br from-indigo-950/50 to-transparent border border-indigo-500/20 rounded-3xl p-6 text-center">
                <p className="text-zinc-300 text-sm">
                  Once launched, students can join using the{" "}
                  <span className="font-semibold text-indigo-400">Room ID</span>
                  .
                </p>
              </div>

              <Button
                type="primary"
                size="large"
                block
                loading={launching}
                disabled={questions.length === 0}
                onClick={handleLaunch}
                className="h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 transition-all"
              >
                {launching ? "Launching Room..." : "🚀 Launch Live Quiz Room"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
