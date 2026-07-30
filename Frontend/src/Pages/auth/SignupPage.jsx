import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserOutlined, MailOutlined, LockOutlined } from "@ant-design/icons";
import { registerParticipant } from "../../ApiCall";
import { useAuth } from "../../context/AuthContext";
import { AuthInput, AuthShell } from "./LoginPage";

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [values, setValues] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (values.password !== values.confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const response = await registerParticipant({
      name: values.name,
      email: values.email,
      password: values.password,
    });
    setLoading(false);

    if (!response?.success) {
      return setError(response?.msg || "Unable to create account.");
    }

    signup(response.user);
    navigate("/contests", { replace: true });
  };

  return (
    <AuthShell
      title="Create your competitor profile"
      subtitle="One account for every contest, practice room, and leaderboard."
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <AuthInput
          icon={<UserOutlined className="text-slate-500" />}
          type="text"
          placeholder="Your name"
          value={values.name}
          onChange={(name) => setValues({ ...values, name })}
        />

        <AuthInput
          icon={<MailOutlined className="text-slate-500" />}
          type="email"
          placeholder="you@example.com"
          value={values.email}
          onChange={(email) => setValues({ ...values, email })}
        />

        <AuthInput
          icon={<LockOutlined className="text-slate-500" />}
          type="password"
          placeholder="Create a password"
          value={values.password}
          onChange={(password) => setValues({ ...values, password })}
        />

        <AuthInput
          icon={<LockOutlined className="text-slate-500" />}
          type="password"
          placeholder="Confirm password"
          value={values.confirm}
          onChange={(confirm) => setValues({ ...values, confirm })}
        />

        <button
          disabled={loading}
          className="mt-2 h-11 rounded-xl bg-indigo-600 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account…" : "Start competing"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
