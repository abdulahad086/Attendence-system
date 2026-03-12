import React, { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { ClipboardList, RefreshCw, Download } from 'lucide-react'
import { getAttendanceLogs, exportCSV } from '../utils/api'

const STATUS_BADGE = {
  present: 'badge-present',
  late:    'badge-late',
  absent:  'badge-absent',
}

export default function AttendancePage() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [date, setDate]     = useState(today)
  const [logs, setLogs]     = useState([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage]     = useState(0)
  const PER_PAGE = 50

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getAttendanceLogs({ date, limit: PER_PAGE, offset: page * PER_PAGE })
      setLogs(data.logs)
      setTotal(data.total)
    } catch { toast.error('Failed to load logs') }
    finally { setLoading(false) }
  }, [date, page])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendance Logs</h1>
          <p className="text-sm text-gray-400 mt-1">{total} records</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="input w-auto"
            value={date}
            onChange={e => { setDate(e.target.value); setPage(0) }}
          />
          <button className="btn-ghost text-sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="btn-primary text-sm" onClick={() => exportCSV(date)}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <ClipboardList size={36} className="text-gray-700" />
            <p className="text-gray-400">No attendance records for {date}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-600 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Department</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Time</th>
                    <th className="px-4 py-3 text-left">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={log.log_id} className="border-b border-surface-700 hover:bg-surface-700/50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{page * PER_PAGE + i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-600/20 flex items-center justify-center text-xs text-primary-400 font-semibold flex-shrink-0">
                            {log.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-white font-medium">{log.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{log.department ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={STATUS_BADGE[log.status] ?? 'badge-unknown'}>{log.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                        {format(new Date(log.timestamp), 'hh:mm:ss a')}
                      </td>
                      <td className="px-4 py-3">
                        {log.confidence != null ? (
                          <span className="text-xs text-gray-500 font-mono">
                            {(log.confidence * 100).toFixed(1)}%
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-surface-600 text-xs text-gray-500">
              <span>Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, total)} of {total}</span>
              <div className="flex gap-2">
                <button className="btn-ghost text-xs py-1 px-2" onClick={() => setPage(p => p - 1)} disabled={page === 0}>Prev</button>
                <button className="btn-ghost text-xs py-1 px-2" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PER_PAGE >= total}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
