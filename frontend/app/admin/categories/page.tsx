"use client";

import { useEffect, useState, useRef } from "react";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/utils/adminApi";
import {
  Plus,
  Tag,
  Edit3,
  Trash2,
  X,
  Upload,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  _count?: { products: number };
}

const EMPTY_FORM = { name: "", description: "" };

const inputClass =
  "w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] transition-colors";

const labelClass =
  "text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest block mb-1.5";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchCategories = async () => {
    setLoading(true);
    const res = await getAllCategories();
    if (res.success) setCategories(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    setEditCat(null);
    setFormData(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditCat(cat);
    setFormData({ name: cat.name, description: cat.description || "" });
    setImageFile(null);
    setImagePreview(cat.imageUrl || "");
    setModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", formData.name.trim());
      if (formData.description) fd.append("description", formData.description);
      if (imageFile) fd.append("file", imageFile);

      const res = editCat
        ? await updateCategory(editCat.id, fd)
        : await createCategory(fd);

      if (res.success) {
        toast.success(editCat ? "Category updated!" : "Category created!");
        setModalOpen(false);
        fetchCategories();
      } else {
        toast.error(res.message || "Something went wrong");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Products will be uncategorized.")) return;
    setDeletingId(id);
    const res = await deleteCategory(id);
    if (res.success) {
      toast.success("Category deleted");
      fetchCategories();
    } else {
      toast.error(res.message || "Delete failed");
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tight">
            Categories
          </h1>
          <p className="text-[var(--foreground-muted)] text-sm mt-1">
            {categories.length} categories total
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchCategories}
            className="p-2.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground-muted)] border border-[var(--border)] transition-all"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus size={16} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-[var(--surface-2)] animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--card)]">
          <Tag size={44} className="text-[var(--foreground-muted)] opacity-30" />
          <p className="text-[var(--foreground-muted)] font-medium text-sm">No categories yet</p>
          <button
            onClick={openCreate}
            className="text-emerald-500 text-sm font-semibold hover:underline"
          >
            Create your first category →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="relative rounded-2xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden group hover:border-[var(--border-2)] transition-all duration-300 shadow-sm hover:shadow-md"
            >
              {/* Cover Image */}
              <div className="h-32 sm:h-36 bg-[var(--surface-2)] relative overflow-hidden">
                {cat.imageUrl ? (
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Tag size={32} className="text-[var(--foreground-muted)] opacity-50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.8)] dark:from-[var(--card)] via-transparent to-transparent" />
              </div>

              {/* Info */}
              <div className="p-4 relative">
                <h3 className="font-bold text-[var(--foreground)] dark:text-[var(--foreground)] text-[white] sm:text-sm text-sm -mt-[34px] sm:-mt-[34px] drop-shadow-md z-10 block pb-2">{cat.name}</h3>
                
                {cat.description && (
                  <p className="text-[var(--foreground-muted)] text-xs line-clamp-2">
                    {cat.description}
                  </p>
                )}
                {cat._count !== undefined && (
                  <span className="inline-block mt-2.5 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-wider">
                    {cat._count.products} items
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="absolute top-3 right-3 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-2 rounded-lg bg-[rgba(0,0,0,0.6)] backdrop-blur-md text-white hover:bg-[rgba(0,0,0,0.8)] transition-colors shadow-sm"
                >
                  <Edit3 size={13} />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  disabled={deletingId === cat.id}
                  className="p-2 rounded-lg bg-[rgba(0,0,0,0.6)] backdrop-blur-md text-white hover:text-rose-400 hover:bg-[rgba(0,0,0,0.8)] transition-colors shadow-sm"
                >
                  {deletingId === cat.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl max-h-[92dvh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--card)] z-10">
              <h2 className="text-base font-bold text-[var(--foreground)]">
                {editCat ? "Edit Category" : "Add Category"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Image Upload */}
              <div>
                <label className={labelClass}>Category Image</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="relative w-full h-32 border-2 border-dashed border-[var(--border-2)] rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors flex items-center justify-center overflow-hidden bg-[var(--surface-2)]"
                >
                  {imagePreview ? (
                    <Image
                      src={imagePreview}
                      alt="preview"
                      fill
                      className="object-cover rounded-xl"
                    />
                  ) : (
                    <div className="text-center">
                      <Upload size={20} className="text-[var(--foreground-muted)] mx-auto mb-1.5" />
                      <p className="text-xs font-semibold text-[var(--foreground-muted)]">Click to upload image</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              {/* Name */}
              <div>
                <label className={labelClass}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Category name"
                  className={inputClass}
                />
              </div>

              {/* Description */}
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Short description (optional)"
                  rows={2}
                  className={`${inputClass} resize-none`}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[var(--border)]">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {editCat ? "Save Changes" : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
