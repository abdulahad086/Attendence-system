import React, { useRef, useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Video, VideoOff, Zap, User, AlertCircle } from 'lucide-react'

const getWsUrl = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
  if (apiBaseUrl) {
    // Convert https://... to wss://...
    return apiBaseUrl.replace(/^http/, 'ws') + '/ws/camera'
  }
  return `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/camera`
}

const WS_URL = getWsUrl()

export default function LiveCamera() {
  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const wsRef      = useRef(null)
  const intervalRef = useRef(null)
  const streamRef  = useRef(null)

  const [active, setActive]     = useState(false)
  const [results, setResults]   = useState([])
  const [fps, setFps]           = useState(0)
  const [error, setError]       = useState(null)
  const [frameCount, setFc]     = useState(0)

  // FPS counter
  useEffect(() => {
    const timer = setInterval(() => {
      setFps(fc => { const f = fc; setFc(0); return f })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const sendFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const ws = wsRef.current
    if (!video || !canvas || !ws || ws.readyState !== WebSocket.OPEN) return

    canvas.width  = video.videoWidth  || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    const b64 = canvas.toDataURL('image/jpeg', 0.7)

    ws.send(JSON.stringify({ frame: b64 }))
    setFc(c => c + 1)
  }, [])

  const startCamera = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } 
      })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()

      // Open WebSocket
      const token = localStorage.getItem('auth_token') || ''
      const ws = new WebSocket(`${WS_URL}?token=${token}`)
      wsRef.current = ws

      ws.onopen = () => {
        setActive(true)
        toast.success('Camera connected')
        // Send a frame every 500ms (2fps) to avoid overloading CPU
        intervalRef.current = setInterval(sendFrame, 500)
      }

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.results) {
            setResults(data.results)
            // Overlay the annotated frame if provided
            if (data.annotated_frame && canvasRef.current) {
              const img = new Image()
              img.onload = () => {
                const ctx = canvasRef.current.getContext('2d')
                canvasRef.current.width = img.width
                canvasRef.current.height = img.height
                ctx.drawImage(img, 0, 0)
              }
              img.src = data.annotated_frame
            }
          }
        } catch { /* ignore */ }
      }

      ws.onerror = () => {
        setError('WebSocket connection failed. Is the backend running?')
        stopCamera()
      }

      ws.onclose = () => {
        if (active) toast('Camera disconnected', { icon: '📷' })
        setActive(false)
      }
    } catch (err) {
      setError(`Camera error: ${err.message}`)
    }
  }, [sendFrame, active])

  const stopCamera = useCallback(() => {
    clearInterval(intervalRef.current)
    if (wsRef.current) wsRef.current.close()
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    setActive(false)
    setResults([])
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  const statusColor = (s) => {
    if (s === 'present') return 'text-primary-400'
    if (s === 'late') return 'text-amber-400'
    if (s === 'already_marked') return 'text-indigo-400'
    return 'text-gray-400'
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Live Camera</h1>
        <p className="text-sm text-gray-400 mt-1">Real-time face recognition and attendance marking</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Camera feed */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div className="relative bg-surface-900 aspect-video">
            <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
            {!active && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <VideoOff size={48} className="text-gray-600" />
                <p className="text-gray-500 text-sm">Camera inactive</p>
              </div>
            )}
            {active && (
              <>
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/60 backdrop-blur rounded-lg px-2.5 py-1.5 text-xs text-white">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  LIVE
                </div>
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur rounded-lg px-2.5 py-1.5 text-xs font-mono text-gray-300">
                  {fps} fps
                </div>
              </>
            )}
          </div>

          <div className="p-4 flex gap-3">
            <button
              onClick={active ? stopCamera : startCamera}
              className={active ? 'btn-danger flex-1 justify-center' : 'btn-primary flex-1 justify-center'}
            >
              {active ? (<><VideoOff size={15} /> Stop Camera</>) : (<><Video size={15} /> Start Camera</>)}
            </button>
          </div>
        </div>

        {/* Results panel */}
        <div className="card flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Zap size={15} className="text-primary-400" />
            <h2 className="font-semibold text-white text-sm">Recognition Results</h2>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs text-red-400">
              <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {results.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
              <User size={32} className="text-gray-700 mb-2" />
              <p className="text-gray-500 text-sm">No faces detected</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto max-h-96">
              {results.map((r, i) => (
                <div key={i} className="bg-surface-700 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white text-sm">{r.name}</span>
                    <span className={`text-xs font-medium ${statusColor(r.status)}`}>{r.status}</span>
                  </div>
                  {r.similarity != null && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-surface-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-300"
                          style={{ width: `${(r.similarity * 100).toFixed(0)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 font-mono">
                        {(r.similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
