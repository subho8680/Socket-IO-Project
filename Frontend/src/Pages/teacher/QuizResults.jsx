import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Avatar, Progress, Tag } from 'antd'
import {
    TrophyOutlined, TeamOutlined, ThunderboltOutlined,
    ArrowLeftOutlined, DownloadOutlined, RobotOutlined, RedoOutlined,
} from '@ant-design/icons'
import DashboardLayout from '../../components/common/DashboardLayout'
import { mockLeaderboard, mockQuestions } from '../../data/mockData'

const MEDALS = ['🥇', '🥈', '🥉']

function PodiumCard({ entry, place }) {
    const heights = [140, 100, 80]
    const sizes = [52, 44, 40]
    const colors = ['#f59e0b', '#8b8ba7', '#cd7f32']

    return (
        <div className="flex flex-col items-center gap-2">
            <Avatar size={sizes[place]}
                style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', fontSize: sizes[place] / 2.5, fontWeight: 700, border: `3px solid ${colors[place]}` }}>
                {entry.avatar}
            </Avatar>
            <div className="text-center">
                <div className="font-bold text-txt-primary text-sm">{entry.name.split(' ')[0]}</div>
                <div className="font-black text-sm" style={{ color: colors[place] }}>{entry.score.toLocaleString()}</div>
            </div>
            <div className="flex items-end justify-center rounded-t-xl w-20 text-center"
                style={{ height: heights[place], background: place === 0 ? 'rgba(245,158,11,0.2)' : place === 1 ? 'rgba(139,139,167,0.15)' : 'rgba(205,127,50,0.15)', border: `1px solid ${colors[place]}30` }}>
                <span className="text-3xl mb-2">{MEDALS[place]}</span>
            </div>
        </div>
    )
}

export default function QuizResults() {
    const navigate = useNavigate()
    const { roomId } = useParams()
    const [showAI, setShowAI] = useState(false)
    const [loadingAI, setLoadingAI] = useState(false)
    const [aiReport, setAiReport] = useState('')

    const top3 = mockLeaderboard.slice(0, 3)
    const rest = mockLeaderboard.slice(3)

    const handleAIReport = async () => {
        setLoadingAI(true)
        setShowAI(true)
        await new Promise((r) => setTimeout(r, 1500))
        setAiReport(
            `📊 Class Performance Summary for "${roomId}"\n\nOverall, students performed well with an average score of 7,350 points. The topic was well understood by the majority.\n\n✅ Strengths: Questions 1 and 3 had the highest accuracy (90%+). Students showed strong understanding of core React hooks.\n\n⚠️ Weaknesses: Question 5 about infinite loops had only 42% accuracy — recommend revisiting this concept.\n\n🎯 Recommendations:\n• Review useEffect dependency arrays in the next session\n• Top performers (Arjun, Priya) can be assigned mentoring roles\n• Consider a follow-up quiz on advanced patterns`
        )
        setLoadingAI(false)
    }

    const statsRow = [
        { label: 'Total Students', value: mockLeaderboard.length, icon: <TeamOutlined />, color: '#06b6d4' },
        { label: 'Avg Score', value: '7,350', icon: <TrophyOutlined />, color: '#f59e0b' },
        { label: 'Questions', value: mockQuestions.length, icon: <ThunderboltOutlined />, color: '#7c3aed' },
        { label: 'Top Score', value: mockLeaderboard[0].score.toLocaleString(), icon: <TrophyOutlined />, color: '#10b981' },
    ]

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div>
                        <button onClick={() => navigate('/teacher/dashboard')}
                            className="flex items-center gap-2 text-txt-secondary hover:text-txt-primary text-sm mb-2 transition-colors bg-transparent border-none cursor-pointer">
                            <ArrowLeftOutlined /> Back to Dashboard
                        </button>
                        <h1 className="text-2xl font-bold text-txt-primary">Quiz Results</h1>
                        <p className="text-txt-secondary text-sm mt-0.5 font-mono">Room: {roomId}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button icon={<DownloadOutlined />}
                            style={{ background: '#12121f', border: '1px solid #1e1e35', color: '#8b8ba7', borderRadius: 10, fontWeight: 600 }}>
                            Export CSV
                        </Button>
                        <Button icon={<RedoOutlined />} onClick={() => navigate('/teacher/create-room')}
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', border: 'none', borderRadius: 10, fontWeight: 600, color: '#fff' }}>
                            New Quiz
                        </Button>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {statsRow.map((s) => (
                        <div key={s.label} className="p-5 rounded-2xl text-center animate-fade-up"
                            style={{ background: '#12121f', border: '1px solid #1e1e35' }}>
                            <div className="text-xl mb-1" style={{ color: s.color }}>{s.icon}</div>
                            <div className="text-2xl font-black text-txt-primary">{s.value}</div>
                            <div className="text-xs text-txt-secondary mt-0.5">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Podium */}
                <div className="p-6 rounded-2xl mb-6 animate-fade-up" style={{ background: '#12121f', border: '1px solid #1e1e35' }}>
                    <h3 className="font-bold text-txt-primary text-sm mb-6 text-center">🏆 Top Performers</h3>
                    <div className="flex items-end justify-center gap-4">
                        <PodiumCard entry={top3[1]} place={1} />
                        <PodiumCard entry={top3[0]} place={0} />
                        <PodiumCard entry={top3[2]} place={2} />
                    </div>
                </div>

                {/* Full Leaderboard */}
                <div className="p-6 rounded-2xl mb-6 animate-fade-up" style={{ background: '#12121f', border: '1px solid #1e1e35', animationDelay: '0.1s' }}>
                    <h3 className="font-bold text-txt-primary text-sm mb-4">Full Rankings</h3>
                    <div className="space-y-2">
                        {mockLeaderboard.map((entry, i) => (
                            <div key={entry.name} className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all hover:bg-bg-hover">
                                <div className="w-7 text-center text-sm font-bold flex-shrink-0">
                                    {i < 3 ? MEDALS[i] : <span className="text-txt-muted">#{i + 1}</span>}
                                </div>
                                <Avatar size={32} style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                    {entry.avatar}
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-txt-primary text-sm">{entry.name}</div>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <span className="text-xs text-txt-muted">{entry.correct}/{entry.answered} correct</span>
                                        {entry.streak > 1 && <span className="text-xs text-warning">🔥 {entry.streak} streak</span>}
                                    </div>
                                </div>
                                <div className="hidden sm:block flex-1 max-w-[160px]">
                                    <Progress
                                        percent={Math.round((entry.correct / entry.answered) * 100)}
                                        size="small"
                                        strokeColor={{ from: '#7c3aed', to: '#06b6d4' }}
                                        showInfo={false}
                                    />
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                    <div className="font-bold text-txt-primary">{entry.score.toLocaleString()}</div>
                                    <div className="text-xs text-txt-muted">pts</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Per-question accuracy */}
                <div className="p-6 rounded-2xl mb-6 animate-fade-up" style={{ background: '#12121f', border: '1px solid #1e1e35', animationDelay: '0.15s' }}>
                    <h3 className="font-bold text-txt-primary text-sm mb-4">Question Accuracy</h3>
                    <div className="space-y-4">
                        {mockQuestions.map((q, i) => {
                            const acc = Math.floor(40 + Math.random() * 55)
                            const color = acc >= 70 ? '#10b981' : acc >= 45 ? '#f59e0b' : '#ef4444'
                            return (
                                <div key={q.id}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-xs text-txt-secondary truncate max-w-[70%]">Q{i + 1}: {q.question.slice(0, 60)}...</span>
                                        <span className="text-xs font-bold ml-2 flex-shrink-0" style={{ color }}>{acc}%</span>
                                    </div>
                                    <Progress percent={acc} size="small" showInfo={false}
                                        strokeColor={color} trailColor="#1e1e35" />
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* AI Report */}
                <div className="p-6 rounded-2xl animate-fade-up" style={{ background: '#12121f', border: '1px solid rgba(124,58,237,0.3)', animationDelay: '0.2s' }}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)' }}>
                            <RobotOutlined style={{ color: '#a78bfa', fontSize: 18 }} />
                        </div>
                        <div>
                            <h3 className="font-bold text-txt-primary text-sm">AI Class Report</h3>
                            <p className="text-xs text-txt-secondary">Get AI-generated insights on class performance</p>
                        </div>
                    </div>

                    {!showAI && (
                        <Button block onClick={handleAIReport}
                            style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', border: 'none', height: 46, fontWeight: 700, borderRadius: 10, color: '#fff' }}>
                            Generate AI Report
                        </Button>
                    )}

                    {showAI && loadingAI && (
                        <div className="text-center py-6">
                            <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent mx-auto animate-spin-slow mb-3" />
                            <p className="text-txt-secondary text-sm animate-pulse">Analyzing class performance...</p>
                        </div>
                    )}

                    {showAI && !loadingAI && aiReport && (
                        <div className="p-4 rounded-xl text-sm text-txt-secondary leading-relaxed whitespace-pre-line animate-fade-in"
                            style={{ background: '#0d0d18', border: '1px solid #1e1e35' }}>
                            {aiReport}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}