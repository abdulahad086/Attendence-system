import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cpu, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // OAuth2 expects x-www-form-urlencoded
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)

    try {
      const res = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      
      // Store token, user, and redirect
      localStorage.setItem('auth_token', res.data.access_token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      toast.success('Login successful!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-800 border border-surface-600 rounded-2xl shadow-2xl p-8 transform transition-all animate-fade-in">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mb-4">
            <Cpu size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to AttendAI</h1>
          <p className="text-sm text-gray-400 mt-2">Sign in to your organization workspace</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-900 border border-surface-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder-gray-500"
              placeholder="admin@school.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-900 border border-surface-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder-gray-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={20} />
                Sign In
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
