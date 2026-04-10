import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  MailOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/common/Logo";
import { loginStudent, loginTeacher } from "../../ApiCall";

function FeatureItem({ children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="#185fa5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span className="text-[13px] text-gray-500 leading-relaxed">{children}</span>
    </div>
  );
}

function FloatingLabel({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-red-500">{error}</p>
      )}
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [role, setRole] = useState(searchParams.get("role") || "student");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});

  const isTeacher = role === "teacher";

  const validate = () => {
    const e = {};
    if (!values.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(values.email)) e.email = "Enter a valid email";
    if (!values.password) e.password = "Password is required";
    return e;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));

    const formData = { email: values.email, password: values.password };
    let res, newData, ok = false;

    if (role === "teacher") {
      res = await loginTeacher(formData);
      if (res.success) { ok = true; newData = { ...res, role: "teacher" }; }
      else setErrors({ form: res.msg });
    } else {
      res = await loginStudent(formData);
      if (res.success) { ok = true; newData = { ...res, role: "student" }; }
      else setErrors({ form: res.msg });
    }

    if (ok) {
      login(newData);
      navigate(role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
    }
    setLoading(false);
  };

  const teacherFeatures = [
    "Create unlimited live quiz rooms",
    "AI-generated questions on any topic",
    "Real-time leaderboard & analytics",
  ];
  const studentFeatures = [
    "Join any room instantly with a code",
    "Compete live on the leaderboard",
    "Track your performance over time",
  ];

  return (
    <motion.div className="min-h-screen flex bg-[#f5f5f0]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}>

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[400px] flex-shrink-0 bg-white border-r border-gray-200 p-10">
        <Logo size="md" />

        <div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-2xl mb-6">
            {isTeacher ? "🎓" : "🧑‍💻"}
          </div>
          <h2 className="text-[20px] font-medium text-gray-800 mb-2">
            {isTeacher ? "Run your quiz." : "Join the game."}
          </h2>
          <p className="text-[13px] text-gray-400 leading-relaxed mb-7">
            {isTeacher
              ? "Create rooms, generate AI questions, and watch your students compete in real-time."
              : "Enter a room code, answer fast, and climb the live leaderboard."}
          </p>
          <div className="flex flex-col gap-3">
            {(isTeacher ? teacherFeatures : studentFeatures).map((f) => (
              <FeatureItem key={f}>{f}</FeatureItem>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-gray-300">© 2025 BrainBlast</p>
      </div>

      {/* ── Right: form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div className="w-full max-w-sm"
          initial={{ y: 30, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}>

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="md" />
          </div>

          {/* Role toggle */}
          <div className="flex gap-1.5 bg-white border border-gray-200 rounded-xl p-1.5 mb-8">
            {["student", "teacher"].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${role === r
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {r === "teacher" ? "🎓 Teacher" : "🧑‍💻 Student"}
              </button>
            ))}
          </div>

          <h1 className="text-[22px] font-medium text-gray-800 mb-1">
            Welcome back
          </h1>
          <p className="text-[13px] text-gray-400 mb-7">
            Sign in as a{" "}
            <span className="text-blue-600 font-medium">{role}</span>
          </p>

          {/* Form */}
          <form onSubmit={onSubmit} className="flex flex-col gap-4">

            {errors.form && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-600">
                {errors.form}
              </div>
            )}

            <FloatingLabel label="Email" error={errors.email}>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">
                  <MailOutlined />
                </span>
                <input
                  type="email"
                  value={values.email}
                  onChange={(e) => {
                    setValues((p) => ({ ...p, email: e.target.value }));
                    setErrors((p) => ({ ...p, email: "" }));
                  }}
                  placeholder="you@example.com"
                  className={`w-full h-11 pl-10 pr-4 bg-gray-50 border rounded-lg text-[14px] text-gray-800 outline-none transition-colors placeholder:text-gray-300 ${errors.email
                    ? "border-red-300 focus:border-red-400"
                    : "border-gray-200 focus:border-blue-400"
                    }`}
                />
              </div>
            </FloatingLabel>

            <FloatingLabel label="Password" error={errors.password}>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">
                  <LockOutlined />
                </span>
                <input
                  type={showPass ? "text" : "password"}
                  value={values.password}
                  onChange={(e) => {
                    setValues((p) => ({ ...p, password: e.target.value }));
                    setErrors((p) => ({ ...p, password: "" }));
                  }}
                  placeholder="Your password"
                  className={`w-full h-11 pl-10 pr-10 bg-gray-50 border rounded-lg text-[14px] text-gray-800 outline-none transition-colors placeholder:text-gray-300 ${errors.password
                    ? "border-red-300 focus:border-red-400"
                    : "border-gray-200 focus:border-blue-400"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  {showPass ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                </button>
              </div>
            </FloatingLabel>

            <div className="flex justify-end -mt-1">
              <button
                type="button"
                className="text-[12px] text-blue-500 hover:text-blue-700 transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-blue-600 text-white text-[14px] font-medium hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="text-center text-[13px] text-gray-400 mt-6">
            Don't have an account?{" "}
            <Link
              to={`/signup?role=${role}`}
              className="text-blue-600 font-medium hover:underline"
            >
              Sign up free
            </Link>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}