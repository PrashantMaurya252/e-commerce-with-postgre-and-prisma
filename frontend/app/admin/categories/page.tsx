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
  AlertCircle,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Categories
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {categories.length} categories total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCategories}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-all"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus size={17} />
            Add Category
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-2xl border border-slate-800 bg-slate-900">
          <Tag size={48} className="text-slate-700" />
          <p className="text-slate-500 font-medium">No categories yet</p>
          <button
            onClick={openCreate}
            className="text-emerald-400 text-sm font-semibold hover:underline"
          >
            Create your first category →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="relative rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden group hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:shadow-slate-900/50"
            >
              {/* Cover Image */}
              <div className="h-36 bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden">
                {cat.imageUrl ? (
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Tag size={36} className="text-slate-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-white text-sm">{cat.name}</h3>
                {cat.description && (
                  <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">
                    {cat.description}
                  </p>
                )}
                {cat._count !== undefined && (
                  <span className="inline-block mt-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                    {cat._count.products} products
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(cat)}
                  className="p-2 rounded-lg bg-slate-900/90 backdrop-blur-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors shadow-lg"
                >
                  <Edit3 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  disabled={deletingId === cat.id}
                  className="p-2 rounded-lg bg-slate-900/90 backdrop-blur-sm text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shadow-lg"
                >
                  {deletingId === cat.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">
                {editCat ? "Edit Category" : "Add Category"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Image Upload */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Category Image
                </label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="relative w-full h-36 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors flex items-center justify-center overflow-hidden bg-slate-800/50"
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
                      <Upload size={24} className="text-slate-500 mx-auto mb-1" />
                      <p className="text-xs text-slate-500">Click to upload image</p>
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
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Category name"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm text-white placeholder-slate-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Short description (optional)"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm text-white placeholder-slate-500 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60"
              >
                {saving && <Loader2 size={15} className="animate-spin" />}
                {editCat ? "Save Changes" : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
