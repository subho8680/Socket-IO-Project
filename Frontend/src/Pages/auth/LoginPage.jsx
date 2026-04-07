import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Form, Input, Button, message } from "antd";
import {
  MailOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/common/Logo";
import { loginStudent, loginTeacher } from "../../ApiCall";
export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [role, setRole] = useState(searchParams.get("role") || "student");
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    const formData = {
      email: values.email,
      password: values.password,
    };
    let res, newData, f = 0;
    if (role === "teacher") {
      res = await loginTeacher(formData);
      if (res.success) {
        f = 1
        newData = {
          ...res,
          role: "teacher",
        };
      }
      else {
        message.error(res.msg)
      }
    } else {
      res = await loginStudent(formData);
      if (res.success) {
        f = 1
        newData = {
          ...res,
          role: "student",
        };
      }
      else {
        message.error(res.msg)
      }
    }
    if (f) {
      login(newData);
      message.success(`Welcome back!`);
      navigate(role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
    }

    setLoading(false);
  };

  const isTeacher = role === "teacher";

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
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, rgba(124,58,237,0.12) 0%, transparent 60%)",
          }}
        />
        <Logo size="md" />
        <div className="relative z-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-6"
            style={{
              background: "rgba(124,58,237,0.15)",
              border: "1px solid rgba(124,58,237,0.3)",
            }}
          >
            {isTeacher ? "🎓" : "🧑‍💻"}
          </div>
          <h2 className="text-2xl font-bold text-txt-primary mb-3">
            {isTeacher ? "Run your quiz." : "Join the game."}
          </h2>
          <p className="text-txt-secondary text-sm leading-relaxed mb-8">
            {isTeacher
              ? "Create rooms, generate AI questions, and watch your students compete in real-time."
              : "Enter a room code, answer fast, and climb the live leaderboard."}
          </p>
          <div className="space-y-3">
            {(isTeacher
              ? [
                "Create unlimited quiz rooms",
                "AI generates questions for you",
                "Live leaderboard control",
              ]
              : [
                "Join rooms instantly with a code",
                "Compete on live leaderboard",
                "Get AI-powered feedback",
              ]
            ).map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 text-sm text-txt-secondary"
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                  style={{
                    background: "rgba(124,58,237,0.2)",
                    color: "#a78bfa",
                  }}
                >
                  ✓
                </span>
                {item}
              </div>
            ))}
          </div>
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

          <div
            className="flex p-1 rounded-xl mb-8"
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

          <h1 className="text-2xl font-bold text-txt-primary mb-1">
            Welcome back
          </h1>
          <p className="text-txt-secondary text-sm mb-8">
            Sign in as a{" "}
            <span className="text-brand-light font-medium">{role}</span>
          </p>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
          >
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

            <Form.Item
              name="password"
              rules={[{ required: true, message: "Password is required" }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#4b4b68" }} />}
                placeholder="Password"
                size="large"
                style={{ borderRadius: 10, height: 48 }}
                iconRender={(v) =>
                  v ? <EyeOutlined /> : <EyeInvisibleOutlined />
                }
              />
            </Form.Item>

            <div className="flex justify-end mb-6">
              <button
                type="button"
                className="text-xs text-brand-light hover:underline bg-transparent border-none cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            <Form.Item>
              <Button
                htmlType="submit"
                loading={loading}
                block
                size="large"
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
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center mt-4">
            <span className="text-txt-secondary text-sm">
              Don't have an account?{" "}
            </span>
            <Link
              to={`/signup?role=${role}`}
              className="text-brand-light font-semibold text-sm hover:underline"
            >
              Sign up free
            </Link>
          </div>

          <div
            className="mt-8 p-4 rounded-xl text-center"
            style={{
              background: "rgba(124,58,237,0.08)",
              border: "1px solid rgba(124,58,237,0.2)",
            }}
          >
            <p className="text-xs text-txt-secondary">
              <span className="text-brand-light font-semibold">Demo mode:</span>{" "}
              Enter any email & password to log in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
