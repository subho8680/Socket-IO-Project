import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

import LandingPage from '../Pages/LandingPage.jsx'
import LoginPage from '../Pages/auth/LoginPage.jsx'
import SignupPage from '../Pages/auth/SignupPage.jsx'

import TeacherDashboard from '../Pages/teacher/TeacherDashboard.jsx'
import CreateRoom from '../Pages/teacher/CreateRoom.jsx'
import TeacherQuizRoom from '../Pages/teacher/TeacherQuizRoom.jsx'
import QuizResults from '../Pages/teacher/QuizResults.jsx'

import StudentDashboard from '../Pages/student/StudentDashboard.jsx'
import StudentQuizRoom from '../Pages/student/StudentQuizRoom.jsx'
import StudentResults from '../Pages/student/StudentResults.jsx'
import WaitingRoom from '../Pages/Waitingroom.jsx'
import Contest from '../Pages/student/Contest/Contest.jsx'
import ContestCreator from '../Pages/student/Contest/ContestCreation.jsx'
import ContestDashboard from '../Pages/student/Contest/ContestDashboard.jsx'

function PrivateRoute({ children, role }) {
    const { user } = useAuth()
    if (!user) return <Navigate to="/login" replace />
    if (role && user.role !== role) {
        return <Navigate to={user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} replace />
    }
    return children
}

export default function AppRouter() {
    const { user } = useAuth()
    const teacherHome = '/teacher/dashboard'
    const studentHome = '/student/dashboard'

    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={user ? <Navigate to={user.role === 'teacher' ? teacherHome : studentHome} replace /> : <LoginPage />} />
            <Route path="/signup" element={user ? <Navigate to={user.role === 'teacher' ? teacherHome : studentHome} replace /> : <SignupPage />} />

            <Route path="/teacher/dashboard" element={<PrivateRoute role="teacher"><TeacherDashboard /></PrivateRoute>} />
            <Route path="/teacher/create-room" element={<PrivateRoute role="teacher"><CreateRoom /></PrivateRoute>} />
            <Route path="/teacher/room/:id" element={<PrivateRoute role="teacher"><TeacherQuizRoom /></PrivateRoute>} />
            <Route path="/teacher/room/:roomId/results" element={<PrivateRoute role="teacher"><QuizResults /></PrivateRoute>} />

            <Route path="/student/dashboard" element={<PrivateRoute role="student"><StudentDashboard /></PrivateRoute>} />
            <Route path="/student/room/:roomId" element={<PrivateRoute role="student"><StudentQuizRoom /></PrivateRoute>} />
            <Route path="/student/room/:roomId/results" element={<PrivateRoute role="student"><StudentResults /></PrivateRoute>} />

            <Route path="/room/:roomId/waiting" element={<PrivateRoute><WaitingRoom /></PrivateRoute>} />
            <Route path="/room/contest/:contestId" element={<PrivateRoute><Contest /></PrivateRoute>} />
            <Route path="/room/create-contest" element={<PrivateRoute><ContestCreator /></PrivateRoute>} />
            <Route path="/room/contest-dashboard" element={<PrivateRoute><ContestDashboard /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}