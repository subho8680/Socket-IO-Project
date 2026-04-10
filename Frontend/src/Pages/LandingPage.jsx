import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/common/Logo";
function FadeIn({ children, delay = 0, up = true }) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setSeen(true); }, { threshold: 0.12 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: seen ? 1 : 0,
      transform: seen ? "none" : up ? "translateY(20px)" : "none",
      transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
    }}>{children}</div>
  );
}

function FeatCard({ icon, label, desc, accent }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "#fff" : "#fafaf9",
        border: `1.5px solid ${hov ? accent : "#ebebeb"}`,
        borderRadius: 18,
        padding: "28px 26px",
        transition: "all 0.2s ease",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov ? `0 8px 28px ${accent}18` : "none",
        cursor: "default",
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: `${accent}12`, display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: 19, marginBottom: 16,
        border: `1px solid ${accent}20`,
      }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#111", marginBottom: 8, fontFamily: "'Instrument Sans', sans-serif" }}>{label}</div>
      <div style={{ fontSize: 13.5, color: "#888", lineHeight: 1.65 }}>{desc}</div>
    </div>
  );
}

function RoleCard({ emoji, title, sub, cta, color, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, minWidth: 210, maxWidth: 260,
        background: hov ? `${color}06` : "#fff",
        border: `1.5px solid ${hov ? color : "#e8e8e8"}`,
        borderRadius: 16, padding: "26px 22px",
        cursor: "pointer", textAlign: "left",
        transition: "all 0.18s ease",
        transform: hov ? "translateY(-3px)" : "none",
        boxShadow: hov ? `0 6px 24px ${color}14` : "none",
        fontFamily: "'Instrument Sans', sans-serif",
      }}
    >
      <div style={{ fontSize: 26, marginBottom: 14 }}>{emoji}</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: "#111", marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#aaa", marginBottom: 18, lineHeight: 1.55 }}>{sub}</div>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        fontSize: 13, fontWeight: 700, color,
        background: `${color}10`, borderRadius: 99,
        padding: "5px 12px",
        transition: "background 0.15s",
      }}>{cta} →</div>
    </div>
  );
}

const FEATURES = [
  { icon: "⚡", label: "Real-time sync", desc: "Questions reach every student in under 50ms the moment you start.", accent: "#f59e0b" },
  { icon: "🤖", label: "AI question gen", desc: "Type a topic. Get a full, ready-to-play quiz in seconds.", accent: "#8b5cf6" },
  { icon: "🏆", label: "Live leaderboard", desc: "Rankings update after every answer — students stay locked in.", accent: "#185fa5" },
  { icon: "🔑", label: "Instant room codes", desc: "One click creates a 6-digit code. No app download needed.", accent: "#059669" },
];

const STEPS = [
  { n: "1", title: "Create a room", desc: "One click generates a shareable 6-digit room code." },
  { n: "2", title: "Build your quiz with AI", desc: "Describe your topic and get a complete, ready-to-play quiz in seconds." },
  { n: "3", title: "Go live & watch the fun", desc: "Students join instantly. The leaderboard updates in real time, every answer." },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        .btn-dark {
          display: inline-flex; align-items: center; gap: 6px;
          background: #0f0f0f; color: #fff; border: none;
          padding: 11px 22px; border-radius: 11px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          font-family: 'Instrument Sans', sans-serif;
          transition: background 0.15s, transform 0.12s;
          letter-spacing: -0.1px;
        }
        .btn-dark:hover { background: #2a2a2a; }
        .btn-dark:active { transform: scale(0.97); }
        .btn-outline {
          display: inline-flex; align-items: center;
          background: transparent; color: #555;
          border: 1.5px solid #e0e0e0;
          padding: 11px 22px; border-radius: 11px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          font-family: 'Instrument Sans', sans-serif;
          transition: border-color 0.15s, color 0.15s;
        }
        .btn-outline:hover { border-color: #999; color: #111; }
        .btn-blue {
          display: inline-flex; align-items: center; gap: 6px;
          background: #185fa5; color: #fff; border: none;
          padding: 13px 28px; border-radius: 12px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          font-family: 'Instrument Sans', sans-serif;
          transition: background 0.15s, transform 0.12s;
        }
        .btn-blue:hover { background: #1452901; }
        .btn-blue:active { transform: scale(0.97); }
        @media (max-width: 600px) {
          .hero-ctas { flex-direction: column !important; align-items: stretch !important; }
          .role-wrap { flex-direction: column !important; }
          .role-card-inner { max-width: 100% !important; }
          .feat-grid { grid-template-columns: 1fr !important; }
          .steps-cta-row { flex-direction: column !important; }
        }
      `}</style>

      <div style={{ fontFamily: "'Instrument Sans', sans-serif", color: "#111", background: "#fff", minHeight: "100vh" }}>

        <nav style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(14px)",
          borderBottom: "1px solid #f0f0f0",
          height: 56, padding: "0 6%",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Logo size="md" />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-outline" style={{ padding: "8px 18px", fontSize: 13 }} onClick={() => navigate("/login")}>Log in</button>
            <button className="btn-dark" style={{ padding: "8px 18px", fontSize: 13 }} onClick={() => navigate("/signup")}>Get started free</button>
          </div>
        </nav>

        <section style={{
          background: "linear-gradient(180deg, #f4f8ff 0%, #ffffff 100%)",
          borderBottom: "1px solid #ebebeb",
          padding: "80px 6% 72px",
          textAlign: "center",
        }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>

            <FadeIn delay={0}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                background: "#185fa50d", border: "1px solid #185fa522",
                borderRadius: 99, padding: "5px 14px", marginBottom: 28,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#185fa5", display: "inline-block" }} />
                <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#185fa5" }}>
                  AI-Powered Live Quiz Platform
                </span>
              </div>
            </FadeIn>

            <FadeIn delay={0.07}>
              <h1 style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "clamp(42px, 7.5vw, 68px)",
                fontWeight: 400, lineHeight: 1.07, letterSpacing: "-1.5px",
                color: "#0a0a0a", marginBottom: 20,
              }}>
                Quizzes your students<br />
                <span style={{ color: "#185fa5" }}>can't stop playing.</span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.14}>
              <p style={{ fontSize: 17, color: "#666", lineHeight: 1.68, maxWidth: 460, margin: "0 auto 36px", fontWeight: 400 }}>
                Create a room, let AI generate your questions, and watch students compete live on a real-time leaderboard.
              </p>
            </FadeIn>

            <FadeIn delay={0.21}>
              <div className="role-wrap" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 52 }}>
                <RoleCard
                  emoji="🎓" title="I'm a Teacher"
                  sub="Create rooms, generate AI quizzes, track results."
                  cta="Start for free" color="#185fa5"
                  onClick={() => navigate("/signup?role=teacher")}
                />
                <RoleCard
                  emoji="🧑‍💻" title="I'm a Student"
                  sub="Enter a room code and compete live."
                  cta="Join a room" color="#059669"
                  onClick={() => navigate("/signup?role=student")}
                />
              </div>
            </FadeIn>

            <FadeIn delay={0.28}>
              <div style={{
                display: "inline-flex", gap: 0,
                background: "#fff", border: "1px solid #ebebeb",
                borderRadius: 14, overflow: "hidden",
              }}>
                {[
                  { v: "50+", l: "Students at once" },
                  { v: "<50ms", l: "Broadcast latency" },
                  { v: "100%", l: "Real-time updates" },
                ].map((s, i, arr) => (
                  <div key={s.l} style={{
                    padding: "16px 28px", textAlign: "center",
                    borderRight: i < arr.length - 1 ? "1px solid #ebebeb" : "none",
                  }}>
                    <div style={{ fontSize: 21, fontWeight: 800, color: "#0f0f0f", letterSpacing: "-0.5px", fontFamily: "'Instrument Serif', serif" }}>{s.v}</div>
                    <div style={{ fontSize: 11.5, color: "#bbb", marginTop: 3, fontWeight: 500 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        <section style={{ maxWidth: 1000, margin: "0 auto", padding: "80px 6%" }}>
          <FadeIn>
            <div style={{ marginBottom: 48 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#bbb", marginBottom: 10 }}>What's included</p>
              <h2 style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "clamp(28px, 4vw, 38px)",
                fontWeight: 400, letterSpacing: "-0.8px", color: "#0a0a0a",
              }}>Everything you need to run a great quiz.</h2>
            </div>
          </FadeIn>
          <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {FEATURES.map((f, i) => (
              <FadeIn key={f.label} delay={i * 0.06}>
                <FeatCard {...f} />
              </FadeIn>
            ))}
          </div>
        </section>

        <section style={{ background: "#fafaf9", borderTop: "1px solid #ebebeb", borderBottom: "1px solid #ebebeb" }}>
          <div style={{ maxWidth: 800, margin: "0 auto", padding: "80px 6%" }}>
            <FadeIn>
              <div style={{ marginBottom: 52 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#bbb", marginBottom: 10 }}>How it works</p>
                <h2 style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: "clamp(28px, 4vw, 38px)",
                  fontWeight: 400, letterSpacing: "-0.8px", color: "#0a0a0a",
                }}>Up and running in 3 steps.</h2>
              </div>
            </FadeIn>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {STEPS.map((s, i) => (
                <FadeIn key={s.n} delay={i * 0.08}>
                  <div style={{
                    display: "flex", gap: 24, alignItems: "flex-start",
                    padding: "28px 0",
                    borderBottom: i < STEPS.length - 1 ? "1px solid #ebebeb" : "none",
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: "#185fa5", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 800, fontSize: 14, flexShrink: 0,
                      fontFamily: "'Instrument Sans', sans-serif",
                    }}>{s.n}</div>
                    <div style={{ paddingTop: 4 }}>
                      <div style={{ fontWeight: 700, fontSize: 15.5, color: "#111", marginBottom: 6 }}>{s.title}</div>
                      <div style={{ fontSize: 14, color: "#888", lineHeight: 1.65 }}>{s.desc}</div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        <section style={{ maxWidth: 900, margin: "0 auto", padding: "80px 6% 96px" }}>
          <FadeIn>
            <div style={{
              background: "#0f0f0f",
              borderRadius: 24, padding: "56px 48px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexWrap: "wrap", gap: 32,
            }}
              className="steps-cta-row"
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#185fa5", marginBottom: 14 }}>
                  Ready to play?
                </div>
                <h2 style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: "clamp(26px, 3.5vw, 38px)",
                  fontWeight: 400, color: "#fff",
                  lineHeight: 1.18, letterSpacing: "-0.8px", marginBottom: 10,
                }}>
                  Run your first quiz<br />in under 2 minutes.
                </h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button className="btn-blue" onClick={() => navigate("/signup?role=teacher")}>
                  Create free account →
                </button>
                <button
                  className="btn-outline"
                  style={{ borderColor: "#333", color: "#888", justifyContent: "center" }}
                  onClick={() => navigate("/login")}
                >
                  Already have an account
                </button>
              </div>
            </div>
          </FadeIn>
        </section>
      </div>
    </>
  );
}