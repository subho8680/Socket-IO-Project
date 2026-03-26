import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Form, Input, Button, Steps, message } from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/common/Logo";
import { registerStudent, registerTeacher } from "../../ApiCall";
const SUBJECTS = [
  "Mathematics",
  "Computer Science",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "English",
  "Other",
];

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signup } = useAuth();
  const [role, setRole] = useState(searchParams.get("role") || "student");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [form] = Form.useForm();

  const isTeacher = role === "teacher";

  const handleStep0 = async () => {
    try {
      const vals = await form.validateFields(["name", "email"]);
      setFormData((p) => ({ ...p, ...vals }));
      setStep(1);
    } catch {}
  };

  const handleStep1 = async () => {
    try {
      const vals = await form.validateFields(
        isTeacher ? ["password", "subject"] : ["password"],
      );
      setLoading(true);
      const newData = {
        ...formData,
        ...vals,
      };
      let res;
      if (isTeacher) {
        res = await registerTeacher(newData);
      } else {
        res = await registerStudent(newData);
      }
      await new Promise((r) => setTimeout(r, 900));
      signup({ res, role });
      message.success("Account created! Welcome to BrainBlast 🎉");
      navigate(isTeacher ? "/teacher/dashboard" : "/student/dashboard");
    } catch {}
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen flex font-sans"
      style={{ background: "#07070e" }}
    >
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10 relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg,#12121f 0%,#0d0d18 100%)",
          borderRight: "1px solid #1e1e35",
        }}
      >
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: "-10%",
            right: "-10%",
            width: 350,
            height: 350,
            background:
              "radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <Logo size="md" />
        <div className="relative z-10 space-y-6">
          {[
            {
              step: "01",
              title: "Pick your role",
              desc: "Are you teaching or learning today?",
            },
            {
              step: "02",
              title: "Your details",
              desc: "Name & email to identify you.",
            },
            {
              step: "03",
              title: "Set a password",
              desc: "Keep your account secure.",
            },
          ].map((s, i) => (
            <div
              key={s.step}
              className="flex gap-4 items-start"
              style={{
                opacity: step >= i ? 1 : 0.35,
                transition: "opacity 0.3s",
              }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  background:
                    step >= i
                      ? "rgba(124,58,237,0.3)"
                      : "rgba(255,255,255,0.05)",
                  border: `1px solid ${step >= i ? "rgba(124,58,237,0.5)" : "#1e1e35"}`,
                  color: step >= i ? "#a78bfa" : "#4b4b68",
                }}
              >
                {s.step}
              </div>
              <div>
                <div className="font-semibold text-sm text-txt-primary">
                  {s.title}
                </div>
                <div className="text-xs text-txt-secondary">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="relative z-10 text-xs text-txt-muted">
          © 2025 BrainBlast
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="md" />
          </div>

          <Steps
            current={step}
            size="small"
            className="mb-8"
            items={[
              {
                title: (
                  <span className="text-xs text-txt-secondary">Your info</span>
                ),
              },
              {
                title: (
                  <span className="text-xs text-txt-secondary">
                    Set password
                  </span>
                ),
              },
            ]}
          />

          {step === 0 && (
            <>
              <h1 className="text-2xl font-bold text-txt-primary mb-1">
                Create your account
              </h1>
              <p className="text-txt-secondary text-sm mb-6">
                Join BrainBlast and start quizzing
              </p>

              <div
                className="flex p-1 rounded-xl mb-6"
                style={{ background: "#12121f", border: "1px solid #1e1e35" }}
              >
                {["student", "teacher"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 capitalize"
                    style={{
                      background:
                        role === r
                          ? "linear-gradient(135deg,#7c3aed,#5b21b6)"
                          : "transparent",
                      color: role === r ? "#fff" : "#8b8ba7",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {r === "teacher" ? "🎓 Teacher" : "🧑‍💻 Student"}
                  </button>
                ))}
              </div>

              <Form form={form} layout="vertical" requiredMark={false}>
                <Form.Item
                  name="name"
                  rules={[
                    { required: true, message: "Name is required" },
                    { min: 2, message: "At least 2 characters" },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined style={{ color: "#4b4b68" }} />}
                    placeholder="Full name"
                    size="large"
                    style={{ borderRadius: 10, height: 48 }}
                  />
                </Form.Item>
                <Form.Item
                  name="email"
                  rules={[
                    {
                      required: true,
                      type: "email",
                      message: "Enter a valid email",
                    },
                  ]}
                >
                  <Input
                    prefix={<MailOutlined style={{ color: "#4b4b68" }} />}
                    placeholder="Email address"
                    size="large"
                    style={{ borderRadius: 10, height: 48 }}
                  />
                </Form.Item>
              </Form>

              <Button
                block
                size="large"
                onClick={handleStep0}
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
                Continue →
              </Button>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-txt-primary mb-1">
                Almost there!
              </h1>
              <p className="text-txt-secondary text-sm mb-6">
                Set your password{isTeacher ? " and pick your subject" : ""}
              </p>

              <Form
                form={form}
                layout="vertical"
                requiredMark={false}
                onFinish={handleStep1}
              >
                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: "Password required" },
                    { min: 6, message: "Minimum 6 characters" },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: "#4b4b68" }} />}
                    placeholder="Create password"
                    size="large"
                    style={{ borderRadius: 10, height: 48 }}
                  />
                </Form.Item>

                <Form.Item
                  name="confirm"
                  dependencies={["password"]}
                  rules={[
                    { required: true, message: "Please confirm" },
                    ({ getFieldValue }) => ({
                      validator(_, v) {
                        return !v || getFieldValue("password") === v
                          ? Promise.resolve()
                          : Promise.reject("Passwords do not match");
                      },
                    }),
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined style={{ color: "#4b4b68" }} />}
                    placeholder="Confirm password"
                    size="large"
                    style={{ borderRadius: 10, height: 48 }}
                  />
                </Form.Item>

                {isTeacher && (
                  <Form.Item
                    name="subject"
                    label={
                      <span className="text-txt-secondary text-sm">
                        Your subject
                      </span>
                    }
                    rules={[{ required: true, message: "Pick a subject" }]}
                  >
                    <div className="flex flex-wrap gap-2 mt-1">
                      {SUBJECTS.map((s) => (
                        <Form.Item noStyle key={s} shouldUpdate>
                          {({ getFieldValue, setFieldsValue }) => {
                            const cur = getFieldValue("subject");
                            return (
                              <button
                                type="button"
                                onClick={() => setFieldsValue({ subject: s })}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150"
                                style={{
                                  background:
                                    cur === s
                                      ? "rgba(124,58,237,0.3)"
                                      : "#0d0d18",
                                  border: `1px solid ${cur === s ? "#7c3aed" : "#1e1e35"}`,
                                  color: cur === s ? "#a78bfa" : "#8b8ba7",
                                  cursor: "pointer",
                                }}
                              >
                                {s}
                              </button>
                            );
                          }}
                        </Form.Item>
                      ))}
                    </div>
                  </Form.Item>
                )}

                <div className="flex gap-3 mt-4">
                  <Button
                    onClick={() => setStep(0)}
                    size="large"
                    style={{
                      flex: 1,
                      height: 50,
                      borderRadius: 12,
                      background: "#12121f",
                      border: "1px solid #1e1e35",
                      color: "#8b8ba7",
                      fontWeight: 600,
                    }}
                  >
                    ← Back
                  </Button>
                  <Button
                    htmlType="submit"
                    loading={loading}
                    size="large"
                    style={{
                      flex: 2,
                      background: "linear-gradient(135deg,#7c3aed,#5b21b6)",
                      border: "none",
                      height: 50,
                      fontWeight: 700,
                      fontSize: 15,
                      borderRadius: 12,
                      color: "#fff",
                    }}
                  >
                    {loading ? "Creating account..." : "Create Account 🚀"}
                  </Button>
                </div>
              </Form>
            </>
          )}

          <div className="text-center mt-6">
            <span className="text-txt-secondary text-sm">
              Already have an account?{" "}
            </span>
            <Link
              to={`/login?role=${role}`}
              className="text-brand-light font-semibold text-sm hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
