import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { X, UploadCloud, Loader2 } from "lucide-react";
import { createBannerAPI, updateBannerAPI } from "@/utils/api";

const POSITIONS = ["HOME_TOP", "HOME_MIDDLE", "HOME_BOTTOM", "CATEGORY", "PRODUCT", "APP_POPUP"];
const ACTION_TYPES = ["NONE", "PRODUCT", "CATEGORY", "BRAND", "URL", "SEARCH"];

interface BannerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  banner?: any;
}

export default function BannerFormModal({ isOpen, onClose, onSuccess, banner }: BannerFormModalProps) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    position: "HOME_TOP",
    priority: "0",
    actionType: "NONE",
    actionUrl: "",
    productId: "",
    categoryId: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [mobileImageFile, setMobileImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mobileImagePreview, setMobileImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title || "",
        subtitle: banner.subtitle || "",
        position: banner.position || "HOME_TOP",
        priority: banner.priority?.toString() || "0",
        actionType: banner.actionType || "NONE",
        actionUrl: banner.actionUrl || "",
        productId: banner.productId || "",
        categoryId: banner.categoryId || "",
      });
      setImagePreview(banner.image?.url || null);
      setMobileImagePreview(banner.mobileImage?.url || null);
      setImageFile(null);
      setMobileImageFile(null);
    } else {
      setFormData({
        title: "",
        subtitle: "",
        position: "HOME_TOP",
        priority: "0",
        actionType: "NONE",
        actionUrl: "",
        productId: "",
        categoryId: "",
      });
      setImagePreview(null);
      setMobileImagePreview(null);
      setImageFile(null);
      setMobileImageFile(null);
    }
  }, [banner, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, isMobile: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isMobile) {
        setMobileImageFile(file);
        setMobileImagePreview(URL.createObjectURL(file));
      } else {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banner && !imageFile) {
      toast.error("Desktop image is required");
      return;
    }

    setLoading(true);
    const data = new FormData();
    data.append("title", formData.title);
    data.append("subtitle", formData.subtitle);
    data.append("position", formData.position);
    data.append("priority", formData.priority);
    data.append("actionType", formData.actionType);
    if (formData.actionUrl) data.append("actionUrl", formData.actionUrl);
    if (formData.productId) data.append("productId", formData.productId);
    if (formData.categoryId) data.append("categoryId", formData.categoryId);

    if (imageFile) data.append("image", imageFile);
    if (mobileImageFile) data.append("mobileImage", mobileImageFile);

    try {
      let res;
      if (banner) {
        res = await updateBannerAPI(banner.id, data);
      } else {
        res = await createBannerAPI(data);
      }

      if (res?.success) {
        toast.success(`Banner ${banner ? "updated" : "created"} successfully`);
        onSuccess();
        onClose();
      } else {
        toast.error(res?.message || "Operation failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--card)] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl border border-[var(--border)]">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)] sticky top-0 bg-[var(--card)] z-10">
          <h2 className="text-xl font-bold">{banner ? "Edit Banner" : "Create New Banner"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--surface-2)] rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Title</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface-2)] border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Enter banner title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Subtitle (Optional)</label>
              <input
                type="text"
                name="subtitle"
                value={formData.subtitle}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface-2)] border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Enter banner subtitle"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Position</label>
              <select
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface-2)] border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
              >
                {POSITIONS.map(p => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Priority (0 is lowest)</label>
              <input
                type="number"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface-2)] border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Action Type</label>
              <select
                name="actionType"
                value={formData.actionType}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-[var(--surface-2)] border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
              >
                {ACTION_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {formData.actionType === "URL" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold">Action URL</label>
                <input
                  type="text"
                  name="actionUrl"
                  required
                  value={formData.actionUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--surface-2)] border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="https://example.com"
                />
              </div>
            )}
            {formData.actionType === "PRODUCT" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold">Product ID</label>
                <input
                  type="text"
                  name="productId"
                  required
                  value={formData.productId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--surface-2)] border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Paste Product ID here"
                />
              </div>
            )}
            {formData.actionType === "CATEGORY" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold">Category ID</label>
                <input
                  type="text"
                  name="categoryId"
                  required
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--surface-2)] border border-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Paste Category ID here"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Desktop Image */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Desktop Image {banner ? "" : "*"}</label>
              <div className="relative group border-2 border-dashed border-[var(--border)] rounded-2xl overflow-hidden hover:border-primary/50 transition-colors h-48 bg-[var(--surface-2)] flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Desktop Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-[var(--foreground-muted)]">
                    <UploadCloud className="mx-auto mb-2 opacity-50" size={32} />
                    <span className="text-sm">Click to upload desktop</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, false)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Mobile Image */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Mobile Image (Optional)</label>
              <div className="relative group border-2 border-dashed border-[var(--border)] rounded-2xl overflow-hidden hover:border-primary/50 transition-colors h-48 bg-[var(--surface-2)] flex items-center justify-center">
                {mobileImagePreview ? (
                  <img src={mobileImagePreview} alt="Mobile Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-[var(--foreground-muted)]">
                    <UploadCloud className="mx-auto mb-2 opacity-50" size={32} />
                    <span className="text-sm">Click to upload mobile</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, true)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--border)] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center disabled:opacity-50"
            >
              {loading && <Loader2 size={18} className="mr-2 animate-spin" />}
              {banner ? "Update Banner" : "Create Banner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
