import React, { useState } from 'react'
import { Plus, Edit2, Trash2, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { useAddAddressMutation, useUpdateAddressMutation, useDeleteAddressMutation } from '@/redux/services/profileApi'

export default function ManageAddresses({ addresses }: { addresses: any[] }) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    line1: '', line2: '', city: '', pincode: '', phoneNumber1: '', phoneNumber2: '', landmark: ''
  })

  const [addAddress, { isLoading: isAddingAddr }] = useAddAddressMutation()
  const [updateAddress, { isLoading: isUpdating }] = useUpdateAddressMutation()
  const [deleteAddress, { isLoading: isDeleting }] = useDeleteAddressMutation()

  const handleEdit = (addr: any) => {
    setEditingId(addr.id)
    setFormData({
      line1: addr.line1, line2: addr.line2 || '', city: addr.city,
      pincode: addr.pincode, phoneNumber1: addr.phoneNumber1,
      phoneNumber2: addr.phoneNumber2 || '', landmark: addr.landmark || ''
    })
    setIsAdding(false)
  }

  const handleAddNew = () => {
    setIsAdding(true)
    setEditingId(null)
    setFormData({ line1: '', line2: '', city: '', pincode: '', phoneNumber1: '', phoneNumber2: '', landmark: '' })
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await updateAddress({ addressId: editingId, data: formData }).unwrap()
        toast.success("Address updated successfully")
      } else {
        await addAddress(formData).unwrap()
        toast.success("Address added successfully")
      }
      handleCancel()
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save address")
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return
    try {
      await deleteAddress(id).unwrap()
      toast.success("Address deleted successfully")
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete address")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--foreground)]">Saved Addresses</h2>
        {(!isAdding && !editingId) && (
          <button onClick={handleAddNew} className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors font-medium text-sm">
            <Plus size={16} /> Add New
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <form onSubmit={handleSave} className="bg-[var(--surface-2)] p-6 rounded-2xl border border-[var(--border)] space-y-4">
          <h3 className="font-semibold mb-4 text-[var(--foreground)]">{editingId ? 'Edit Address' : 'Add New Address'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--foreground-muted)] mb-1">Address Line 1 *</label>
              <input required value={formData.line1} onChange={(e)=>setFormData({...formData, line1: e.target.value})} className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--foreground)] outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm text-[var(--foreground-muted)] mb-1">Address Line 2</label>
              <input value={formData.line2} onChange={(e)=>setFormData({...formData, line2: e.target.value})} className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--foreground)] outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm text-[var(--foreground-muted)] mb-1">City *</label>
              <input required value={formData.city} onChange={(e)=>setFormData({...formData, city: e.target.value})} className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--foreground)] outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm text-[var(--foreground-muted)] mb-1">Pincode *</label>
              <input required type="number" value={formData.pincode} onChange={(e)=>setFormData({...formData, pincode: e.target.value})} className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--foreground)] outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm text-[var(--foreground-muted)] mb-1">Phone Number *</label>
              <input required type="tel" value={formData.phoneNumber1} onChange={(e)=>setFormData({...formData, phoneNumber1: e.target.value})} className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--foreground)] outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm text-[var(--foreground-muted)] mb-1">Alternate Phone</label>
              <input type="tel" value={formData.phoneNumber2} onChange={(e)=>setFormData({...formData, phoneNumber2: e.target.value})} className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--foreground)] outline-none focus:border-primary" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-[var(--foreground-muted)] mb-1">Landmark</label>
              <input value={formData.landmark} onChange={(e)=>setFormData({...formData, landmark: e.target.value})} className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--foreground)] outline-none focus:border-primary" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={handleCancel} className="px-5 py-2 rounded-xl text-gray-600 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">Cancel</button>
            <button type="submit" disabled={isAddingAddr || isUpdating} className="px-5 py-2 rounded-xl text-white bg-primary hover:bg-primary-hover transition-colors disabled:opacity-50">
              {isAddingAddr || isUpdating ? 'Saving...' : 'Save Address'}
            </button>
          </div>
        </form>
      )}

      {(!isAdding && !editingId) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses?.length > 0 ? addresses.map((addr) => (
            <div key={addr.id} className="border border-[var(--border)] bg-[var(--card)] rounded-2xl p-5 hover:shadow-md transition-shadow relative group">
              <div className="flex items-start gap-3">
                <MapPin className="text-primary shrink-0 mt-1" size={20} />
                <div className="flex-1">
                  <p className="font-medium text-[var(--foreground)] leading-tight">{addr.line1}</p>
                  {addr.line2 && <p className="text-[var(--foreground-muted)] text-sm mt-1">{addr.line2}</p>}
                  <p className="text-[var(--foreground-muted)] text-sm mt-1">{addr.city}, {addr.pincode}</p>
                  <p className="text-[var(--foreground-muted)] text-sm mt-2 font-medium">Ph: {addr.phoneNumber1}</p>
                </div>
              </div>
              
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(addr)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(addr.id)} disabled={isDeleting} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-8 text-center text-[var(--foreground-muted)] bg-[var(--surface-2)] rounded-2xl border border-dashed border-[var(--border)]">
              <MapPin size={32} className="mx-auto mb-2 opacity-50" />
              <p>No addresses found. Add one to checkout easily.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
