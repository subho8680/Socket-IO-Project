import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  CheckOutlined,
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

function FloatingLabel({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium uppercase tracking-widest text-gray-400">
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

function StepIndicator({ steps, current }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <div className="flex items-center gap-2">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium transition-all duration-300 ${i < current
                ? "bg-blue-600 text-white"
                : i === current
                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                  : "bg-gray-100 text-gray-400"
                }`}
            >
              {i < current ? <CheckOutlined style={{ fontSize: 9 }} /> : i + 1}
            </div>
            <span
              className={`text-[12px] font-medium hidden sm:block ${i === current ? "text-gray-700" : "text-gray-400"
                }`}
            >
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-px transition-all duration-300 ${i < current ? "bg-blue-300" : "bg-gray-200"
                }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signup } = useAuth();

  const [role, setRole] = useState(searchParams.get("role") || "student");
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savedData, setSavedData] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [subject, setSubject] = useState("");

  const [vals, setVals] = useState({
    name: "", email: "", password: "", confirm: "",
  });
  const [errors, setErrors] = useState({});

  const isTeacher = role === "teacher";

  const set = (key) => (e) => {
    setVals((p) => ({ ...p, [key]: e.target.value }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const handleStep0 = () => {
    const e = {};
    if (!vals.name.trim()) e.name = "Name is required";
    else if (vals.name.trim().length < 2) e.name = "At least 2 characters";
    if (!vals.email) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(vals.email)) e.email = "Enter a valid email";
    if (Object.keys(e).length) { setErrors(e); return; }
    setSavedData({ name: vals.name.trim(), email: vals.email });
    setStep(1);
  };

  const handleStep1 = async () => {
    const e = {};
    if (!vals.password) e.password = "Password is required";
    else if (vals.password.length < 6) e.password = "Minimum 6 characters";
    if (!vals.confirm) e.confirm = "Please confirm your password";
    else if (vals.password !== vals.confirm) e.confirm = "Passwords do not match";
    if (isTeacher && !subject) e.subject = "Please pick a subject";
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    const payload = { ...savedData, password: vals.password, ...(isTeacher ? { subject } : {}) };
    try {
      let res;
      if (isTeacher) res = await registerTeacher(payload);
      else res = await registerStudent(payload);
      await new Promise((r) => setTimeout(r, 900));
      signup({ res, role });
      navigate(isTeacher ? "/teacher/dashboard" : "/student/dashboard");
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    }
    setLoading(false);
  };

  const sideSteps = [
    { num: "01", title: "Pick your role", desc: "Teacher or student?" },
    { num: "02", title: "Your details", desc: "Name & email to identify you" },
    { num: "03", title: "Set a password", desc: "Keep your account secure" },
  ];

  return (
    <motion.div className="min-h-screen flex bg-[#f5f5f0]" initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}>

      {/* ── Left panel ── */}
      <div className="hidden lg:flex flex-col justify-between w-[400px] flex-shrink-0 bg-white border-r border-gray-200 p-10">
        <Logo size="md" />

        <div className="flex flex-col gap-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400 mb-4">
              How it works
            </p>
          </div>
          {sideSteps.map((s, i) => (
            <div
              key={s.num}
              className="flex items-start gap-4"
              style={{ opacity: step >= i - 1 ? 1 : 0.35, transition: "opacity 0.3s" }}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-medium flex-shrink-0 transition-all duration-300 ${step + 1 > i
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-gray-50 text-gray-400 border border-gray-200"
                  }`}
              >
                {step + 1 > i ? <CheckOutlined style={{ fontSize: 10 }} /> : s.num}
              </div>
              <div>
                <p className="text-[13px] font-medium text-gray-700">{s.title}</p>
                <p className="text-[12px] text-gray-400 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-gray-300">© 2025 BrainBlast</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div className="w-full max-w-sm"
          initial={{ y: 30, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}>

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex justify-center">
            <Logo size="md" />
          </div>

          {/* Step indicator */}
          <StepIndicator steps={["Your info", "Set password"]} current={step} />

          {/* ── Step 0 ── */}
          {step === 0 && (
            <>
              <h1 className="text-[22px] font-medium text-gray-800 mb-1">
                Create your account
              </h1>
              <p className="text-[13px] text-gray-400 mb-7">
                Join BrainBlast and start quizzing
              </p>

              {/* Role toggle */}
              <div className="flex gap-1.5 bg-white border border-gray-200 rounded-xl p-1.5 mb-6">
                {["student", "teacher"].map((r) => (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${role === r
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                      }`}
                  >
                    {r === "teacher" ? "🎓 Teacher" : "🧑‍💻 Student"}
                  </motion.button>
                ))}
              </div>

              <div className="flex flex-col gap-4">
                <FloatingLabel label="Full name" error={errors.name}>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">
                      <UserOutlined />
                    </span>
                    <input
                      type="text"
                      value={vals.name}
                      onChange={set("name")}
                      placeholder="Your full name"
                      className={`w-full h-11 pl-10 pr-4 bg-gray-50 border rounded-lg text-[14px] text-gray-800 outline-none transition-colors placeholder:text-gray-300 ${errors.name ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-blue-400"
                        }`}
                    />
                  </div>
                </FloatingLabel>

                <FloatingLabel label="Email" error={errors.email}>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">
                      <MailOutlined />
                    </span>
                    <input
                      type="email"
                      value={vals.email}
                      onChange={set("email")}
                      placeholder="you@example.com"
                      className={`w-full h-11 pl-10 pr-4 bg-gray-50 border rounded-lg text-[14px] text-gray-800 outline-none transition-colors placeholder:text-gray-300 ${errors.email ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-blue-400"
                        }`}
                    />
                  </div>
                </FloatingLabel>

                <button
                  type="button"
                  onClick={handleStep0}
                  className="w-full h-11 rounded-lg bg-blue-600 text-white text-[14px] font-medium hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-1"
                >
                  Continue
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7h8M8 4l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </>
          )}

          {/* ── Step 1 ── */}
          {step === 1 && (
            <>
              <h1 className="text-[22px] font-medium text-gray-800 mb-1">
                Almost there!
              </h1>
              <p className="text-[13px] text-gray-400 mb-7">
                Set your password{isTeacher ? " and pick your subject" : ""}
              </p>

              {errors.form && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-[13px] text-red-600 mb-4">
                  {errors.form}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <FloatingLabel label="Password" error={errors.password}>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">
                      <LockOutlined />
                    </span>
                    <input
                      type={showPass ? "text" : "password"}
                      value={vals.password}
                      onChange={set("password")}
                      placeholder="Create a password"
                      className={`w-full h-11 pl-10 pr-10 bg-gray-50 border rounded-lg text-[14px] text-gray-800 outline-none transition-colors placeholder:text-gray-300 ${errors.password ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-blue-400"
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

                <FloatingLabel label="Confirm password" error={errors.confirm}>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm">
                      <LockOutlined />
                    </span>
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={vals.confirm}
                      onChange={set("confirm")}
                      placeholder="Repeat your password"
                      className={`w-full h-11 pl-10 pr-10 bg-gray-50 border rounded-lg text-[14px] text-gray-800 outline-none transition-colors placeholder:text-gray-300 ${errors.confirm ? "border-red-300 focus:border-red-400" : "border-gray-200 focus:border-blue-400"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      {showConfirm ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    </button>
                  </div>
                </FloatingLabel>

                {/* Subject picker for teachers */}
                {isTeacher && (
                  <div>
                    <label className="text-[11px] font-medium uppercase tracking-widest text-gray-400 block mb-2">
                      Your subject
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SUBJECTS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setSubject(s);
                            setErrors((p) => ({ ...p, subject: "" }));
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-all duration-150 ${subject === s
                            ? "bg-blue-50 border-blue-300 text-blue-700"
                            : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                            }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {errors.subject && (
                      <p className="text-[11px] text-red-500 mt-1.5">{errors.subject}</p>
                    )}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-2.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setStep(0)}
                    className="h-11 px-5 rounded-lg border border-gray-200 bg-white text-[13px] font-medium text-gray-600 hover:bg-gray-50 active:scale-[0.98] transition-all flex-shrink-0"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleStep1}
                    disabled={loading}
                    className="flex-1 h-11 rounded-lg bg-blue-600 text-white text-[14px] font-medium hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3" />
                          <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                        </svg>
                        Creating account…
                      </>
                    ) : (
                      <span className="flex gap-2 items-center">Create Account
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3 7h8M8 4l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg></span>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}

          <p className="text-center text-[13px] text-gray-400 mt-7">
            Already have an account?{" "}
            <Link
              to={`/login?role=${role}`}
              className="text-blue-600 font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>

        </motion.div>
      </div>
    </motion.div>
  );
}