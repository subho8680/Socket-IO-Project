import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Tag } from 'antd'
import { ThunderboltOutlined, TeamOutlined, TrophyOutlined, RocketOutlined, ArrowRightOutlined, PlayCircleOutlined } from '@ant-design/icons'
import Logo from '../components/common/Logo'

const FEATURES = [
    { icon: <ThunderboltOutlined style={{ fontSize: 22, color: '#a78bfa' }} />, title: 'Real-time Sync', desc: 'Questions broadcast instantly to all students the moment you hit start.' },
    { icon: <PlayCircleOutlined style={{ fontSize: 22, color: '#06b6d4' }} />, title: 'AI Question Gen', desc: 'Type a topic, let AI generate a full quiz set in seconds.' },
    { icon: <TrophyOutlined style={{ fontSize: 22, color: '#f59e0b' }} />, title: 'Live Leaderboard', desc: 'Students see rankings update after every single answer.' },
    { icon: <TeamOutlined style={{ fontSize: 22, color: '#10b981' }} />, title: 'Room System', desc: 'Create a room, share a 6-digit code, students join instantly.' },
]

const STATS = [
    { value: '50+', label: 'Concurrent Students' },
    { value: '< 50ms', label: 'Broadcast Latency' },
    { value: '100%', label: 'Real-time Updates' },
]

export default function LandingPage() {
    const navigate = useNavigate()
    const [hovered, setHovered] = useState(null)

    return (
        <div className="min-h-screen flex flex-col font-sans overflow-x-hidden" style={{ background: '#07070e' }}>
            <div className="fixed inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
            <div className="fixed pointer-events-none" style={{ top: '-10%', left: '20%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
            <div className="fixed pointer-events-none" style={{ top: '30%', right: '-5%', width: 400, height: 400, background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />

            <header className="relative z-10 flex items-center justify-between px-6 md:px-16 h-16">
                <Logo size="md" />
                <div className="flex items-center gap-3">
                    <Button type="text" onClick={() => navigate('/login')} className="font-medium" style={{ color: '#8b8ba7' }}>Log in</Button>
                    <Button type="primary" onClick={() => navigate('/signup')} style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', border: 'none', fontWeight: 600 }}>Get Started</Button>
                </div>
            </header>

            <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-16">
                <Tag className="mb-6 px-4 py-1 text-xs font-semibold tracking-widest uppercase animate-fade-in"
                    style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', borderRadius: 99 }}>
                    ⚡ AI-Powered Live Quiz Platform
                </Tag>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight mb-6 animate-fade-up text-txt-primary"
                    style={{ letterSpacing: '-2px', animationDelay: '0.1s' }}>
                    Quizzes that feel<br />
                    <span style={{ background: 'linear-gradient(90deg,#a78bfa,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>alive.</span>
                </h1>

                <p className="text-lg md:text-xl text-txt-secondary max-w-xl mb-10 animate-fade-up font-light" style={{ animationDelay: '0.2s' }}>
                    Teachers create rooms. AI builds questions. Students compete live. Leaderboard updates in real-time — every answer, every second.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-14 animate-fade-up w-full max-w-md" style={{ animationDelay: '0.3s' }}>
                    {[
                        { role: 'teacher', emoji: '🎓', title: "I'm a Teacher", sub: 'Create rooms & quizzes', color: '#7c3aed', colorRgb: '124,58,237' },
                        { role: 'student', emoji: '🧑‍💻', title: "I'm a Student", sub: 'Join rooms & compete', color: '#06b6d4', colorRgb: '6,182,212' },
                    ].map(({ role, emoji, title, sub, color, colorRgb }) => (
                        <button key={role}
                            onClick={() => navigate(`/signup?role=${role}`)}
                            onMouseEnter={() => setHovered(role)}
                            onMouseLeave={() => setHovered(null)}
                            className="flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl transition-all duration-300 text-center group"
                            style={{
                                background: hovered === role ? `rgba(${colorRgb},0.2)` : `rgba(${colorRgb},0.08)`,
                                border: `1.5px solid ${hovered === role ? color : `rgba(${colorRgb},0.25)`}`,
                                transform: hovered === role ? 'translateY(-4px)' : 'none',
                            }}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `rgba(${colorRgb},0.2)` }}>{emoji}</div>
                            <div>
                                <div className="font-bold text-txt-primary text-base mb-0.5">{title}</div>
                                <div className="text-xs text-txt-secondary">{sub}</div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="flex gap-8 md:gap-16 animate-fade-up" style={{ animationDelay: '0.4s' }}>
                    {STATS.map((s) => (
                        <div key={s.label} className="text-center">
                            <div className="text-2xl md:text-3xl font-black" style={{ background: 'linear-gradient(90deg,#a78bfa,#67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
                            <div className="text-xs text-txt-muted mt-1 font-medium">{s.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="relative z-10 px-6 md:px-16 py-16">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-center text-2xl md:text-3xl font-bold text-txt-primary mb-2">Everything you need</h2>
                    <p className="text-center text-txt-secondary mb-12 text-sm">Built for the modern classroom — fast, smart, engaging.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {FEATURES.map((f, i) => (
                            <div key={f.title} className="p-6 rounded-2xl transition-all duration-300 animate-fade-up"
                                style={{ background: '#12121f', border: '1px solid #1e1e35', animationDelay: `${0.1 * i}s` }}>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: '#0d0d18', border: '1px solid #1e1e35' }}>{f.icon}</div>
                                <div className="font-semibold text-txt-primary mb-1">{f.title}</div>
                                <div className="text-sm text-txt-secondary leading-relaxed">{f.desc}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="relative z-10 px-6 py-16 text-center">
                <div className="max-w-xl mx-auto p-10 rounded-3xl"
                    style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.08))', border: '1px solid rgba(124,58,237,0.25)' }}>
                    <RocketOutlined style={{ fontSize: 40, color: '#a78bfa' }} className="mb-4 animate-float inline-block" />
                    <h2 className="text-2xl md:text-3xl font-bold text-txt-primary mb-3">Ready to run your first quiz?</h2>
                    <p className="text-txt-secondary mb-8 text-sm">Free to use. No credit card. Start in under 2 minutes.</p>
                    <Button type="primary" size="large" icon={<ArrowRightOutlined />} onClick={() => navigate('/signup')}
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', border: 'none', height: 48, paddingInline: 36, fontWeight: 700, fontSize: 15, borderRadius: 12 }}>
                        Create Free Account
                    </Button>
                </div>
            </section>

            <footer className="relative z-10 text-center py-6 text-txt-muted text-xs border-t border-bg-border">
                © 2025 BrainBlast · Built with React + Socket.io + AI
            </footer>
        </div>
    )
}