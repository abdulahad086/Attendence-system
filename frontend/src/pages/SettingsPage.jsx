import React, { useState, useEffect } from 'react'
import { Save, Clock, Camera, Trash2, Plus, ShieldCheck, Video } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { getCameras, addCamera, deleteCamera } from '../utils/api'

export default function SettingsPage() {
  const [startTime, setStartTime] = useState('09:15')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [cameras, setCameras] = useState([])
  const [newCamera, setNewCamera] = useState({ name: '', location: '' })
  const [orgInfo, setOrgInfo] = useState(null)
  
  // Parse user object from localStorage
  const userStr = localStorage.getItem('user')
  const currentUser = userStr ? JSON.parse(userStr) : null

  useEffect(() => {
    fetchSettings()
    fetchCameras()
    fetchOrgInfo()
  }, [])

  const fetchOrgInfo = async () => {
    try {
      // In a real app we'd have a specific /api/auth/me or similar
      // For now, we'll refresh the user data from what's in context or a small endpoint
      // Let's assume the user object in localStorage is enough or fetch it
    } catch (err) {}
  }

  const fetchCameras = async () => {
    try {
      const res = await getCameras()
      setCameras(res.data)
    } catch (err) {
      toast.error('Failed to load cameras')
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings')
      setStartTime(res.data.expected_start_time)
    } catch (err) {
      toast.error('Failed to load settings')
    } finally {
      setFetching(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put('/settings', { expected_start_time: startTime })
      toast.success('Settings saved successfully')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCamera = async (e) => {
    e.preventDefault()
    try {
      await addCamera(newCamera)
      toast.success('Camera added successfully')
      setNewCamera({ name: '', location: '' })
      fetchCameras()
    } catch (err) {
      toast.error('Failed to add camera')
    }
  }

  const handleDeleteCamera = async (id) => {
    if (!window.confirm('Remove this camera?')) return
    try {
      await deleteCamera(id)
      toast.success('Camera removed')
      fetchCameras()
    } catch (err) {
      toast.error('Failed to remove camera')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Settings</h1>
        <p className="text-gray-400 text-sm mt-1">
          Configure global application preferences
        </p>
      </div>

      <div className="bg-surface-800 border border-surface-600 rounded-2xl overflow-hidden text-white shadow-xl">
        <div className="p-6 border-b border-surface-600">
          <h2 className="text-lg font-medium flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-400" />
            Attendance Rules
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Define when employees are considered late.
          </p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {fetching ? (
            <div className="animate-pulse flex space-x-4">
              <div className="h-10 bg-surface-600 rounded w-1/4"></div>
            </div>
          ) : (
            <div className="max-w-xs">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expected Start Time (HH:MM)
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-surface-900 border border-surface-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Anyone marked after this time will be flagged as "late".
              </p>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading || fetching}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Subscription Info */}
      <div className="card bg-gradient-to-br from-primary-900/40 to-surface-800 border-primary-500/20">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-primary-600/20 rounded-xl flex items-center justify-center text-primary-400">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Subscription Plan</h2>
              <p className="text-primary-300 font-medium">
                {currentUser?.organization_name || 'Active'} • Standard Plan
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="px-3 py-1 bg-surface-900/50 rounded-full text-gray-400 border border-surface-600">
                  <span className="text-white font-semibold">10 / 50</span> Employees
                </div>
                <div className="px-3 py-1 bg-surface-900/50 rounded-full text-gray-400 border border-surface-600">
                  <span className="text-white font-semibold">{cameras.length} / 5</span> Cameras
                </div>
              </div>
            </div>
          </div>
          <button className="text-xs font-semibold text-primary-400 hover:text-primary-300 underline uppercase tracking-widest">
            Upgrade Plan
          </button>
        </div>
      </div>

      {/* Camera Management */}
      <div className="bg-surface-800 border border-surface-600 rounded-2xl overflow-hidden text-white shadow-xl">
        <div className="p-6 border-b border-surface-600 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary-400" />
              Connected Cameras
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Manage physical devices at your locations.
            </p>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleAddCamera} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <input
              required
              className="input-field"
              placeholder="Camera Name (e.g. Main Gate)"
              value={newCamera.name}
              onChange={e => setNewCamera({...newCamera, name: e.target.value})}
            />
            <input
              className="input-field"
              placeholder="Location (e.g. Building A)"
              value={newCamera.location}
              onChange={e => setNewCamera({...newCamera, location: e.target.value})}
            />
            <button type="submit" className="btn-primary w-full h-full py-2">
              <Plus size={16} /> Add Camera
            </button>
          </form>

          <div className="space-y-3">
            {cameras.length === 0 ? (
              <p className="text-center py-8 text-gray-500 text-sm">No cameras registered yet.</p>
            ) : (
              cameras.map(cam => (
                <div key={cam.id} className="flex items-center justify-between p-4 bg-surface-900/50 rounded-xl border border-surface-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-surface-700 rounded-lg flex items-center justify-center text-gray-400">
                      <Video size={20} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{cam.name}</h4>
                      <p className="text-xs text-gray-500">{cam.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-xs text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      {cam.status}
                    </span>
                    <button 
                      onClick={() => handleDeleteCamera(cam.id)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
