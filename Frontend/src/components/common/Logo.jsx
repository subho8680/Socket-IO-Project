import React from 'react'

export default function Logo({ size = 'md', showText = true }) {
    const sizes = { sm: { icon: 28, text: 16 }, md: { icon: 36, text: 20 }, lg: { icon: 48, text: 28 } }
    const s = sizes[size]
    return (
        <div className="flex items-center gap-2">
            <svg width={s.icon} height={s.icon} viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="10" fill="url(#logo-grad)" />
                <defs>
                    <linearGradient id="logo-grad" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#7c3aed" />
                        <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                </defs>
                <path d="M10 13h16M10 18h10M10 23h13" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
                <circle cx="26" cy="23" r="3" fill="white" opacity="0.9" />
            </svg>
            {showText && (
                <span style={{ fontSize: s.text, fontWeight: 800, letterSpacing: '-0.5px' }}
                    className="text-txt-primary">
                    Brain<span className="text-brand-light">Blast</span>
                </span>
            )}
        </div>
    )
}