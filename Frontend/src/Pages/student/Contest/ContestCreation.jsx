import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ConfigProvider,
  message,
  DatePicker,
  Input,
  Select,
  Button,
  Switch,
} from "antd";
import {
  TrophyOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  LockOutlined,
  CheckCircleFilled,
  CopyOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  FireOutlined,
  MailOutlined,
  GlobalOutlined,
  EyeInvisibleOutlined,
  PlusOutlined,
  CloseOutlined,
  CalendarOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  useFetchProblems,
  useScrapeProblems,
} from "../../../Services/ContestAPI";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";

dayjs.extend(relativeTime);

const { Option } = Select;
const { TextArea } = Input;

const API = "http://localhost:4000/api";

const TAGS = [
  "implementation",
  "math",
  "greedy",
  "dp",
  "graphs",
  "strings",
  "binary search",
  "sortings",
  "number theory",
  "two pointers",
  "trees",
  "geometry",
  "combinatorics",
];

const RATINGS = [
  800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000,
  2200, 2400, 2600, 3000,
];

const LOADING_STEPS = [
  {
    icon: <CodeOutlined />,
    label: "Scanning problem database",
    sub: "Querying Codeforces API…",
  },
  {
    icon: <ThunderboltOutlined />,
    label: "Running selection algorithm",
    sub: "Picking the perfect problems…",
  },
  {
    icon: <FireOutlined />,
    label: "Fetching test cases",
    sub: "Collecting sample I/O…",
  },
  {
    icon: <LockOutlined />,
    label: "Sealing the contest",
    sub: "Locking problems until start…",
  },
];

function getRatingColor(r) {
  if (r < 1200) return { bar: "#9CA3AF" };
  if (r < 1400) return { bar: "#22C55E" };
  if (r < 1600) return { bar: "#06B6D4" };
  if (r < 1900) return { bar: "#3B82F6" };
  if (r < 2100) return { bar: "#A855F7" };
  if (r < 2400) return { bar: "#F97316" };
  return { bar: "#EF4444" };
}

function Counter({ to, duration = 1.5 }) {
  const [val, setVal] = useState(0);
  useState(() => {
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / (duration * 1000), 1);
      setVal(Math.round(p * to));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to]);
  return <span>{val}</span>;
}

export default function ContestCreator({ onContestCreated, currentUser }) {
  const [phase, setPhase] = useState("form");
  const [currentStep, setCurrentStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [contestResult, setContestResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [messageApi, contextHolder] = message.useMessage();
  const fetchProblems = useFetchProblems();
  const scrapeProblems = useScrapeProblems();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    minRating: 1000,
    maxRating: 1600,
    count: 5,
    duration: 120,
    tags: [],
    inviteEmails: [],
    scheduledAt: null,
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleTag = (t) =>
    set(
      "tags",
      form.tags.includes(t)
        ? form.tags.filter((x) => x !== t)
        : [...form.tags, t],
    );
  const pause = (ms) => new Promise((r) => setTimeout(r, ms));

  const SPAN = RATINGS[RATINGS.length - 1] - RATINGS[0];
  const barLeft = (((form.minRating - RATINGS[0]) / SPAN) * 100).toFixed(1);
  const barWidth = (((form.maxRating - form.minRating) / SPAN) * 100).toFixed(
    1,
  );

  const addEmail = () => {
    const e = emailInput.trim().toLowerCase();
    if (!e) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      messageApi.error("Invalid email address");
      return;
    }
    if (form.inviteEmails.includes(e)) {
      messageApi.warning("Already added");
      return;
    }
    set("inviteEmails", [...form.inviteEmails, e]);
    setEmailInput("");
  };

  const removeEmail = (e) =>
    set(
      "inviteEmails",
      form.inviteEmails.filter((x) => x !== e),
    );

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setPhase("loading");
    setCurrentStep(0);
    setCompletedSteps([]);

    try {
      const fetchFormData = {
        minR: form.minRating,
        maxR: form.maxRating,
        count: form.count,
        tags: form.tags,
      };
      const pData = await fetchProblems.mutateAsync(fetchFormData);
      if (pData.status !== "success") throw new Error(pData.message);
      setCompletedSteps([0]);
      await pause(350);

      setCurrentStep(1);
      await pause(900);
      setCompletedSteps((p) => [...p, 1]);
      await pause(350);

      setCurrentStep(2);
      const scrapeFormData = {
        name: form.name,
        durationMinutes: form.duration,
        problems: pData.problems,
        scheduledAt: form.scheduledAt,
        invitedEmails: form.inviteEmails,
      };
      const sData = await scrapeProblems.mutateAsync(scrapeFormData);
      if (!sData.success) throw new Error(sData.message);
      setCompletedSteps((p) => [...p, 2]);
      await pause(350);

      setCurrentStep(3);
      await pause(900);
      setCompletedSteps((p) => [...p, 3]);
      await pause(500);

      setContestResult({
        contestId: sData.contest.id,
        count: sData.contest.problems.length,
        scheduledAt: sData.contest.scheduledAt,
        visibility: sData.contest.visibility,
      });
      setPhase("done");
      if (onContestCreated) onContestCreated(sData.contest);
    } catch (e) {
      setPhase("form");
      messageApi.error(e.message);
    }
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(contestResult?.contestId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetForm = () => {
    setPhase("form");
    setContestResult(null);
    setForm({
      name: "",
      minRating: 1000,
      maxRating: 1600,
      count: 5,
      duration: 120,
      scoring: "icpc",
      tags: [],
      cfHandles: "",
      inviteEmails: [],
      scheduledAt: null,
      visibility: "private",
      description: "",
      allowLateJoin: true,
    });
    setCompletedSteps([]);
    setCurrentStep(-1);
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#4F46E5",
          borderRadius: 10,
          fontFamily: "'Outfit', sans-serif",
          colorBgContainer: "#FFFFFF",
          colorBgElevated: "#FFFFFF",
          colorBgLayout: "#F9FAFB",
          colorBgSpotlight: "#FFFFFF",
          colorBorder: "#E5E7EB",
          colorBorderSecondary: "#F0F0F0",
          colorText: "#111827",
          colorTextSecondary: "#6B7280",
          colorTextTertiary: "#9CA3AF",
          colorTextPlaceholder: "#C4C9D4",
          colorTextDisabled: "#D1D5DB",
          colorPrimaryBg: "#EEF2FF",
          colorPrimaryBgHover: "#E0E7FF",
          fontSize: 14,
          controlHeight: 42,
        },
        components: {
          Input: {
            borderRadius: 10,
            paddingInline: 13,
            fontSize: 14,
            activeShadow: "0 0 0 3px rgba(79,70,229,0.1)",
            colorBgContainer: "#FFFFFF",
            colorBorder: "#E5E7EB",
            hoverBorderColor: "#A5B4FC",
            activeBorderColor: "#4F46E5",
          },
          Select: {
            borderRadius: 10,
            colorBgContainer: "#FFFFFF",
            colorBgElevated: "#FFFFFF",
            optionSelectedBg: "#EEF2FF",
            optionSelectedColor: "#4F46E5",
            activeShadow: "0 0 0 3px rgba(79,70,229,0.1)",
            colorBorder: "#E5E7EB",
          },
          DatePicker: {
            borderRadius: 10,
            activeShadow: "0 0 0 3px rgba(79,70,229,0.1)",
            colorBgContainer: "#FFFFFF",
            colorBgElevated: "#FFFFFF",
            colorBorder: "#E5E7EB",
            cellActiveWithRangeBg: "#EEF2FF",
            cellHoverBg: "#F5F3FF",
            cellHoverWithRangeBg: "#E0E7FF",
            colorPrimary: "#4F46E5",
            colorText: "#111827",
            colorTextHeading: "#111827",
            colorTextDisabled: "#D1D5DB",
            colorIcon: "#6B7280",
            colorIconHover: "#4F46E5",
            controlItemBgActive: "#EEF2FF",
            withoutTimeCellHeight: 36,
          },
          Switch: {
            colorPrimary: "#4F46E5",
            colorPrimaryHover: "#4338CA",
          },
          Button: {
            borderRadius: 10,
            controlHeight: 42,
            fontWeight: 600,
            colorBgContainer: "#FFFFFF",
          },
        },
      }}
    >
      <Navbar />
      {contextHolder}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; }

        .cc-wrap { min-height:100vh; background:#F8F9FC; display:flex; align-items:flex-start; justify-content:center; padding:52px 20px 80px; font-family:'Outfit',sans-serif; position:relative; overflow:hidden; }
        .cc-grid { position:fixed; inset:0; background-image:linear-gradient(rgba(79,70,229,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(79,70,229,.03) 1px,transparent 1px); background-size:40px 40px; pointer-events:none; z-index:0; }
        .cc-orb1 { position:fixed; width:600px; height:600px; border-radius:50%; background:radial-gradient(circle,rgba(79,70,229,.05) 0%,transparent 70%); top:-200px; right:-200px; pointer-events:none; z-index:0; }
        .cc-orb2 { position:fixed; width:400px; height:400px; border-radius:50%; background:radial-gradient(circle,rgba(236,72,153,.04) 0%,transparent 70%); bottom:-100px; left:-100px; pointer-events:none; z-index:0; }
        .cc-inner { width:100%; max-width:600px; position:relative; z-index:1; }

        .cc-card { background:#fff; border-radius:20px; border:1px solid rgba(79,70,229,.08); box-shadow:0 1px 3px rgba(0,0,0,.04),0 8px 32px rgba(79,70,229,.05); overflow:hidden; margin-bottom:14px; }
        .cc-sec { padding:20px 26px; border-bottom:1px solid #F5F3FF; }
        .cc-sec:last-child { border-bottom:none; }
        .cc-sec-title { font-size:10px; font-weight:700; color:#4F46E5; text-transform:uppercase; letter-spacing:.1em; margin-bottom:16px; display:flex; align-items:center; gap:6px; font-family:'Outfit',sans-serif; }
        .cc-label { font-size:11px; font-weight:600; color:#6B7280; text-transform:uppercase; letter-spacing:.07em; margin-bottom:8px; display:flex; align-items:center; gap:5px; font-family:'Outfit',sans-serif; }
        .cc-hint { font-weight:400; color:#9CA3AF; text-transform:none; letter-spacing:0; font-size:11px; margin-left:2px; }
        .cc-sublabel { font-size:11px; color:#9CA3AF; margin-bottom:6px; font-family:'Outfit',sans-serif; }
        .cc-g2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

        /* Rating bar */
        .cc-rbar { height:6px; background:#F3F4F6; border-radius:3px; margin-top:12px; position:relative; overflow:hidden; }
        .cc-rfill { position:absolute; height:100%; border-radius:3px; transition:all .3s cubic-bezier(.4,0,.2,1); }
        .cc-rlabels { display:flex; justify-content:space-between; margin-top:7px; font-size:11px; font-weight:600; font-family:'Outfit',sans-serif; }

        /* Tags */
        .cc-tag { display:inline-flex; align-items:center; padding:5px 12px; border-radius:20px; border:1.5px solid #E5E7EB; font-size:12px; font-weight:500; color:#6B7280; background:#FAFAFA; cursor:pointer; transition:all .13s; user-select:none; font-family:'Outfit',sans-serif; margin:3px; }
        .cc-tag:hover { border-color:#4F46E5; color:#4F46E5; }
        .cc-tag.on { border-color:#4F46E5; background:#EEF2FF; color:#4F46E5; }

        /* Visibility buttons */
        .cc-vis-btn { flex:1; padding:10px; border-radius:10px; border:1.5px solid #E5E7EB; background:#FAFAFA; font-size:13px; font-weight:500; color:#6B7280; cursor:pointer; font-family:'Outfit',sans-serif; display:flex; align-items:center; justify-content:center; gap:7px; transition:all .15s; }
        .cc-vis-btn:hover { border-color:#4F46E5; color:#4F46E5; }
        .cc-vis-btn.on { border-color:#4F46E5; background:#EEF2FF; color:#4F46E5; }

        /* Toggle row */
        .cc-toggle-row { display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-top:1px solid #F5F3FF; margin-top:14px; }
        .cc-toggle-label { font-size:13px; font-weight:500; color:#374151; font-family:'Outfit',sans-serif; }
        .cc-toggle-sub { font-size:11px; color:#9CA3AF; font-family:'Outfit',sans-serif; margin-top:2px; }

        /* Email */
        .cc-email-row { display:flex; gap:8px; align-items:center; }
        .cc-email-pill { display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:20px; background:#EEF2FF; border:1px solid #C7D2FE; font-size:12px; color:#4338CA; font-weight:500; margin:3px; font-family:'Outfit',sans-serif; }
        .cc-email-x { cursor:pointer; color:#818CF8; font-size:10px; line-height:1; padding:1px; transition:color .13s; }
        .cc-email-x:hover { color:#4F46E5; }

        /* Scheduled badge */
        .cc-sched-badge { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:20px; background:#FEF9C3; border:1px solid #FDE68A; font-size:12px; color:#92400E; font-weight:500; margin-top:10px; font-family:'Outfit',sans-serif; }

        /* CTA button */
        .cc-cta { width:100% !important; height:52px !important; border-radius:14px !important; border:none !important; background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%) !important; color:#fff !important; font-size:16px !important; font-weight:600 !important; font-family:'Outfit',sans-serif !important; letter-spacing:-0.2px !important; transition:all .2s !important; }
        .cc-cta:hover { transform:translateY(-2px) !important; box-shadow:0 8px 24px rgba(79,70,229,.35) !important; background:linear-gradient(135deg,#6366F1 0%,#8B5CF6 100%) !important; opacity:1 !important; }
        .cc-cta:active { transform:translateY(0) !important; }
        .cc-cta:disabled, .cc-cta.ant-btn-disabled { background:#E5E7EB !important; color:#9CA3AF !important; cursor:not-allowed !important; transform:none !important; box-shadow:none !important; }

        /* Done screen */
        .cc-stat-chip { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:20px; font-size:12px; font-weight:500; background:#F5F3FF; color:#4F46E5; border:1px solid #DDD6FE; font-family:'Outfit',sans-serif; }
        .cc-room-code { font-family:'JetBrains Mono',monospace; font-size:24px; font-weight:600; color:#111827; letter-spacing:.08em; }
        .cc-sealed { padding:11px 14px; border-radius:10px; background:#F0FDF4; border:1px solid #BBF7D0; font-size:12px; color:#15803D; line-height:1.6; margin-top:14px; display:flex; align-items:flex-start; gap:8px; font-family:'Outfit',sans-serif; }
        .cc-copy-btn { display:inline-flex !important; align-items:center !important; gap:6px !important; font-family:'Outfit',sans-serif !important; font-weight:600 !important; font-size:13px !important; height:36px !important; border-radius:9px !important; }
        .cc-copy-btn.copied { border-color:#10B981 !important; color:#10B981 !important; background:#F0FDF4 !important; }
        .cc-btn-out { flex:1 !important; height:48px !important; border-radius:12px !important; font-family:'Outfit',sans-serif !important; font-size:14px !important; font-weight:500 !important; }
        .cc-btn-pri { flex:2 !important; height:48px !important; border-radius:12px !important; border:none !important; background:linear-gradient(135deg,#4F46E5,#7C3AED) !important; color:#fff !important; font-family:'Outfit',sans-serif !important; font-size:14px !important; font-weight:600 !important; }
        .cc-btn-pri:hover { opacity:.9 !important; transform:translateY(-1px) !important; box-shadow:0 4px 16px rgba(79,70,229,.3) !important; }

        /* Loading */
        .cc-step-row { display:flex; align-items:center; gap:16px; padding:16px 24px; border-bottom:1px solid #F5F3FF; transition:background .2s; }
        .cc-step-row:last-child { border-bottom:none; }
        .cc-step-icon { width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all .3s; }
        .cc-spinner { width:16px; height:16px; border:2px solid rgba(79,70,229,.2); border-top-color:#4F46E5; border-radius:50%; animation:cc-spin .75s linear infinite; }

        @keyframes cc-spin { to { transform:rotate(360deg); } }
        @keyframes cc-pulse { 0%,100%{opacity:.6} 50%{opacity:1} }

        /* ─── Force ALL Ant Design popups / dropdowns to be WHITE ─── */
        /* Inputs */
        .ant-input,
        .ant-input-affix-wrapper,
        .ant-input-textarea textarea {
          background-color: #fff !important;
          color: #111827 !important;
          font-family: 'Outfit', sans-serif !important;
        }
        .ant-input::placeholder,
        .ant-input-affix-wrapper input::placeholder { color: #C4C9D4 !important; }

        /* Select */
        .ant-select-selector {
          background-color: #fff !important;
          color: #111827 !important;
          font-family: 'Outfit', sans-serif !important;
        }
        .ant-select-dropdown {
          background-color: #fff !important;
          box-shadow: 0 8px 24px rgba(0,0,0,.08) !important;
          border: 1px solid #E5E7EB !important;
          border-radius: 12px !important;
        }
        .ant-select-item { color: #111827 !important; font-family: 'Outfit', sans-serif !important; }
        .ant-select-item-option-selected { background-color: #EEF2FF !important; color: #4F46E5 !important; }
        .ant-select-item-option-active { background-color: #F5F3FF !important; }
        .ant-select-arrow { color: #9CA3AF !important; }

        /* DatePicker input */
        .ant-picker {
          width: 100% !important;
          background-color: #fff !important;
          border-color: #E5E7EB !important;
          font-family: 'Outfit', sans-serif !important;
        }
        .ant-picker input {
          background: transparent !important;
          color: #111827 !important;
          font-family: 'Outfit', sans-serif !important;
        }
        .ant-picker input::placeholder { color: #C4C9D4 !important; }
        .ant-picker-suffix, .ant-picker-clear { color: #9CA3AF !important; }

        /* DatePicker popup panel — the main fix */
        .ant-picker-dropdown,
        .ant-picker-panel-container,
        .ant-picker-panel {
          background-color: #fff !important;
          color: #111827 !important;
          font-family: 'Outfit', sans-serif !important;
          border-color: #E5E7EB !important;
        }
        .ant-picker-dropdown {
          box-shadow: 0 8px 32px rgba(0,0,0,.1) !important;
          border-radius: 14px !important;
          overflow: hidden !important;
          border: 1px solid #E5E7EB !important;
        }
        /* Header */
        .ant-picker-header {
          background: #fff !important;
          border-bottom: 1px solid #F0F0F0 !important;
          color: #111827 !important;
        }
        .ant-picker-header button,
        .ant-picker-header-view button {
          color: #374151 !important;
          font-family: 'Outfit', sans-serif !important;
          font-weight: 600 !important;
        }
        .ant-picker-header button:hover,
        .ant-picker-header-view button:hover { color: #4F46E5 !important; }
        .ant-picker-prev-icon,
        .ant-picker-next-icon,
        .ant-picker-super-prev-icon,
        .ant-picker-super-next-icon { color: #6B7280 !important; }

        /* Week-day labels */
        .ant-picker-content thead th,
        .ant-picker-content th {
          color: #9CA3AF !important;
          font-family: 'Outfit', sans-serif !important;
          font-size: 12px !important;
          font-weight: 600 !important;
          background: #fff !important;
        }
        /* Day cells */
        .ant-picker-cell { color: #374151 !important; font-family: 'Outfit', sans-serif !important; }
        .ant-picker-cell-inner {
          background: transparent !important;
          color: #374151 !important;
          font-family: 'Outfit', sans-serif !important;
          border-radius: 8px !important;
        }
        .ant-picker-cell:hover .ant-picker-cell-inner { background: #F5F3FF !important; color: #4F46E5 !important; }
        .ant-picker-cell-in-view { color: #111827 !important; }
        .ant-picker-cell-disabled .ant-picker-cell-inner { color: #D1D5DB !important; background: transparent !important; }
        .ant-picker-cell-today .ant-picker-cell-inner { border-color: #4F46E5 !important; color: #4F46E5 !important; font-weight: 700 !important; }
        .ant-picker-cell-selected .ant-picker-cell-inner,
        .ant-picker-cell-in-view.ant-picker-cell-selected .ant-picker-cell-inner {
          background: #4F46E5 !important;
          color: #fff !important;
        }

        /* Time picker columns */
        .ant-picker-time-panel { background: #fff !important; border-left: 1px solid #F0F0F0 !important; }
        .ant-picker-time-panel-column { background: #fff !important; }
        .ant-picker-time-panel-cell-inner { color: #374151 !important; font-family: 'Outfit', sans-serif !important; }
        .ant-picker-time-panel-cell:hover .ant-picker-time-panel-cell-inner { background: #F5F3FF !important; color: #4F46E5 !important; }
        .ant-picker-time-panel-cell-selected .ant-picker-time-panel-cell-inner {
          background: #EEF2FF !important;
          color: #4F46E5 !important;
          font-weight: 600 !important;
        }

        /* Footer */
        .ant-picker-footer { background: #fff !important; border-top: 1px solid #F0F0F0 !important; }
        .ant-picker-today-btn { color: #4F46E5 !important; font-family: 'Outfit', sans-serif !important; font-weight: 500 !important; }
        .ant-picker-ok button {
          background: #4F46E5 !important;
          border-color: #4F46E5 !important;
          font-family: 'Outfit', sans-serif !important;
          font-weight: 600 !important;
          border-radius: 8px !important;
        }
        .ant-picker-ok button:hover { background: #4338CA !important; border-color: #4338CA !important; }

        /* Message/notification */
        .ant-message-notice-content {
          font-family: 'Outfit', sans-serif !important;
          border-radius: 10px !important;
          background: #fff !important;
          box-shadow: 0 4px 16px rgba(0,0,0,.1) !important;
          color: #111827 !important;
        }
      `}</style>

      <div className="cc-wrap">
        <div className="cc-grid" />
        <div className="cc-orb1" />
        <div className="cc-orb2" />
        <div className="cc-inner">
          <AnimatePresence mode="wait">
            {phase === "form" && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  style={{ marginBottom: 28 }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: "linear-gradient(135deg,#4F46E5,#7C3AED)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 4px 12px rgba(79,70,229,.3)",
                      }}
                    >
                      <TrophyOutlined style={{ color: "#fff", fontSize: 18 }} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#4F46E5",
                          textTransform: "uppercase",
                          letterSpacing: ".08em",
                          fontFamily: "'Outfit',sans-serif",
                        }}
                      >
                        CodeClash
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#9CA3AF",
                          fontFamily: "'Outfit',sans-serif",
                        }}
                      >
                        Contest Platform
                      </div>
                    </div>
                  </div>
                  <h1
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: "#0F172A",
                      margin: "0 0 8px",
                      letterSpacing: "-0.5px",
                      lineHeight: 1.2,
                      fontFamily: "'Outfit',sans-serif",
                    }}
                  >
                    Create your contest
                  </h1>
                  <p
                    style={{
                      color: "#6B7280",
                      fontSize: 14,
                      margin: 0,
                      lineHeight: 1.6,
                      fontFamily: "'Outfit',sans-serif",
                    }}
                  >
                    Configure rules and filters — problems are auto-selected and
                    sealed until you start.
                  </p>
                </motion.div>

                <motion.div
                  className="cc-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="cc-sec">
                    <div className="cc-sec-title">
                      <CodeOutlined style={{ fontSize: 10 }} />
                      Basic Info
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <div className="cc-label">Contest name</div>
                      <Input
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        placeholder="Friday Showdown, Weekend Sprint…"
                        size="large"
                      />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="cc-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="cc-sec">
                    <div className="cc-sec-title">
                      <CalendarOutlined style={{ fontSize: 10 }} />
                      Schedule & Visibility
                    </div>

                    <div className="cc-g2" style={{ marginBottom: 16 }}>
                      <div>
                        <div className="cc-label">
                          <ClockCircleOutlined style={{ fontSize: 10 }} />
                          Scheduled start
                        </div>
                        <DatePicker
                          showTime={{ format: "HH:mm" }}
                          format="DD MMM YYYY, HH:mm"
                          placeholder="Start immediately"
                          value={form.scheduledAt}
                          onChange={(v) => set("scheduledAt", v)}
                          disabledDate={(d) => d && d < dayjs().startOf("day")}
                          size="large"
                          style={{ width: "100%" }}
                        />
                        {form.scheduledAt && (
                          <div className="cc-sched-badge">
                            <CalendarOutlined style={{ fontSize: 11 }} />
                            Starts {form.scheduledAt.fromNow()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="cc-label">
                          <ClockCircleOutlined style={{ fontSize: 10 }} />
                          Duration
                        </div>
                        <Select
                          value={form.duration}
                          onChange={(v) => set("duration", v)}
                          style={{ width: "100%" }}
                          size="large"
                        >
                          {[
                            [60, "1 hour"],
                            [90, "1.5 hours"],
                            [120, "2 hours"],
                            [150, "2.5 hours"],
                            [180, "3 hours"],
                            [240, "4 hours"],
                          ].map(([v, l]) => (
                            <Option key={v} value={v}>
                              {l}
                            </Option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="cc-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <div className="cc-sec">
                    <div className="cc-sec-title">
                      <ThunderboltOutlined style={{ fontSize: 10 }} />
                      Problem Config
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <div className="cc-label">Rating range</div>
                      <div className="cc-g2">
                        <div>
                          <div className="cc-sublabel">Minimum</div>
                          <Select
                            value={form.minRating}
                            onChange={(v) => set("minRating", v)}
                            style={{ width: "100%" }}
                            size="large"
                            popupMatchSelectWidth={false}
                          >
                            {RATINGS.filter((r) => r < form.maxRating).map(
                              (r) => (
                                <Option key={r} value={r}>
                                  {r}
                                </Option>
                              ),
                            )}
                          </Select>
                        </div>
                        <div>
                          <div className="cc-sublabel">Maximum</div>
                          <Select
                            value={form.maxRating}
                            onChange={(v) => set("maxRating", v)}
                            style={{ width: "100%" }}
                            size="large"
                            popupMatchSelectWidth={false}
                          >
                            {RATINGS.filter((r) => r > form.minRating).map(
                              (r) => (
                                <Option key={r} value={r}>
                                  {r}
                                </Option>
                              ),
                            )}
                          </Select>
                        </div>
                      </div>

                      <div className="cc-rbar">
                        <motion.div
                          className="cc-rfill"
                          animate={{
                            left: `${barLeft}%`,
                            width: `${barWidth}%`,
                          }}
                          style={{
                            background: `linear-gradient(90deg,${getRatingColor(form.minRating).bar},${getRatingColor(form.maxRating).bar})`,
                          }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <div className="cc-rlabels">
                        <span
                          style={{ color: getRatingColor(form.minRating).bar }}
                        >
                          {form.minRating}
                        </span>
                        <span
                          style={{
                            color: "#C4C9D4",
                            fontWeight: 400,
                            fontSize: 11,
                          }}
                        >
                          CF difficulty scale
                        </span>
                        <span
                          style={{ color: getRatingColor(form.maxRating).bar }}
                        >
                          {form.maxRating}
                        </span>
                      </div>
                    </div>

                    <div className="cc-g2">
                      <div>
                        <div className="cc-label">Problems</div>
                        <Select
                          value={form.count}
                          onChange={(v) => set("count", v)}
                          style={{ width: "100%" }}
                          size="large"
                        >
                          {[3, 4, 5, 6, 7, 8].map((n) => (
                            <Option key={n} value={n}>
                              {n} problems
                            </Option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="cc-sec">
                    <div className="cc-label">
                      <FireOutlined style={{ fontSize: 10 }} />
                      Topics
                      <span className="cc-hint">(optional)</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        margin: "-3px",
                      }}
                    >
                      {TAGS.map((t) => (
                        <motion.span
                          key={t}
                          className={`cc-tag ${form.tags.includes(t) ? "on" : ""}`}
                          onClick={() => toggleTag(t)}
                          whileTap={{ scale: 0.95 }}
                        >
                          {t}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="cc-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="cc-sec">
                    <div className="cc-sec-title">
                      <TeamOutlined style={{ fontSize: 10 }} />
                      Participants
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <div className="cc-label">
                        <MailOutlined style={{ fontSize: 10 }} />
                        Invite by email
                        <span className="cc-hint">
                          (send contest link automatically)
                        </span>
                      </div>
                      <div className="cc-email-row">
                        <Input
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addEmail()}
                          placeholder="friend@example.com"
                          size="large"
                          prefix={
                            <MailOutlined
                              style={{ color: "#C4C9D4", fontSize: 13 }}
                            />
                          }
                          style={{ flex: 1 }}
                        />
                        <Button
                          icon={<PlusOutlined />}
                          onClick={addEmail}
                          size="large"
                          style={{
                            background: "#EEF2FF",
                            color: "#4F46E5",
                            border: "1.5px solid #4F46E5",
                            fontWeight: 600,
                            fontFamily: "'Outfit',sans-serif",
                            boxShadow: "none",
                          }}
                        >
                          Add
                        </Button>
                      </div>

                      {form.inviteEmails.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          style={{
                            marginTop: 10,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 2,
                          }}
                        >
                          {form.inviteEmails.map((e) => (
                            <span key={e} className="cc-email-pill">
                              <MailOutlined style={{ fontSize: 10 }} />
                              {e}
                              <span
                                className="cc-email-x"
                                onClick={() => removeEmail(e)}
                              >
                                <CloseOutlined />
                              </span>
                            </span>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <Button
                    className="cc-cta"
                    onClick={handleCreate}
                    disabled={!form.name.trim()}
                    block
                  >
                    <RocketOutlined style={{ fontSize: 16, marginRight: 8 }} />
                    Create Contest
                  </Button>
                  <p
                    style={{
                      textAlign: "center",
                      fontSize: 12,
                      color: "#B0B8C8",
                      marginTop: 10,
                      fontFamily: "'Outfit',sans-serif",
                    }}
                  >
                    Problems are sealed — participants won't see them until
                    contest start
                  </p>
                </motion.div>
              </motion.div>
            )}

            {phase === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                style={{ textAlign: "center" }}
              >
                <motion.div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: 32,
                  }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, ease: "backOut" }}
                >
                  <div style={{ position: "relative", width: 96, height: 96 }}>
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        style={{
                          position: "absolute",
                          inset: i * 10,
                          borderRadius: "50%",
                          border: "1.5px solid rgba(79,70,229,.2)",
                        }}
                        animate={{
                          scale: [1, 1.1, 1],
                          opacity: [0.3, 0.1, 0.3],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          delay: i * 0.4,
                        }}
                      />
                    ))}
                    <div
                      style={{
                        position: "absolute",
                        inset: 22,
                        borderRadius: "50%",
                        border: "3px solid #EEF2FF",
                        borderTopColor: "#4F46E5",
                        animation: "cc-spin .85s linear infinite",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 26,
                      }}
                    >
                      🔒
                    </div>
                  </div>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: "#0F172A",
                    margin: "0 0 8px",
                    letterSpacing: "-0.5px",
                    fontFamily: "'Outfit',sans-serif",
                  }}
                >
                  Building your contest
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    color: "#6B7280",
                    fontSize: 14,
                    margin: "0 0 32px",
                    lineHeight: 1.6,
                    fontFamily: "'Outfit',sans-serif",
                  }}
                >
                  Problems are being selected in the background.
                  <br />
                  They'll only be revealed when you start.
                </motion.p>

                <motion.div
                  className="cc-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{ textAlign: "left" }}
                >
                  {LOADING_STEPS.map((step, i) => {
                    const isDone = completedSteps.includes(i);
                    const isActive = currentStep === i && !isDone;
                    const isPending = i > currentStep;
                    return (
                      <motion.div
                        key={i}
                        className="cc-step-row"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: isPending ? 0.35 : 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        style={{
                          background: isActive ? "#FAFAFA" : "transparent",
                        }}
                      >
                        <div
                          className="cc-step-icon"
                          style={{
                            background:
                              isDone || isActive ? "#EEF2FF" : "#F9FAFB",
                            border: `2px solid ${isDone || isActive ? "#4F46E5" : "#E5E7EB"}`,
                            color: isDone || isActive ? "#4F46E5" : "#9CA3AF",
                          }}
                        >
                          {isDone ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 400 }}
                            >
                              <CheckCircleFilled
                                style={{ color: "#4F46E5", fontSize: 16 }}
                              />
                            </motion.div>
                          ) : isActive ? (
                            <div className="cc-spinner" />
                          ) : (
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: "#D1D5DB",
                              }}
                            />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: isDone || isActive ? 600 : 400,
                              color: isPending ? "#9CA3AF" : "#111827",
                              marginBottom: 2,
                              fontFamily: "'Outfit',sans-serif",
                            }}
                          >
                            {step.label}
                          </div>
                          <AnimatePresence>
                            {isActive && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{
                                  fontSize: 12,
                                  color: "#6B7280",
                                  animation: "cc-pulse 1.4s ease infinite",
                                  fontFamily: "'Outfit',sans-serif",
                                }}
                              >
                                {step.sub}
                              </motion.div>
                            )}
                            {isDone && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{
                                  fontSize: 12,
                                  color: "#4F46E5",
                                  fontFamily: "'Outfit',sans-serif",
                                }}
                              >
                                Complete
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <AnimatePresence>
                          {isDone && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: "spring", stiffness: 400 }}
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: "50%",
                                background:
                                  "linear-gradient(135deg,#4F46E5,#7C3AED)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <CheckCircleFilled
                                style={{ color: "#fff", fontSize: 12 }}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </motion.div>
                <p
                  style={{
                    fontSize: 12,
                    color: "#C4CAD4",
                    marginTop: 16,
                    fontFamily: "'Outfit',sans-serif",
                  }}
                >
                  Usually takes 15–30 seconds
                </p>
              </motion.div>
            )}

            {phase === "done" && contestResult && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "backOut" }}
                style={{ textAlign: "center" }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 18,
                    delay: 0.1,
                  }}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginBottom: 24,
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg,#EEF2FF,#F5F3FF)",
                      border: "3px solid #4F46E5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 34,
                      boxShadow: "0 8px 32px rgba(79,70,229,.2)",
                    }}
                  >
                    🎯
                  </div>
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#0F172A",
                    margin: "0 0 8px",
                    letterSpacing: "-0.6px",
                    fontFamily: "'Outfit',sans-serif",
                  }}
                >
                  Contest is ready!
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    color: "#6B7280",
                    fontSize: 15,
                    margin: "0 0 24px",
                    lineHeight: 1.6,
                    fontFamily: "'Outfit',sans-serif",
                  }}
                >
                  {contestResult.count} problems sealed.
                  <br />
                  {form.scheduledAt
                    ? `Starts ${form.scheduledAt.fromNow()}.`
                    : "Ready to start anytime."}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  style={{
                    display: "flex",
                    gap: 8,
                    justifyContent: "center",
                    marginBottom: 24,
                    flexWrap: "wrap",
                  }}
                >
                  <span className="cc-stat-chip">
                    <CodeOutlined style={{ fontSize: 11 }} />
                    {contestResult.count} problems
                  </span>
                  <span className="cc-stat-chip">
                    <ClockCircleOutlined style={{ fontSize: 11 }} />
                    {form.duration / 60}h
                  </span>
                  <span className="cc-stat-chip">
                    <ThunderboltOutlined style={{ fontSize: 11 }} />
                    {form.minRating}–{form.maxRating}
                  </span>
                  {form.inviteEmails.length > 0 && (
                    <span className="cc-stat-chip">
                      <MailOutlined style={{ fontSize: 11 }} />
                      {form.inviteEmails.length} invited
                    </span>
                  )}
                  <span className="cc-stat-chip">
                    {contestResult.visibility === "private" ? (
                      <>
                        <EyeInvisibleOutlined style={{ fontSize: 11 }} />
                        Private
                      </>
                    ) : (
                      <>
                        <GlobalOutlined style={{ fontSize: 11 }} />
                        Public
                      </>
                    )}
                  </span>
                </motion.div>

                <motion.div
                  className="cc-card"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  style={{ padding: "24px 28px", textAlign: "left" }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#9CA3AF",
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                      marginBottom: 12,
                      fontFamily: "'Outfit',sans-serif",
                    }}
                  >
                    Room Code
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div className="cc-room-code">
                      {contestResult.contestId}
                    </div>
                    <Button
                      className={`cc-copy-btn ${copied ? "copied" : ""}`}
                      icon={copied ? <CheckCircleFilled /> : <CopyOutlined />}
                      onClick={copyCode}
                    >
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>
                  <div className="cc-sealed">
                    <LockOutlined style={{ flexShrink: 0, marginTop: 1 }} />
                    Problem names stay hidden from all participants until you
                    hit Start in the host panel.
                  </div>
                  {form.inviteEmails.length > 0 && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: "10px 14px",
                        borderRadius: 10,
                        background: "#EEF2FF",
                        border: "1px solid #C7D2FE",
                        fontSize: 12,
                        color: "#3730A3",
                        display: "flex",
                        gap: 8,
                        alignItems: "flex-start",
                        fontFamily: "'Outfit',sans-serif",
                      }}
                    >
                      <MailOutlined style={{ flexShrink: 0, marginTop: 1 }} />
                      Invitations sent to {form.inviteEmails.length} email
                      {form.inviteEmails.length > 1 ? "s" : ""}.
                    </div>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  style={{ display: "flex", gap: 10, marginTop: 14 }}
                >
                  <Button className="cc-btn-out" onClick={resetForm}>
                    Create another
                  </Button>
                  <Button
                    className="cc-btn-pri"
                    onClick={() => navigate("/room/contest-dashboard")}
                  >
                    Open Contest Room →
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ConfigProvider>
  );
}
