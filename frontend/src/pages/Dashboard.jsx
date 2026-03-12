import React, { useEffect, useState, useCallback } from 'react'
import { Users, CheckCircle, Clock, XCircle, TrendingUp, RefreshCw } from 'lucide-react'
import { getDailyReport, getUsers, getAttendanceTrend } from '../utils/api'
import { format } from 'date-fns'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="card flex items-start gap-4 animate-slide-up">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
        <p className="text-sm text-gray-400">{label}</p>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [report, setReport] = useState(null)
  const [totalUsers, setTotalUsers] = useState(0)
  const [loading, setLoading] = useState(true)

  const [trendData, setTrendData] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rep, users, trend] = await Promise.all([
        getDailyReport(today),
        getUsers(),
        getAttendanceTrend()
      ])
      setReport(rep.data)
      setTotalUsers(users.data.length || rep.data.total_registered)
      setTrendData(trend.data || [])
    } catch {
      /* backend may not be running in demo */
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">
            {format(new Date(), 'EEEE, MMMM d yyyy')}
          </p>
        </div>
        <button onClick={load} className="btn-ghost text-sm" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Registered"
          value={totalUsers || report?.total_registered}
          icon={Users}
          color="bg-indigo-600"
        />
        <StatCard
          label="Present Today"
          value={report?.total_present ?? 0}
          icon={CheckCircle}
          color="bg-primary-600"
          sub={report ? `${report.attendance_rate}% rate` : undefined}
        />
        <StatCard
          label="Late Today"
          value={report?.total_late ?? 0}
          icon={Clock}
          color="bg-amber-600"
        />
        <StatCard
          label="Absent Today"
          value={report?.total_absent ?? 0}
          icon={XCircle}
          color="bg-red-600"
        />
      </div>

      {/* Trend chart */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp size={17} className="text-primary-400" />
          <h2 className="font-semibold text-white">7-Day Attendance Trend</h2>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#29a468" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#29a468" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gLate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
            <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#e6edf3' }}
            />
            <Area type="monotone" dataKey="present" stroke="#29a468" fill="url(#gPresent)" strokeWidth={2} name="Present" />
            <Area type="monotone" dataKey="late" stroke="#f59e0b" fill="url(#gLate)" strokeWidth={2} name="Late" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent logs */}
      {report?.logs?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Today's Recent Activity</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {report.logs.slice(0, 15).map((log) => (
              <div
                key={log.log_id}
                className="flex items-center justify-between bg-surface-700 rounded-lg px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-xs font-semibold text-primary-400">
                    {log.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{log.name}</p>
                    <p className="text-gray-500 text-xs">{log.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <span className={`badge-${log.status === 'present' ? 'present' : 'late'}`}>
                    {log.status}
                  </span>
                  <span className="text-gray-500 text-xs font-mono">
                    {format(new Date(log.timestamp), 'hh:mm a')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
