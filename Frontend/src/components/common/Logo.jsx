import React from 'react';

export default function Logo({ size = 'md', showText = true }) {
  const sizes = {
    sm: { icon: 28, text: 16 },
    md: { icon: 36, text: 20 },
    lg: { icon: 48, text: 28 },
  };

  const s = sizes[size] || sizes.md;

  return (
    <div className="flex items-center gap-1.5 select-none">
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient id="codeclash-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        <path
          d="M18 3L6 7v11c0 7.55 5.12 14.6 12 16 6.88-1.4 12-8.45 12-16V7L18 3z"
          fill="url(#codeclash-grad)"
        />

        <path
          d="M13 14l-4 4 4 4M23 14l4 4-4 4M19 13l-2 10"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {showText && (
        <span
          style={{
            fontSize: s.text,
            fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
          className="font-semibold tracking-tight text-slate-950"
        >
          Code<span className="text-cyan-500">Clash</span>
        </span>
      )}
    </div>
  );
}