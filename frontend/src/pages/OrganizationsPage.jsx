import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Building2, UserPlus, CheckCircle2, XCircle, Video, ClipboardList, Users, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { getOrganizations, deleteOrganization, registerOrganization, updateOrganization, resetOrgPassword } from '../utils/api'

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    organization_name: '',
    admin_name: '',
    admin_email: '',
    admin_password: ''
  })
  const [deleteConfirmInfo, setDeleteConfirmInfo] = useState(null)

  const fetchOrgs = async () => {
    try {
      const res = await getOrganizations()
      setOrgs(res.data)
    } catch (err) {
      toast.error('Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrgs()
  }, [])

  const confirmDelete = (id, name) => {
    setDeleteConfirmInfo({ id, name })
  }

  const handleDelete = async () => {
    if (!deleteConfirmInfo) return
    const { id } = deleteConfirmInfo
    
    try {
      await deleteOrganization(id)
      toast.success('Organization deleted successfully')
      setDeleteConfirmInfo(null)
      fetchOrgs()
    } catch (err) {
      let errorMsg = 'Failed to delete organization'
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail[0].msg
        } else {
          errorMsg = err.response.data.detail
        }
      }
      toast.error(errorMsg)
      setDeleteConfirmInfo(null)
    }
  }

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await updateOrganization(id, { is_active: !currentStatus })
      toast.success(`Organization ${!currentStatus ? 'activated' : 'deactivated'}`)
      fetchOrgs()
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  const handleChangePlan = async (id, plan) => {
    try {
      await updateOrganization(id, { subscription_plan: plan })
      toast.success(`Plan updated to ${plan}`)
      fetchOrgs()
    } catch (err) {
      toast.error('Failed to update plan')
    }
  }

  const handleResetPassword = async (id, name, email) => {
    const newPassword = window.prompt(`Enter new password for ${name}'s admin (${email}):`)
    if (!newPassword) return

    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters')
    }

    try {
      const res = await resetOrgPassword(id, newPassword)
      toast.success(res.data.message)
    } catch (err) {
      toast.error('Failed to reset password')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      await registerOrganization(formData)
      toast.success('Organization created successfully!')
      setShowAddForm(false)
      setFormData({
        organization_name: '',
        admin_name: '',
        admin_email: '',
        admin_password: ''
      })
      fetchOrgs()
    } catch (err) {
      let errorMsg = 'Failed to create organization'
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          // FastAPI 422 validation error
          errorMsg = `Validation Error: ${err.response.data.detail[0].msg} (${err.response.data.detail[0].loc.join('.')})`
        } else {
          errorMsg = err.response.data.detail
        }
      }
      toast.error(errorMsg)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="text-primary-400" />
            Organizations
          </h1>
          <p className="text-sm text-gray-400 mt-1">Manage tenant workspaces and administrators</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
        >
          {showAddForm ? 'Cancel' : <><Plus size={16} /> New Organization</>}
        </button>
      </div>

      {deleteConfirmInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-surface-800 border border-surface-600 rounded-2xl shadow-2xl p-6 max-w-md w-full animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-2">Delete Organization</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete <span className="font-bold text-red-400">{deleteConfirmInfo.name}</span>? 
              This will permanently remove all users, cameras, and attendance logs associated with it. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setDeleteConfirmInfo(null)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-300 hover:bg-surface-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} /> Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="card border-l-4 border-l-primary-500 animate-fade-in">
          <h2 className="text-lg font-semibold text-white mb-4">Register New Organization</h2>
          <form onSubmit={handleRegister} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Organization Name</label>
              <input
                required
                value={formData.organization_name}
                onChange={e => setFormData({ ...formData, organization_name: e.target.value })}
                className="input-field"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Admin Name</label>
              <input
                required
                value={formData.admin_name}
                onChange={e => setFormData({ ...formData, admin_name: e.target.value })}
                className="input-field"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Admin Email</label>
              <input
                required
                type="email"
                value={formData.admin_email}
                onChange={e => setFormData({ ...formData, admin_email: e.target.value })}
                className="input-field"
                placeholder="admin@acme.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Admin Password</label>
              <input
                required
                type="password"
                value={formData.admin_password}
                onChange={e => setFormData({ ...formData, admin_password: e.target.value })}
                className="input-field"
                placeholder="••••••••"
              />
            </div>
            <div className="sm:col-span-2 pt-2">
              <button type="submit" className="btn-primary w-full sm:w-auto">
                <UserPlus size={16} /> Register Organization
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-surface-800/50 text-xs uppercase font-semibold text-gray-400 border-b border-surface-600">
              <tr>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Organization</th>
                <th className="px-5 py-4">Administrator</th>
                <th className="px-5 py-4">Plan</th>
                <th className="px-5 py-4">Usage Stats</th>
                <th className="px-5 py-4">Created</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-600/50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-gray-500">Loading organizations...</td>
                </tr>
              ) : orgs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-gray-500">No organizations found.</td>
                </tr>
              ) : (
                orgs.map((org) => (
                  <tr key={org.id} className={`hover:bg-surface-800/30 transition-colors group ${!org.is_active ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                    <td className="px-5 py-4">
                      <button 
                        onClick={() => handleToggleActive(org.id, org.is_active)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors ${org.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}
                      >
                        {org.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {org.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-white">{org.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono uppercase mt-0.5">ID: {org.id}</div>
                    </td>
                    <td className="px-5 py-4">
                      {org.admin ? (
                        <>
                          <div className="text-white font-medium">{org.admin.name}</div>
                          <div className="text-[10px] text-gray-400">{org.admin.email}</div>
                        </>
                      ) : (
                        <div className="text-gray-500 italic">No Admin</div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <select 
                        value={org.subscription_plan}
                        onChange={(e) => handleChangePlan(org.id, e.target.value)}
                        className="bg-surface-900 border border-surface-700 text-xs px-2 py-1 rounded-md text-gray-300 focus:ring-1 focus:ring-primary-500 outline-none"
                      >
                        <option value="Basic">Basic</option>
                        <option value="Standard">Standard</option>
                        <option value="Enterprise">Enterprise</option>
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5" title="Users">
                          <Users size={14} className="text-gray-500" />
                          <span className="text-xs text-gray-300">{org.user_count}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Cameras">
                          <Video size={14} className="text-gray-500" />
                          <span className="text-xs text-gray-300">{org.camera_count}</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Attendance Logs">
                          <ClipboardList size={14} className="text-gray-500" />
                          <span className="text-xs text-gray-300">{org.log_count}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs text-nowrap">
                      {new Date(org.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleResetPassword(org.id, org.name, org.admin?.email)}
                          className="p-2 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Reset Admin Password"
                        >
                          <Lock size={18} />
                        </button>
                        <button
                          onClick={() => confirmDelete(org.id, org.name)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Delete organization"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
