import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import {
  LayoutDashboard, Video, Users, ClipboardList,
  BarChart3, Menu, X, Cpu, Circle, LogOut, Building2, Settings, TrendingUp
} from 'lucide-react'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import LiveCamera from './pages/LiveCamera'
import UsersPage from './pages/UsersPage'
import AttendancePage from './pages/AttendancePage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import OrganizationsPage from './pages/OrganizationsPage'
import SuperAdminDashboard from './pages/SuperAdminDashboard'
import LandingPage from './pages/LandingPage'

// ── Navigation configs per role ──────────────────────────────────────────────

const SUPER_ADMIN_NAV = [
  { to: '/',              label: 'Platform Overview', icon: TrendingUp },
  { to: '/organizations', label: 'Organizations',     icon: Building2 },
]

const ORG_ADMIN_NAV = [
  { to: '/',           label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/camera',     label: 'Live Camera',  icon: Video },
  { to: '/users',      label: 'Employees',    icon: Users },
  { to: '/attendance', label: 'Attendance',   icon: ClipboardList },
  { to: '/reports',    label: 'Reports',      icon: BarChart3 },
  { to: '/settings',   label: 'Settings',     icon: Settings },
]

// ── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ open, onClose }) {
  const navigate = useNavigate()

  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const isSuperAdmin = user?.role === 'super_admin'

  const navItems = isSuperAdmin ? SUPER_ADMIN_NAV : ORG_ADMIN_NAV

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-surface-800 border-r border-surface-600
        z-30 flex flex-col transition-transform duration-300
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-600">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
            <Cpu size={18} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">AttendAI</p>
            <p className="text-xs text-gray-500">
              {isSuperAdmin ? 'Super Admin' : 'Organization'}
            </p>
          </div>
        </div>

        {/* Role label badge */}
        <div className="px-5 py-3 border-b border-surface-600">
          <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
            isSuperAdmin
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
          }`}>
            {isSuperAdmin ? '⚡ Platform Admin' : '🏢 ' + (user?.organization_name || 'Organization')}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-primary-600/20 text-primary-400 border border-primary-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-surface-700'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-surface-600 space-y-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
          <div className="flex items-center gap-2 text-xs text-gray-500 px-3">
            <Circle size={8} className="fill-primary-500 text-primary-500 animate-pulse" />
            System Online
          </div>
        </div>
      </aside>
    </>
  )
}

// ── Protected Route Wrapper ──────────────────────────────────────────────────

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('auth_token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

function PublicOnlyRoute({ children }) {
  const token = localStorage.getItem('auth_token')
  if (token) {
    return <Navigate to="/dashboard-main" replace />
  }
  return children
}

// ── Role-based route rendering ───────────────────────────────────────────────

function RoleBasedRoutes() {
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const isSuperAdmin = user?.role === 'super_admin'

  return (
    <Routes>
      <Route path="/dashboard-main" element={isSuperAdmin ? <SuperAdminDashboard /> : <Dashboard />} />
      {isSuperAdmin ? (
        <>
          <Route path="/organizations" element={<OrganizationsPage />} />
          <Route path="*" element={<Navigate to="/dashboard-main" replace />} />
        </>
      ) : (
        <>
          <Route path="/camera"     element={<LiveCamera />} />
          <Route path="/users"      element={<UsersPage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/reports"    element={<ReportsPage />} />
          <Route path="/settings"   element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard-main" replace />} />
        </>
      )}
    </Routes>
  )
}

// ── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'bg-surface-700 text-white border border-surface-600 text-sm',
          duration: 3500,
        }}
      />

      <Routes>
        <Route path="/" element={<PublicOnlyRoute><LandingPage /></PublicOnlyRoute>} />
        <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />

        {/* Protected Dashboard Layout */}
        <Route path="*" element={
          <ProtectedRoute>
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content */}
            <div className="lg:ml-64 min-h-screen flex flex-col">
              {/* Top bar (mobile) */}
              <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-surface-800 border-b border-surface-600 sticky top-0 z-10">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-1.5 rounded-lg hover:bg-surface-700 text-gray-400 hover:text-white transition-colors"
                >
                  <Menu size={20} />
                </button>
                <span className="font-semibold text-white">AttendAI</span>
              </header>

              <main className="flex-1 p-4 md:p-6 animate-fade-in">
                <RoleBasedRoutes />
              </main>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
