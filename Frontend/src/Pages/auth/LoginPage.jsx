import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/common/Logo";
import { loginParticipant } from "../../ApiCall";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [values, setValues] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginParticipant(values);
      setLoading(false);

      if (!response?.success) {
        return setError(response?.msg || "Unable to sign in. Please check your credentials.");
      }

      login(response.user);
      navigate("/contests", { replace: true });
    } catch (err) {
      setLoading(false);
      setError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to practice, compete, and climb the leaderboard with your friends."
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {/* Error Alert with Animation */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-400 backdrop-blur-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </motion.div>
        )}

        <AuthInput
          icon={<Mail className="w-4 h-4" />}
          type="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={(email) => setValues({ ...values, email })}
        />

        <AuthInput
          icon={<Lock className="w-4 h-4" />}
          type="password"
          placeholder="••••••••"
          value={values.password}
          onChange={(password) => setValues({ ...values, password })}
        />

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          disabled={loading}
          className="group relative mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 font-medium text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-indigo-500/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span className="text-sm">Signing in...</span>
            </>
          ) : (
            <>
              <span className="text-sm font-semibold">Sign in</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </motion.button>
      </form>

      {/* Footer Link */}
      <p className="mt-8 text-center text-xs text-slate-400">
        New here?{" "}
        <Link
          to="/signup"
          className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors underline underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthInput({ icon, type, placeholder, value, onChange }) {
  return (
    <label className="group relative block">
      <span className="absolute left-3.5 top-3.5 text-slate-500 transition-colors group-focus-within:text-indigo-500">
        {icon}
      </span>
      <input
        required
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      />
    </label>
  );
}

export function AuthShell({ title, subtitle, children }) {
  // Stagger animation rules for inner elements
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-slate-50 flex items-center justify-center p-6 text-slate-900">
      {/* Dynamic Animated Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-indigo-200/40 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-violet-200/40 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        {/* Subtle Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#94a3b812_1px,transparent_1px),linear-gradient(to_bottom,#94a3b812_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Main Card */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 md:p-10 shadow-2xl shadow-slate-300/20"
      >
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <Logo size="md" />
          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-100 px-2.5 py-1 text-[10px] font-semibold tracking-wider text-indigo-700 uppercase">
            <Sparkles className="w-3 h-3 text-indigo-600" /> Live
          </span>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600">
            Code Together
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {subtitle}
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-8">
          {children}
        </motion.div>
      </motion.section>
    </main>
  );
}