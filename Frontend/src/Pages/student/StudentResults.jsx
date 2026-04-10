import React from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  HomeOutlined,
  TrophyOutlined,
  CheckOutlined,
  CloseOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../components/common/Logo";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function StudentResults() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const leaderboard = location.state?.leaderboard ?? [];
  const myStats = location.state?.myStats ?? {};

  const {
    totalScore = 0,
    correctAnswers = 0,
    wrongAnswers = 0,
    accuracy = "0%",
    rank = "--",
  } = myStats;

  const totalAnswered = correctAnswers + wrongAnswers;
  const totalStudents = leaderboard.length;
  const myName = user?.user?.name || user?.name;

  const isTop3 = rank <= 3;
  const rankLabel = isTop3 ? MEDALS[rank - 1] : `#${rank}`;

  const accuracyNum = parseFloat(accuracy) || 0;

  return (
    <div className="min-h-screen bg-[#f5f5f0] flex flex-col">

      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4">
        <Logo size="sm" />
        <button
          onClick={() => navigate("/student/dashboard")}
          className="ml-auto inline-flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-1.5 text-[13px] font-medium bg-white text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <HomeOutlined /> Dashboard
        </button>
      </header>

      <div className="max-w-2xl mx-auto w-full px-5 py-8 flex flex-col gap-5">

        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <div className="text-5xl mb-3">{isTop3 ? MEDALS[rank - 1] : "🏆"}</div>

          <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400 mb-1">
            {myName ? `${myName}'s result` : "Your result"}
          </p>

          <div className="text-[52px] font-medium tabular-nums text-blue-700 leading-none mb-1">
            {totalScore.toLocaleString()}
          </div>
          <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-8">
            total points
          </p>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl py-4 px-2">
              <div className="text-[22px] font-medium text-gray-800 tabular-nums">
                {rankLabel}
              </div>
              <p className="text-[11px] uppercase tracking-widest text-gray-400 mt-1">
                Rank
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl py-4 px-2">
              <div className="text-[22px] font-medium text-gray-800 tabular-nums">
                {accuracy}
              </div>
              <p className="text-[11px] uppercase tracking-widest text-gray-400 mt-1">
                Accuracy
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl py-4 px-2">
              <div className="text-[22px] font-medium text-gray-800 tabular-nums">
                {correctAnswers}/{totalAnswered}
              </div>
              <p className="text-[11px] uppercase tracking-widest text-gray-400 mt-1">
                Correct
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-[11px] font-medium uppercase tracking-widest text-gray-400 mb-4">
            Performance breakdown
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <div className="flex justify-between text-[13px] text-gray-600 mb-1.5">
                <span>Accuracy</span>
                <span className="font-medium text-gray-800">{accuracy}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-700"
                  style={{ width: `${accuracyNum}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-1">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckOutlined className="text-emerald-700 text-[13px]" />
                </div>
                <div>
                  <div className="text-[20px] font-medium text-emerald-800 tabular-nums leading-none">
                    {correctAnswers}
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-0.5">
                    Correct
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <CloseOutlined className="text-red-600 text-[13px]" />
                </div>
                <div>
                  <div className="text-[20px] font-medium text-red-700 tabular-nums leading-none">
                    {wrongAnswers}
                  </div>
                  <div className="text-[11px] text-red-500 mt-0.5">
                    Wrong
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[14px] font-medium text-gray-800">
              <span>🏆</span> Final leaderboard
            </div>
            <span className="text-[11px] uppercase tracking-widest text-gray-400">
              {totalStudents} students
            </span>
          </div>

          <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto">
            {leaderboard.map((entry, i) => {
              const isMe = entry.name === myName;
              const isTop = i < 3;

              return (
                <div
                  key={entry.socketId || i}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${isMe
                      ? "bg-blue-50 border-blue-300"
                      : isTop
                        ? "bg-amber-50 border-amber-200"
                        : "bg-white border-gray-100"
                    }`}
                >
                  <div className="w-7 text-center flex-shrink-0">
                    {isTop ? (
                      <span className="text-base">{MEDALS[i]}</span>
                    ) : (
                      <span className="font-mono text-xs text-gray-400">
                        #{i + 1}
                      </span>
                    )}
                  </div>

                  <div
                    className={`w-[34px] h-[34px] rounded-full flex items-center justify-center text-[13px] font-medium flex-shrink-0 ${isMe
                        ? "bg-blue-200 text-blue-800"
                        : "bg-gray-100 text-gray-600"
                      }`}
                  >
                    {entry.name?.[0]?.toUpperCase() || "?"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-[13px] font-medium truncate ${isMe ? "text-blue-700" : "text-gray-800"
                        }`}
                    >
                      {entry.name}
                      {isMe && (
                        <span className="ml-1.5 text-[11px] text-gray-400 font-normal">
                          (you)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">
                      {entry.correctAnswers} correct · {entry.wrongAnswers} wrong
                      {entry.streak > 1 && (
                        <span className="ml-1 text-amber-600">
                          · 🔥 {entry.streak}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-[15px] font-medium text-gray-800 tabular-nums">
                    {(entry.score || 0).toLocaleString()}
                  </div>
                </div>
              );
            })}

            {leaderboard.length === 0 && (
              <p className="text-[13px] text-gray-400 text-center py-8">
                No results available
              </p>
            )}
          </div>
        </div>

        {rank > 3 && rank !== "--" && (
          <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <ThunderboltOutlined className="text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-medium text-gray-800">
                You finished at rank{" "}
                <span className="text-blue-700">#{rank}</span> out of{" "}
                {totalStudents} students
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Keep practicing to climb higher next time!
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate("/student/dashboard")}
          className="w-full py-3 rounded-xl border border-gray-200 bg-white text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back to Dashboard
        </button>

      </div>
    </div>
  );
}