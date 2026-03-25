import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Slider, Select, message, Spin } from 'antd'
import {
    ArrowLeftOutlined, ThunderboltOutlined, EditOutlined,
    DeleteOutlined, PlusOutlined, RobotOutlined, CheckOutlined,
    ClockCircleOutlined,
} from '@ant-design/icons'
import DashboardLayout from '../../components/common/DashboardLayout'
import { mockQuestions, OPTION_LABELS, OPTION_COLORS } from '../../data/mockData'

const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Mixed']
const TOPICS_SUGGESTIONS = ['React Hooks', 'JavaScript Closures', 'Data Structures', 'Python Basics', 'SQL Queries', 'System Design']

function StepIndicator({ step }) {
    const steps = ['Room Details', 'Generate Questions', 'Review & Launch']
    return (
        <div className="flex items-center gap-0 mb-8">
            {steps.map((s, i) => (
                <React.Fragment key={s}>
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                            style={{
                                background: i < step ? '#7c3aed' : i === step ? 'linear-gradient(135deg,#7c3aed,#06b6d4)' : '#1e1e35',
                                color: i <= step ? '#fff' : '#4b4b68',
                                border: i < step ? 'none' : `2px solid ${i === step ? '#7c3aed' : '#1e1e35'}`,
                            }}>
                            {i < step ? <CheckOutlined style={{ fontSize: 10 }} /> : i + 1}
                        </div>
                        <span className="text-xs mt-1 hidden sm:block"
                            style={{ color: i === step ? '#a78bfa' : '#4b4b68', fontWeight: i === step ? 600 : 400 }}>
                            {s}
                        </span>
                    </div>
                    {i < steps.length - 1 && (
                        <div className="flex-1 h-px mx-2 mb-4 transition-all"
                            style={{ background: i < step ? '#7c3aed' : '#1e1e35' }} />
                    )}
                </React.Fragment>
            ))}
        </div>
    )
}

function QuestionCard({ q, index, onDelete }) {
    return (
        <div className="p-4 rounded-xl animate-fade-up"
            style={{ background: '#0d0d18', border: '1px solid #1e1e35', animationDelay: `${index * 0.04}s` }}>
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3 flex-1">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa' }}>
                        {index + 1}
                    </span>
                    <p className="text-sm text-txt-primary leading-relaxed font-medium">{q.question}</p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center text-txt-muted hover:text-brand-light transition-colors"
                        style={{ background: '#12121f', border: '1px solid #1e1e35' }}>
                        <EditOutlined style={{ fontSize: 11 }} />
                    </button>
                    <button onClick={() => onDelete(index)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-txt-muted hover:text-danger transition-colors"
                        style={{ background: '#12121f', border: '1px solid #1e1e35' }}>
                        <DeleteOutlined style={{ fontSize: 11 }} />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                        style={{
                            background: oi === q.correct ? `rgba(${OPTION_COLORS[oi].slice(1).match(/.{2}/g).map(h => parseInt(h, 16)).join(',')},0.15)` : '#12121f',
                            border: `1px solid ${oi === q.correct ? OPTION_COLORS[oi] + '60' : '#1e1e35'}`,
                        }}>
                        <span className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: OPTION_COLORS[oi] + '25', color: OPTION_COLORS[oi] }}>
                            {OPTION_LABELS[oi]}
                        </span>
                        <span className="text-xs text-txt-secondary truncate">{opt}</span>
                        {oi === q.correct && <CheckOutlined style={{ fontSize: 10, color: '#10b981', marginLeft: 'auto' }} />}
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-3 mt-3 text-xs text-txt-muted">
                <span className="flex items-center gap-1"><ClockCircleOutlined /> {q.time}s</span>
                <span>· {q.points} pts</span>
            </div>
        </div>
    )
}

export default function CreateRoom() {
    const navigate = useNavigate()
    const [step, setStep] = useState(0)
    const [form] = Form.useForm()
    const [roomData, setRoomData] = useState({})
    const [questions, setQuestions] = useState([])
    const [generating, setGenerating] = useState(false)
    const [launching, setLaunching] = useState(false)

    const handleRoomDetails = async () => {
        try {
            const vals = await form.validateFields()
            setRoomData(vals)
            setStep(1)
        } catch { }
    }

    const handleGenerate = async () => {
        setGenerating(true)
        await new Promise((r) => setTimeout(r, 2200))
        setQuestions(mockQuestions)
        setGenerating(false)
        message.success('5 questions generated by AI ✨')
    }

    const handleDeleteQ = (idx) => {
        setQuestions((prev) => prev.filter((_, i) => i !== idx))
    }

    const handleLaunch = async () => {
        if (questions.length === 0) { message.warning('Add at least one question'); return }
        setLaunching(true)
        await new Promise((r) => setTimeout(r, 800))
        const roomId = `BB-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
        message.success(`Room ${roomId} created!`)
        navigate(`/teacher/room/${roomId}`)
    }

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
                <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/teacher/dashboard')}
                    className="flex items-center gap-2 text-txt-secondary hover:text-txt-primary text-sm mb-8 transition-colors bg-transparent border-none cursor-pointer">
                    <ArrowLeftOutlined /> {step > 0 ? 'Back' : 'Back to Dashboard'}
                </button>

                <h1 className="text-2xl font-bold text-txt-primary mb-2">Create New Room</h1>
                <p className="text-txt-secondary text-sm mb-8">Set up your quiz room and generate questions with AI</p>

                <StepIndicator step={step} />

                {/* Step 0: Room Details */}
                {step === 0 && (
                    <div className="animate-fade-up">
                        <div className="p-6 rounded-2xl" style={{ background: '#12121f', border: '1px solid #1e1e35' }}>
                            <Form form={form} layout="vertical" requiredMark={false} initialValues={{ numQuestions: 5, timePerQ: 30, difficulty: 'Medium' }}>

                                <Form.Item label={<span className="text-txt-secondary text-sm font-medium">Room title</span>}
                                    name="title" rules={[{ required: true, message: 'Title is required' }]}>
                                    <Input placeholder="e.g. React Fundamentals Quiz" size="large" style={{ borderRadius: 10, height: 46 }} />
                                </Form.Item>

                                <Form.Item label={<span className="text-txt-secondary text-sm font-medium">Topic / Subject</span>}
                                    name="topic" rules={[{ required: true, message: 'Topic is required' }]}>
                                    <Input placeholder="e.g. React Hooks & State Management" size="large" style={{ borderRadius: 10, height: 46 }} />
                                </Form.Item>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {TOPICS_SUGGESTIONS.map((t) => (
                                        <button key={t} type="button"
                                            onClick={() => form.setFieldValue('topic', t)}
                                            className="px-3 py-1 rounded-full text-xs font-medium transition-all hover:border-brand"
                                            style={{ background: '#0d0d18', border: '1px solid #1e1e35', color: '#8b8ba7', cursor: 'pointer' }}>
                                            {t}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <Form.Item label={<span className="text-txt-secondary text-sm font-medium">Difficulty</span>} name="difficulty">
                                        <Select size="large" options={DIFFICULTIES.map((d) => ({ label: d, value: d }))}
                                            style={{ height: 46 }} />
                                    </Form.Item>
                                    <Form.Item label={<span className="text-txt-secondary text-sm font-medium">Number of questions</span>} name="numQuestions">
                                        <Select size="large" options={[5, 10, 15, 20].map((n) => ({ label: `${n} questions`, value: n }))}
                                            style={{ height: 46 }} />
                                    </Form.Item>
                                </div>

                                <Form.Item label={
                                    <div className="flex justify-between w-full">
                                        <span className="text-txt-secondary text-sm font-medium">Time per question</span>
                                        <Form.Item noStyle shouldUpdate>
                                            {({ getFieldValue }) => (
                                                <span className="text-brand-light text-sm font-bold">{getFieldValue('timePerQ') || 30}s</span>
                                            )}
                                        </Form.Item>
                                    </div>
                                } name="timePerQ">
                                    <Slider min={10} max={60} step={5} marks={{ 10: '10s', 30: '30s', 60: '60s' }}
                                        styles={{ track: { background: '#7c3aed' }, handle: { borderColor: '#7c3aed', background: '#7c3aed' } }} />
                                </Form.Item>
                            </Form>
                        </div>

                        <Button block size="large" onClick={handleRoomDetails}
                            style={{ marginTop: 16, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', border: 'none', height: 50, fontWeight: 700, fontSize: 15, borderRadius: 12, color: '#fff' }}>
                            Continue to Questions →
                        </Button>
                    </div>
                )}

                {/* Step 1: Generate */}
                {step === 1 && (
                    <div className="animate-fade-up">
                        <div className="p-8 rounded-2xl text-center mb-4" style={{ background: '#12121f', border: '1px solid #1e1e35' }}>
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
                                <RobotOutlined style={{ fontSize: 28, color: '#a78bfa' }} />
                            </div>
                            <h3 className="text-lg font-bold text-txt-primary mb-2">AI Question Generator</h3>
                            <p className="text-txt-secondary text-sm mb-2">
                                Generating <span className="text-brand-light font-semibold">{roomData.numQuestions || 5} questions</span> on
                            </p>
                            <p className="text-txt-primary font-semibold mb-6">"{roomData.topic}"</p>

                            {generating ? (
                                <div className="space-y-3">
                                    <Spin size="large" />
                                    <p className="text-txt-secondary text-sm mt-3 animate-pulse">Generating with AI magic... ✨</p>
                                </div>
                            ) : questions.length === 0 ? (
                                <Button size="large" onClick={handleGenerate}
                                    style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', border: 'none', height: 48, paddingInline: 36, fontWeight: 700, borderRadius: 12, color: '#fff' }}>
                                    <ThunderboltOutlined /> Generate with AI
                                </Button>
                            ) : (
                                <div className="flex items-center gap-2 justify-center text-success">
                                    <CheckOutlined /> <span className="font-semibold">{questions.length} questions ready</span>
                                </div>
                            )}
                        </div>

                        {questions.length > 0 && (
                            <>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-semibold text-txt-primary text-sm">{questions.length} Questions</span>
                                    <button onClick={() => setQuestions([])}
                                        className="text-xs text-txt-secondary hover:text-warning transition-colors bg-transparent border-none cursor-pointer">
                                        Regenerate
                                    </button>
                                </div>
                                <div className="space-y-3 mb-4">
                                    {questions.map((q, i) => <QuestionCard key={q.id} q={q} index={i} onDelete={handleDeleteQ} />)}
                                </div>
                                <Button block size="large" onClick={() => setStep(2)}
                                    style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', border: 'none', height: 50, fontWeight: 700, fontSize: 15, borderRadius: 12, color: '#fff' }}>
                                    Review & Launch →
                                </Button>
                            </>
                        )}
                    </div>
                )}

                {/* Step 2: Review & Launch */}
                {step === 2 && (
                    <div className="animate-fade-up">
                        <div className="p-6 rounded-2xl mb-4" style={{ background: '#12121f', border: '1px solid #1e1e35' }}>
                            <h3 className="font-bold text-txt-primary mb-4">Room Summary</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Title', value: roomData.title },
                                    { label: 'Topic', value: roomData.topic },
                                    { label: 'Questions', value: `${questions.length} questions` },
                                    { label: 'Time per Q', value: `${roomData.timePerQ || 30}s` },
                                    { label: 'Difficulty', value: roomData.difficulty || 'Medium' },
                                    { label: 'Total time', value: `~${Math.ceil((questions.length * (roomData.timePerQ || 30)) / 60)} min` },
                                ].map((item) => (
                                    <div key={item.label} className="p-3 rounded-xl" style={{ background: '#0d0d18', border: '1px solid #1e1e35' }}>
                                        <div className="text-xs text-txt-muted mb-1">{item.label}</div>
                                        <div className="font-semibold text-txt-primary text-sm truncate">{item.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 mb-4">
                            {questions.map((q, i) => <QuestionCard key={q.id} q={q} index={i} onDelete={handleDeleteQ} />)}
                        </div>

                        <div className="p-4 rounded-xl mb-4" style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)' }}>
                            <p className="text-sm text-txt-secondary text-center">
                                🚀 Launching creates your room. Share the <span className="text-brand-light font-semibold">Room ID</span> with students to join.
                            </p>
                        </div>

                        <Button block size="large" loading={launching} onClick={handleLaunch}
                            style={{ background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', height: 50, fontWeight: 700, fontSize: 15, borderRadius: 12, color: '#fff' }}>
                            {launching ? 'Launching...' : '🚀 Launch Room'}
                        </Button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}