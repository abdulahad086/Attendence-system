import React, { useState, useEffect } from 'react'
import { Building2, Users, Video, ClipboardList, TrendingUp, Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await api.get('/organizations/stats')
      setStats(res.data)
    } catch (err) {
      toast.error('Failed to load platform stats')
    } finally {
      setLoading(false)
    }
  }

  const cards = stats ? [
    { label: 'Total Organizations', value: stats.total_organizations, icon: Building2, color: 'from-blue-600 to-blue-400' },
    { label: 'Active Organizations', value: stats.active_organizations, icon: Activity, color: 'from-green-600 to-green-400' },
    { label: 'Total Employees', value: stats.total_employees, icon: Users, color: 'from-purple-600 to-purple-400' },
    { label: 'Total Cameras', value: stats.total_cameras, icon: Video, color: 'from-amber-600 to-amber-400' },
    { label: 'Total Attendance Logs', value: stats.total_attendance_logs, icon: ClipboardList, color: 'from-pink-600 to-pink-400' },
  ] : []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <TrendingUp className="text-primary-400" />
          Platform Overview
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          SaaS-wide statistics and health metrics
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card) => (
            <div key={card.label} className="card relative overflow-hidden group hover:border-primary-500/30 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{card.label}</p>
                  <p className="text-3xl font-bold text-white mt-2">{card.value.toLocaleString()}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                  <card.icon size={20} className="text-white" />
                </div>
              </div>
              {/* Decorative gradient bar at bottom */}
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
            </div>
          ))}
        </div>
      )}

      {/* Info banner */}
      <div className="card bg-gradient-to-br from-primary-900/30 to-surface-800 border-primary-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600/20 rounded-xl flex items-center justify-center text-primary-400">
            <Building2 size={22} />
          </div>
          <div>
            <h3 className="text-white font-semibold">Super Admin Mode</h3>
            <p className="text-sm text-gray-400">
              You are viewing platform-level data only. Employee faces and attendance logs are managed by individual organizations.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
