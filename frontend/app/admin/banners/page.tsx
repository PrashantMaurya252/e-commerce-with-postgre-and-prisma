"use client";

import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Image as ImageIcon } from "lucide-react";
import { getAdminBannersAPI, deleteBannerAPI, toggleBannerStatusAPI } from "@/utils/api";
import { toast } from "sonner";
import ConfirmModal from "@/components/ui/ConfirmModal";
import BannerFormModal from "@/components/admin/BannerFormModal";

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<any>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchBanners = async () => {
    setLoading(true);
    const res = await getAdminBannersAPI({ limit: 100 });
    if (res?.success) {
      setBanners(res.data);
    } else {
      toast.error("Failed to load banners");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleEdit = (banner: any) => {
    setSelectedBanner(banner);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedBanner(null);
    setIsFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await deleteBannerAPI(deleteId);
      if (res?.success) {
        toast.success("Banner deleted successfully");
        fetchBanners();
      } else {
        toast.error(res?.message || "Failed to delete banner");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteId(null);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await toggleBannerStatusAPI(id);
      if (res?.success) {
        toast.success("Status updated");
        fetchBanners();
      } else {
        toast.error(res?.message || "Failed to update status");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Banner Management</h1>
          <p className="text-[var(--foreground-muted)] text-sm mt-1">
            Create and manage dynamic banners for your storefront
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus size={18} /> Add Banner
        </button>
      </div>

      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--surface-2)] border-b border-[var(--border)] text-sm font-semibold text-[var(--foreground-muted)]">
                <th className="py-4 px-6 whitespace-nowrap">Image</th>
                <th className="py-4 px-6 whitespace-nowrap">Details</th>
                <th className="py-4 px-6 whitespace-nowrap">Position & Priority</th>
                <th className="py-4 px-6 whitespace-nowrap">Action Type</th>
                <th className="py-4 px-6 whitespace-nowrap">Status</th>
                <th className="py-4 px-6 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
                  </td>
                </tr>
              ) : banners.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--foreground-muted)]">
                    <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
                    No banners found. Create one to get started!
                  </td>
                </tr>
              ) : (
                banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="py-4 px-6">
                      <div className="w-24 h-16 rounded-lg overflow-hidden bg-[var(--surface-3)] border border-[var(--border)]">
                        <img src={banner.image?.url} alt="Banner" className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-[var(--foreground)] truncate max-w-[200px]">
                        {banner.title}
                      </p>
                      {banner.subtitle && (
                        <p className="text-xs text-[var(--foreground-muted)] truncate max-w-[200px]">
                          {banner.subtitle}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex w-max items-center px-2 py-1 rounded text-xs font-semibold bg-primary/10 text-primary">
                          {banner.position.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-[var(--foreground-muted)] font-medium">
                          Priority: {banner.priority}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-medium">{banner.actionType}</span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggle(banner.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          banner.isActive ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            banner.isActive ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(banner)}
                          className="p-2 text-[var(--foreground-muted)] hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                          title="Edit Banner"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteId(banner.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-2 text-[var(--foreground-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                          title="Delete Banner"
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

      <BannerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={fetchBanners}
        banner={selectedBanner}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Banner"
        message="Are you sure you want to delete this banner? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
