"use client";

import { useEffect, useState, useRef } from "react";
import {
  getAdminProducts,
  deleteProduct,
  createProduct,
  updateProduct,
  getAllCategories,
} from "@/utils/adminApi";
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Star,
  Package,
  X,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Upload,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import clsx from "clsx";

interface Product {
  id: string;
  title: string;
  description: string;
  sellingPrice: number;
  costPrice: number;
  offerPrice: number;
  brand: string;
  itemLeft: number;
  isOfferActive: boolean;
  categoryId: string;
  averageRating: number;
  totalReviews: number;
  files: { url: string }[];
  _count: { orderItems: number };
}

interface Category {
  id: string;
  name: string;
}

const EMPTY_FORM = {
  title: "",
  description: "",
  sellingPrice: "",
  costPrice: "",
  offerPrice: "",
  brand: "",
  itemLeft: "",
  isOfferActive: false,
  categoryId: "",
};

// ── Shared classes ──────────────────────────────────────────────────────────
const inputClass =
  "w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] transition-colors";

const labelClass =
  "text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest block mb-1.5";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async (pg = page) => {
    setLoading(true);
    const res = await getAdminProducts(pg, 10);
    if (res.success) {
      setProducts(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotalProducts(res.totalProducts || 0);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const res = await getAllCategories();
    if (res.success) setCategories(res.data || []);
  };

  useEffect(() => {
    fetchProducts(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    setEditProduct(null);
    setFormData(EMPTY_FORM);
    setImageFiles([]);
    setImagePreviews([]);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setFormData({
      title: p.title,
      description: p.description,
      sellingPrice: String(p.sellingPrice),
      costPrice: String(p.costPrice),
      offerPrice: String(p.offerPrice),
      brand: p.brand,
      itemLeft: String(p.itemLeft),
      isOfferActive: p.isOfferActive,
      categoryId: p.categoryId,
    });
    setImageFiles([]);
    setImagePreviews(p.files?.map(f => f.url) || []);
    setModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (!newFiles.length) return;

    setImageFiles((prev) => {
      const combined = [...prev, ...newFiles];
      return combined.slice(0, 4);
    });

    setImagePreviews((prev) => {
      const newUrls = newFiles.map((file) => URL.createObjectURL(file));
      const combined = [...prev, ...newUrls];
      return combined.slice(0, 4);
    });
  };

  const removeImage = (indexToRemove: number) => {
    // If it's an existing image, it is in previews but not in imageFiles (or it is before imageFiles)
    // To handle properly, we assume imageFiles are added AFTER existing previews.
    const existingPreviewsCount = imagePreviews.length - imageFiles.length;
    
    setImagePreviews((prev) => prev.filter((_, i) => i !== indexToRemove));
    
    if (indexToRemove >= existingPreviewsCount) {
      // It's a newly added file
      setImageFiles((prev) => prev.filter((_, i) => i !== (indexToRemove - existingPreviewsCount)));
    } else {
      // NOTE: In a fully complete system we would also track which existing images to delete from backend.
      // For now, it just removes it from the UI preview.
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.title.trim() ||
      !formData.sellingPrice ||
      !formData.costPrice ||
      !formData.offerPrice ||
      !formData.brand.trim() ||
      !formData.itemLeft ||
      !formData.categoryId
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    if (Number(formData.costPrice) >= Number(formData.sellingPrice)) {
      toast.error("Cost price must be less than selling price");
      return;
    }
    if (Number(formData.costPrice) >= Number(formData.offerPrice)) {
      toast.error("Cost price must be less than offer price");
      return;
    }
    if (Number(formData.offerPrice) > Number(formData.sellingPrice)) {
      toast.error("Offer price must be less than or equal to selling price");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", formData.title.trim());
      fd.append("description", formData.description.trim());
      fd.append("sellingPrice", formData.sellingPrice);
      fd.append("costPrice", formData.costPrice);
      fd.append("offerPrice", formData.offerPrice);
      fd.append("brand", formData.brand.trim());
      fd.append("itemLeft", formData.itemLeft);
      fd.append("isOfferActive", String(formData.isOfferActive));
      fd.append("categoryId", formData.categoryId);
      imageFiles.forEach((file) => fd.append("files", file));

      const res = editProduct
        ? await updateProduct(editProduct.id, fd)
        : await createProduct(fd);

      if (res.success) {
        toast.success(
          editProduct ? "Product updated!" : "Product created!"
        );
        setModalOpen(false);
        fetchProducts(page);
      } else {
        toast.error(res.message || "Something went wrong");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeletingId(id);
    const res = await deleteProduct(id);
    if (res.success) {
      toast.success("Product deleted");
      fetchProducts(page);
    } else {
      toast.error(res.message || "Delete failed");
    }
    setDeletingId(null);
  };

  const filtered = search.trim()
    ? products.filter((p) =>
        p.title.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tight">
            Products
          </h1>
          <p className="text-[var(--foreground-muted)] text-sm mt-1">
            {totalProducts} products total
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchProducts(page)}
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
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────────── */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-11 pr-4 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] transition-colors"
        />
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Package size={44} className="text-[var(--foreground-muted)] opacity-30" />
            <p className="text-[var(--foreground-muted)] font-medium text-sm">No products found</p>
            <button
              onClick={openCreate}
              className="text-emerald-500 text-sm font-semibold hover:underline"
            >
              Add your first product →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Product", "Category", "Price", "Stock", "Rating", "Sales", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className={clsx(
                          "text-left px-4 py-3.5 text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest",
                          h === "Category" && "hidden md:table-cell",
                          h === "Stock" && "hidden sm:table-cell",
                          h === "Rating" && "hidden lg:table-cell",
                          h === "Sales" && "hidden lg:table-cell",
                          h === "" && "text-right"
                        )}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-[var(--surface-2)] transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--surface-3)] overflow-hidden flex-shrink-0 border border-[var(--border)] flex items-center justify-center">
                          {p.files?.[0]?.url ? (
                            <Image
                              src={p.files[0].url}
                              alt={p.title}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package size={16} className="text-[var(--foreground-muted)]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--foreground)] truncate max-w-[150px] sm:max-w-[200px]">
                            {p.title}
                          </p>
                          <p className="text-[10px] sm:text-xs text-[var(--foreground-muted)] truncate max-w-[150px] sm:max-w-[200px]">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="px-2 py-1 rounded-md bg-[var(--surface-3)] text-[var(--foreground-muted)] text-xs font-semibold">
                        {categories.find((c) => c.id === p.categoryId)?.name || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-emerald-500">
                        ₹{Number(p.sellingPrice).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className={clsx(
                          "font-bold text-sm",
                          p.itemLeft <= 5
                            ? "text-rose-500"
                            : p.itemLeft <= 20
                            ? "text-amber-500"
                            : "text-[var(--foreground)]"
                        )}
                      >
                        {p.itemLeft}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Star size={13} className="text-amber-400 fill-amber-400" />
                        <span className="text-[var(--foreground)] font-bold text-xs">
                          {Number(p.averageRating).toFixed(1)}
                        </span>
                        <span className="text-[var(--foreground-muted)] text-[10px] font-semibold">
                          ({p.totalReviews})
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-[var(--foreground-muted)] text-xs font-bold">
                        {p._count?.orderItems ?? 0} sold
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1.5 justify-end opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-2 rounded-lg bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors border border-[var(--border)]"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="p-2 rounded-lg bg-[var(--surface-2)] hover:bg-rose-500/10 text-[var(--foreground-muted)] hover:text-rose-500 transition-colors border border-[var(--border)] hover:border-rose-500/30"
                        >
                          {deletingId === p.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ──────────────────────────────────────────── */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--foreground-muted)]">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-2)] transition-all disabled:opacity-30"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-2)] transition-all disabled:opacity-30"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl max-h-[92dvh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--card)] z-10">
              <h2 className="text-base font-bold text-[var(--foreground)]">
                {editProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Image Upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelClass.replace("mb-1.5", "")}>Product Images (Up to 4)</label>
                  <span className="text-[10px] font-bold text-[var(--foreground-muted)]">{imagePreviews.length}/4</span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative w-full aspect-square border border-[var(--border-2)] rounded-xl overflow-hidden group bg-[var(--surface-2)]">
                      <Image
                        src={preview}
                        alt={`preview-${index}`}
                        fill
                        className="object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(index);
                        }}
                        className="absolute top-1 right-1 p-1 bg-black/60 backdrop-blur-sm text-white rounded-lg hover:bg-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  
                  {imagePreviews.length < 4 && (
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="relative w-full aspect-square border-2 border-dashed border-[var(--border-2)] rounded-xl cursor-pointer hover:border-emerald-500/50 transition-colors flex items-center justify-center bg-[var(--surface-2)]"
                    >
                      <div className="text-center p-2">
                        <Upload size={18} className="text-[var(--foreground-muted)] mx-auto mb-1" />
                        <p className="text-[10px] font-semibold text-[var(--foreground-muted)]">
                          Add Image
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageChange}
                  value="" // Ensure we can re-select the same file if needed
                />
              </div>

              {/* Title */}
              <div>
                <label className={labelClass}>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Product title"
                  className={inputClass}
                />
              </div>

              {/* Description */}
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Product description"
                  rows={2}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className={labelClass}>Selling Price (₹) *</label>
                  <input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData((f) => ({ ...f, sellingPrice: e.target.value }))}
                    placeholder="0"
                    min={0}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Cost Price (₹) *</label>
                  <input
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) => setFormData((f) => ({ ...f, costPrice: e.target.value }))}
                    placeholder="0"
                    min={0}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Offer Price (₹) *</label>
                  <input
                    type="number"
                    value={formData.offerPrice}
                    onChange={(e) => setFormData((f) => ({ ...f, offerPrice: e.target.value }))}
                    placeholder="0"
                    min={0}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Brand & Stock */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className={labelClass}>Brand *</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData((f) => ({ ...f, brand: e.target.value }))}
                    placeholder="Brand name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Stock (Items Left) *</label>
                  <input
                    type="number"
                    value={formData.itemLeft}
                    onChange={(e) => setFormData((f) => ({ ...f, itemLeft: e.target.value }))}
                    placeholder="0"
                    min={0}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Is Offer Active */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isOfferActive"
                  checked={formData.isOfferActive}
                  onChange={(e) => setFormData((f) => ({ ...f, isOfferActive: e.target.checked }))}
                  className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="isOfferActive" className="text-sm font-semibold text-[var(--foreground)] cursor-pointer">
                  Is Offer Active
                </label>
              </div>

              {/* Category */}
              <div>
                <label className={labelClass}>Category *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData((f) => ({ ...f, categoryId: e.target.value }))}
                  className={`${inputClass} appearance-none cursor-pointer`}
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[var(--surface)]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer */}
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
                {saving && <Loader2 size={15} className="animate-spin" />}
                {editProduct ? "Save Changes" : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}