import React, { useState, useRef, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Users, Plus, Trash2, Camera, X, ChevronRight, Check } from 'lucide-react'
import { getUsers, registerUser, deleteUser } from '../utils/api'

// ── Register Modal ─────────────────────────────────────────────────────────────
function RegisterModal({ onClose, onSuccess }) {
  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const streamRef  = useRef(null)
  const [step, setStep]         = useState(1)  // 1=details, 2=capture, 3=done
  const [form, setForm]         = useState({ name: '', email: '', department: '', role: 'employee' })
  const [captures, setCaptures] = useState([])   // array of base64 strings
  const [loading, setLoading]   = useState(false)
  const [cameraOn, setCameraOn] = useState(false)

  const startCam = useCallback(async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = s
      videoRef.current.srcObject = s
      await videoRef.current.play()
      setCameraOn(true)
    } catch {
      toast.error('Could not access camera')
    }
  }, [])

  const stopCam = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    setCameraOn(false)
  }, [])

  useEffect(() => {
    if (step === 2) startCam()
    return stopCam
  }, [step, startCam, stopCam])

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const b64 = canvas.toDataURL('image/jpeg', 0.85)
    setCaptures(c => [...c, b64])
    toast.success(`Captured ${captures.length + 1}/5`)
  }

  const removeCapture = (i) => setCaptures(c => c.filter((_, idx) => idx !== i))

  const submit = async () => {
    if (captures.length < 1) { toast.error('Capture at least 1 image'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
      // Append each capture as a file blob
      for (const [i, b64] of captures.entries()) {
        const res = await fetch(b64)
        const blob = await res.blob()
        fd.append('images', blob, `face_${i}.jpg`)
      }
      const { data } = await registerUser(fd)
      toast.success(`${data.name} registered with ${data.embeddings_stored} embeddings!`)
      setStep(3)
      setTimeout(() => { onClose(); onSuccess() }, 1200)
    } catch (err) {
      toast.error(err.response?.data?.detail ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-surface-800 border border-surface-600 rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-600">
          <h2 className="font-semibold text-white">Register New User</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-700 text-gray-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Steps */}
        <div className="flex border-b border-surface-600">
          {['Details', 'Capture Faces', 'Done'].map((s, i) => (
            <div key={s} className={`flex-1 py-2.5 text-xs text-center font-medium border-b-2 transition-colors
              ${step === i + 1 ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-500'}`}
            >
              {s}
            </div>
          ))}
        </div>

        <div className="p-5">
          {/* Step 1: Details */}
          {step === 1 && (
            <div className="space-y-3">
              <input className="input" placeholder="Full Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <input className="input" placeholder="Email (optional)" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              <input className="input" placeholder="Department" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
              <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="employee">Employee</option>
                <option value="student">Student</option>
                <option value="admin">Admin</option>
              </select>
              <button
                className="btn-primary w-full justify-center mt-2"
                onClick={() => { if (!form.name.trim()) { toast.error('Name is required'); return } setStep(2) }}
              >
                Next — Capture Face <ChevronRight size={15} />
              </button>
            </div>
          )}

          {/* Step 2: Capture */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="relative bg-surface-900 rounded-xl overflow-hidden aspect-video">
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                <canvas ref={canvasRef} className="hidden" />
                {!cameraOn && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <button className="btn-primary flex-1 justify-center" onClick={capture} disabled={!cameraOn || captures.length >= 5}>
                  <Camera size={15} />
                  Capture ({captures.length}/5)
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {captures.map((b64, i) => (
                  <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden group">
                    <img src={b64} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeCapture(i)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="btn-primary w-full justify-center"
                onClick={submit}
                disabled={loading || captures.length < 1}
              >
                {loading ? 'Registering…' : 'Register & Save Embeddings'}
              </button>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-14 h-14 bg-primary-600/20 rounded-full flex items-center justify-center">
                <Check size={24} className="text-primary-400" />
              </div>
              <p className="text-white font-medium">Registration Successful!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Users Page ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setModal]   = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await getUsers()
      setUsers(data)
    } catch { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove ${name}?`)) return
    try {
      await deleteUser(id)
      toast.success(`${name} removed`)
      load()
    } catch { toast.error('Delete failed') }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-sm text-gray-400 mt-1">{users.length} registered</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <Plus size={15} /> Register User
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : users.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <Users size={36} className="text-gray-700" />
          <p className="text-gray-400">No users registered yet</p>
          <button className="btn-primary text-sm" onClick={() => setModal(true)}>
            <Plus size={14} /> Register First User
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map(u => (
            <div key={u.id} className="card flex flex-col gap-3 animate-slide-up">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center text-primary-400 font-semibold">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.department ?? 'No dept'}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(u.id, u.name)} className="btn-danger p-1.5 border-none bg-transparent hover:bg-red-500/10">
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs bg-surface-700 text-gray-400 px-2 py-0.5 rounded-full capitalize">{u.role}</span>
                <span className="text-xs bg-primary-600/10 text-primary-400 px-2 py-0.5 rounded-full">{u.embedding_count} faces</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <RegisterModal onClose={() => setModal(false)} onSuccess={load} />}
    </div>
  )
}
