import React from 'react'
import { ConfigProvider, theme } from 'antd'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppRouter from './router/AppRouter.jsx'

const antTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#7c3aed',
    colorBgBase: '#07070e',
    colorBgContainer: '#12121f',
    colorBgElevated: '#18182b',
    colorBorder: '#1e1e35',
    colorText: '#f1f1f8',
    colorTextSecondary: '#8b8ba7',
    borderRadius: 10,
    fontFamily: "'Poppins', sans-serif",
    fontSize: 14,
    colorLink: '#a78bfa',
    colorSuccess: '#10b981',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#06b6d4',
  },
  components: {
    Button: { borderRadius: 8, fontWeight: 500 },
    Input: { colorBgContainer: '#0d0d18', colorBorder: '#1e1e35', colorText: '#f1f1f8', borderRadius: 8 },
    Card: { colorBgContainer: '#12121f', colorBorderSecondary: '#1e1e35' },
    Table: { colorBgContainer: '#12121f', headerBg: '#0d0d18', rowHoverBg: '#18182b' },
    Modal: { contentBg: '#12121f', headerBg: '#12121f' },
    Select: { colorBgContainer: '#0d0d18', optionSelectedBg: '#1e1e35' },
    Menu: { darkItemBg: '#07070e', darkSubMenuItemBg: '#0d0d18', darkItemSelectedBg: '#1e1e35' },
    Tabs: { inkBarColor: '#7c3aed', itemActiveColor: '#a78bfa', itemSelectedColor: '#a78bfa' },
    Steps: { colorPrimary: '#7c3aed' },
    Tag: { borderRadius: 6 },
    Progress: { colorSuccess: '#10b981' },
  },
}

export default function App() {
  return (
    <ConfigProvider theme={antTheme}>
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  )
}