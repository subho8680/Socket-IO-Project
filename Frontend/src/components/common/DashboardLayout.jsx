import React from 'react'
import Navbar from './Navbar'

export default function DashboardLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col" style={{ background: '#07070e' }}>
            <Navbar />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    )
}