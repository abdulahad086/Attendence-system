import React, { useState, useCallback } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { BarChart3, Download, RefreshCw, TrendingUp } from 'lucide-react'
import { getDailyReport, exportCSV } from '../utils/api'
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

const COLORS = ['#29a468', '#f59e0b', '#ef4444']

export default function ReportsPage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [date, setDate]     = useState(today)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getDailyReport(date)
      setReport(data)
    } catch { toast.error('Failed to load report') }
    finally { setLoading(false) }
  }, [date])

  const pieData = report ? [
    { name: 'Present', value: report.total_present },
    { name: 'Late',    value: report.total_late },
    { name: 'Absent',  value: report.total_absent },
  ] : []

  const barData = report?.logs
    ? Object.values(
        report.logs.reduce((acc, l) => {
          const dept = l.department || 'Unknown'
          if (!acc[dept]) acc[dept] = { dept, present: 0, late: 0 }
          if (l.status === 'present') acc[dept].present++
          else if (l.status === 'late') acc[dept].late++
          return acc
        }, {}),
      )
    : []

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-sm text-gray-400 mt-1">Daily attendance analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="input w-auto"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          <button className="btn-primary text-sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Generate
          </button>
          {report && (
            <button className="btn-ghost text-sm" onClick={() => exportCSV(date)}>
              <Download size={14} /> CSV
            </button>
          )}
        </div>
      </div>

      {!report && !loading && (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <BarChart3 size={36} className="text-gray-700" />
          <p className="text-gray-400">Select a date and click Generate</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      )}

      {report && !loading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total',   value: report.total_registered, color: 'text-indigo-400' },
              { label: 'Present', value: report.total_present,    color: 'text-primary-400' },
              { label: 'Late',    value: report.total_late,        color: 'text-amber-400' },
              { label: 'Absent',  value: report.total_absent,      color: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="card text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Attendance rate */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={15} className="text-primary-400" />
                <span className="font-medium text-white text-sm">Attendance Rate</span>
              </div>
              <span className="text-primary-400 font-bold">{report.attendance_rate}%</span>
            </div>
            <div className="h-2.5 bg-surface-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-600 to-primary-400 rounded-full transition-all duration-700"
                style={{ width: `${report.attendance_rate}%` }}
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {/* Pie chart */}
            <div className="card">
              <h3 className="font-medium text-white text-sm mb-4">Status Breakdown</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, fontSize: 12 }}
                    labelStyle={{ color: '#e6edf3' }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar by department */}
            <div className="card">
              <h3 className="font-medium text-white text-sm mb-4">By Department</h3>
              {barData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-gray-600 text-sm">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                    <XAxis dataKey="dept" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="present" fill="#29a468" radius={[4, 4, 0, 0]} name="Present" />
                    <Bar dataKey="late"    fill="#f59e0b" radius={[4, 4, 0, 0]} name="Late" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
