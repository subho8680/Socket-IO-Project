import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

import LandingPage from '../Pages/LandingPage.jsx'
import LoginPage from '../Pages/auth/LoginPage.jsx'
import SignupPage from '../Pages/auth/SignupPage.jsx'

import Contest from '../Pages/student/Contest/Contest.jsx'
import ContestCreator from '../Pages/student/Contest/ContestCreation.jsx'
import ContestDashboard from '../Pages/student/Contest/ContestDashboard.jsx'

function PrivateRoute({ children }) {
    const { user } = useAuth()
    if (!user) return <Navigate to="/login" replace />
    return children
}

export default function AppRouter() {
    const { user } = useAuth()
    const contestHome = '/contests'

    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={user ? <Navigate to={contestHome} replace /> : <LoginPage />} />
            <Route path="/signup" element={user ? <Navigate to={contestHome} replace /> : <SignupPage />} />
            <Route path="/room/contest/:contestId" element={<PrivateRoute><Contest /></PrivateRoute>} />
            <Route path="/room/create-contest" element={<PrivateRoute><ContestCreator /></PrivateRoute>} />
            <Route path="/room/contest-dashboard" element={<PrivateRoute><ContestDashboard /></PrivateRoute>} />
            <Route path="/contests" element={<PrivateRoute><ContestDashboard /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}
