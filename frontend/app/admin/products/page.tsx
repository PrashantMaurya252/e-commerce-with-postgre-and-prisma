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
  AlertCircle,
  Upload,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
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
  name: "",
  description: "",
  price: "",
  stock: "",
  categoryId: "",
};

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
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
  }, [page]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    setEditProduct(null);
    setFormData(EMPTY_FORM);
    setImageFile(null);
    setImagePreview("");
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setFormData({
      name: p.name,
      description: p.description,
      price: String(p.price),
      stock: String(p.stock),
      categoryId: p.categoryId,
    });
    setImageFile(null);
    setImagePreview(p.files?.[0]?.url || "");
    setModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (
      !formData.name.trim() ||
      !formData.price ||
      !formData.stock ||
      !formData.categoryId
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", formData.name.trim());
      fd.append("description", formData.description.trim());
      fd.append("price", formData.price);
      fd.append("stock", formData.stock);
      fd.append("categoryId", formData.categoryId);
      if (imageFile) fd.append("file", imageFile);

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
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Products
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {totalProducts} products total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchProducts(page)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 transition-all"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus size={17} />
            Add Product
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm text-slate-200 placeholder-slate-500 transition-colors"
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-emerald-400" size={32} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Package size={48} className="text-slate-700" />
            <p className="text-slate-500 font-medium">No products found</p>
            <button
              onClick={openCreate}
              className="text-emerald-400 text-sm font-semibold hover:underline"
            >
              Add your first product →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                    Category
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                    Stock
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                    Rating
                  </th>
                  <th className="text-left px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                    Sales
                  </th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700">
                          {p.files?.[0]?.url ? (
                            <Image
                              src={p.files[0].url}
                              alt={p.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package
                              size={18}
                              className="m-auto text-slate-600 mt-2.5"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-200 truncate max-w-[180px]">
                            {p.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate max-w-[180px]">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium">
                        {categories.find((c) => c.id === p.categoryId)?.name ||
                          "—"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-emerald-400">
                        ₹{Number(p.price).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span
                        className={`font-semibold text-sm ${
                          p.stock <= 5
                            ? "text-rose-400"
                            : p.stock <= 20
                            ? "text-amber-400"
                            : "text-slate-300"
                        }`}
                      >
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Star
                          size={13}
                          className="text-amber-400 fill-amber-400"
                        />
                        <span className="text-slate-300 font-medium text-sm">
                          {Number(p.averageRating).toFixed(1)}
                        </span>
                        <span className="text-slate-600 text-xs">
                          ({p.totalReviews})
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <span className="text-slate-400 text-sm font-medium">
                        {p._count?.orderItems ?? 0} sold
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          {deletingId === p.id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Trash2 size={15} />
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

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">
                {editProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Image Upload */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Product Image
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
                      <Upload
                        size={24}
                        className="text-slate-500 mx-auto mb-1"
                      />
                      <p className="text-xs text-slate-500">
                        Click to upload image
                      </p>
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
                  placeholder="Product name"
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
                    setFormData((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Product description"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm text-white placeholder-slate-500 resize-none"
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, price: e.target.value }))
                    }
                    placeholder="0"
                    min={0}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm text-white placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Stock *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, stock: e.target.value }))
                    }
                    placeholder="0"
                    min={0}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm text-white placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Category *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      categoryId: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 focus:border-emerald-500/50 focus:outline-none rounded-xl text-sm text-white"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Footer */}
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
                {editProduct ? "Save Changes" : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}