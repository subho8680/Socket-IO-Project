import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { const s = localStorage.getItem('bb_user'); return s ? JSON.parse(s) : null } catch { return null }
    })

    const login = (userData) => {
        const u = { ...userData, loggedAt: Date.now() }
        localStorage.setItem('bb_user', JSON.stringify(u))
        setUser(u)
    }

    const logout = () => {
        localStorage.removeItem('bb_user')
        setUser(null)
    }

    const signup = (userData) => {
        const u = { ...userData, id: `user_${Date.now()}`, loggedAt: Date.now() }
        localStorage.setItem('bb_user', JSON.stringify(u))
        setUser(u)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, signup }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}