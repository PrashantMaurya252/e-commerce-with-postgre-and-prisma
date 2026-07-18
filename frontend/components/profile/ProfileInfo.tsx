import React, { useState } from 'react'
import { User, Mail, ShieldCheck, Edit2, Save, X } from 'lucide-react'
import { useUpdateProfileMutation } from '@/redux/services/profileApi'
import { toast } from 'sonner'
import { useDispatch } from 'react-redux'
import { updateUser } from '@/redux/slices/authSlice'

export default function ProfileInfo({ user }: { user: any }) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [updateProfile, { isLoading }] = useUpdateProfileMutation()
  const dispatch = useDispatch()

  const handleSave = async () => {
    if (!name.trim()) return toast.error("Name cannot be empty")
    try {
      const res = await updateProfile({ name }).unwrap()
      dispatch(updateUser({ ...user, name: res.data.name }))
      toast.success("Profile updated successfully")
      setIsEditing(false)
    } catch (error) {
      toast.error("Failed to update profile")
    }
  }

  return (
    <div className="glass rounded-2xl p-6 md:p-8 border border-[var(--border)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
        <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary border-4 border-[var(--background)] shadow-lg shrink-0">
          <User size={48} />
        </div>
        
        <div className="space-y-4 flex-1 w-full">
          {!isEditing ? (
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-[var(--foreground)]">{user?.name || "User"}</h2>
                <div className="flex items-center gap-2 text-[var(--foreground-muted)] mt-1">
                  <Mail size={16} />
                  <span>{user?.email || "No email available"}</span>
                </div>
              </div>
              <button onClick={() => setIsEditing(true)} className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
                <Edit2 size={20} />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground-muted)] mb-1">Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--foreground)] focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={isLoading} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-hover transition-colors">
                  <Save size={16} /> {isLoading ? "Saving..." : "Save"}
                </button>
                <button onClick={() => { setIsEditing(false); setName(user?.name || '') }} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors">
                  <X size={16} /> Cancel
                </button>
              </div>
            </div>
          )}
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface-2)] rounded-full text-sm font-medium text-[var(--foreground)] border border-[var(--border)] mt-2">
            <ShieldCheck size={16} className="text-emerald-500" />
            Role: {user?.isAdmin ? "Admin" : "Customer"}
          </div>
        </div>
      </div>
    </div>
  )
}
