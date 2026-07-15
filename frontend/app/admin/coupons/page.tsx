"use client";

import { useEffect, useState } from "react";
import {
  getAdminCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "@/utils/adminApi";
import {
  Ticket,
  Plus,
  Edit3,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  BadgePercent,
  BadgeDollarSign,
  Calendar,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENT" | "FLAT";
  discountValue: number;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  minCartValue: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
  couponUsages?: { id: string }[];
}

const EMPTY_FORM = {
  code: "",
  discountType: "PERCENT" as "PERCENT" | "FLAT",
  discountValue: "",
  maxDiscount: "",
  usageLimit: "",
  minCartValue: "",
  expiresAt: "",
  isActive: true,
};

// ── Shared classes (theme-aware) ────────────────────────────────────────────
const inputClass =
  "w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] transition-colors";

const labelClass =
  "text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest block mb-1.5";

const cardClass =
  "rounded-2xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCoupons = async () => {
    setLoading(true);
    const res = await getAdminCoupons();
    if (res.success) setCoupons(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openCreate = () => {
    setEditCoupon(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditCoupon(coupon);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      maxDiscount: coupon.maxDiscount != null ? String(coupon.maxDiscount) : "",
      usageLimit: coupon.usageLimit != null ? String(coupon.usageLimit) : "",
      minCartValue: String(coupon.minCartValue),
      expiresAt: coupon.expiresAt.slice(0, 16),
      isActive: coupon.isActive,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.code.trim()) return toast.error("Code is required");
    if (!form.discountValue) return toast.error("Discount value is required");
    if (!form.minCartValue) return toast.error("Min cart value is required");
    if (!form.expiresAt) return toast.error("Expiry date is required");

    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      minCartValue: Number(form.minCartValue),
      expiresAt: new Date(form.expiresAt).toISOString(),
      isActive: form.isActive,
    };

    try {
      const res = editCoupon
        ? await updateCoupon(editCoupon.id, payload)
        : await createCoupon(payload);

      if (res.success) {
        toast.success(editCoupon ? "Coupon updated!" : "Coupon created!");
        setModalOpen(false);
        fetchCoupons();
      } else {
        toast.error(res.message || "Something went wrong");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Deactivate coupon "${coupon.code}"?`)) return;
    setDeletingId(coupon.id);
    const res = await deleteCoupon(coupon.id);
    if (res.success) {
      toast.success("Coupon deactivated");
      fetchCoupons();
    } else {
      toast.error(res.message || "Failed");
    }
    setDeletingId(null);
  };

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tight">
            Coupons
          </h1>
          <p className="text-[var(--foreground-muted)] text-sm mt-1">
            {coupons.length} coupons total
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchCoupons}
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
            <span>Add Coupon</span>
          </button>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            label: "Total",
            value: coupons.length,
            color: "text-[var(--foreground)]",
            bg: "bg-[var(--surface-2)]",
          },
          {
            label: "Active",
            value: coupons.filter((c) => c.isActive && !isExpired(c.expiresAt)).length,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Expired",
            value: coupons.filter((c) => isExpired(c.expiresAt)).length,
            color: "text-rose-500",
            bg: "bg-rose-500/10",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-xl px-3 sm:px-4 py-3 border border-[var(--border)] ${s.bg}`}
          >
            <p className={`text-lg sm:text-xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[var(--foreground-muted)] font-medium mt-0.5">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <div className={cardClass}>
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Ticket size={44} className="text-[var(--foreground-muted)] opacity-30" />
            <p className="text-[var(--foreground-muted)] font-medium text-sm">
              No coupons yet
            </p>
            <button
              onClick={openCreate}
              className="text-emerald-500 text-sm font-semibold hover:underline"
            >
              Create your first coupon →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[540px]">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Code", "Discount", "Min Cart", "Expires", "Uses", "Status", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className={clsx(
                          "text-left px-4 py-3.5 text-[10px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest",
                          h === "Min Cart" && "hidden md:table-cell",
                          h === "Expires" && "hidden lg:table-cell",
                          h === "Uses" && "hidden lg:table-cell",
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
                {coupons.map((coupon) => {
                  const expired = isExpired(coupon.expiresAt);
                  return (
                    <tr
                      key={coupon.id}
                      className="hover:bg-[var(--surface-2)] transition-colors group"
                    >
                      {/* Code */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-violet-500/10 flex-shrink-0">
                            <Ticket size={13} className="text-violet-500" />
                          </div>
                          <span className="font-bold text-[var(--foreground)] font-mono tracking-wider text-xs sm:text-sm">
                            {coupon.code}
                          </span>
                        </div>
                      </td>

                      {/* Discount */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {coupon.discountType === "PERCENT" ? (
                            <BadgePercent size={13} className="text-amber-500 flex-shrink-0" />
                          ) : (
                            <BadgeDollarSign size={13} className="text-amber-500 flex-shrink-0" />
                          )}
                          <span className="font-bold text-amber-500 text-xs sm:text-sm">
                            {coupon.discountType === "PERCENT"
                              ? `${coupon.discountValue}%`
                              : `₹${coupon.discountValue}`}
                          </span>
                          {coupon.maxDiscount && (
                            <span className="text-[var(--foreground-muted)] text-xs hidden sm:inline">
                              (max ₹{coupon.maxDiscount})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Min Cart */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-[var(--foreground-muted)] text-sm">
                          ₹{coupon.minCartValue.toLocaleString()}
                        </span>
                      </td>

                      {/* Expires */}
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-[var(--foreground-muted)] flex-shrink-0" />
                          <span
                            className={clsx(
                              "text-sm",
                              expired
                                ? "text-rose-500"
                                : "text-[var(--foreground-muted)]"
                            )}
                          >
                            {new Date(coupon.expiresAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Uses */}
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Users size={12} className="text-[var(--foreground-muted)] flex-shrink-0" />
                          <span className="text-[var(--foreground)] font-semibold text-sm">
                            {coupon.couponUsages?.length ?? 0}
                            {coupon.usageLimit ? ` / ${coupon.usageLimit}` : " / ∞"}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border whitespace-nowrap",
                            expired
                              ? "bg-[var(--surface-3)] text-[var(--foreground-muted)] border-[var(--border)]"
                              : coupon.isActive
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          )}
                        >
                          <span
                            className={clsx(
                              "w-1.5 h-1.5 rounded-full flex-shrink-0",
                              expired
                                ? "bg-[var(--foreground-muted)]"
                                : coupon.isActive
                                ? "bg-emerald-500"
                                : "bg-rose-500"
                            )}
                          />
                          {expired ? "Expired" : coupon.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => openEdit(coupon)}
                            className="p-2 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-all border border-[var(--border)]"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon)}
                            disabled={deletingId === coupon.id}
                            className="p-2 rounded-xl bg-[var(--surface-2)] hover:bg-rose-500/10 text-[var(--foreground-muted)] hover:text-rose-500 transition-all border border-[var(--border)] hover:border-rose-500/30"
                          >
                            {deletingId === coupon.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl max-h-[92dvh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--card)] z-10">
              <h2 className="text-base font-bold text-[var(--foreground)]">
                {editCoupon ? "Edit Coupon" : "Create Coupon"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Code */}
              <div>
                <label className={labelClass}>Coupon Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                  }
                  placeholder="e.g. SAVE20"
                  className={`${inputClass} font-mono tracking-widest uppercase`}
                />
              </div>

              {/* Discount Type */}
              <div>
                <label className={labelClass}>Discount Type *</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["PERCENT", "FLAT"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setForm((f) => ({ ...f, discountType: type }))}
                      className={clsx(
                        "flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all",
                        form.discountType === type
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500"
                          : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-2)]"
                      )}
                    >
                      {type === "PERCENT" ? <BadgePercent size={15} /> : <BadgeDollarSign size={15} />}
                      {type === "PERCENT" ? "Percentage" : "Flat Amount"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount Value & Max Discount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>
                    {form.discountType === "PERCENT" ? "Discount % *" : "Discount ₹ *"}
                  </label>
                  <input
                    type="number"
                    value={form.discountValue}
                    onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))}
                    placeholder="0"
                    min={0}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Max Discount ₹</label>
                  <input
                    type="number"
                    value={form.maxDiscount}
                    onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
                    placeholder="Optional cap"
                    min={0}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Min Cart & Usage Limit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Min Cart Value ₹ *</label>
                  <input
                    type="number"
                    value={form.minCartValue}
                    onChange={(e) => setForm((f) => ({ ...f, minCartValue: e.target.value }))}
                    placeholder="0"
                    min={0}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Usage Limit</label>
                  <input
                    type="number"
                    value={form.usageLimit}
                    onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                    placeholder="Unlimited"
                    min={1}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className={labelClass}>Expiry Date & Time *</label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`}
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between px-4 py-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">Active</p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Inactive coupons cannot be applied
                  </p>
                </div>
                <button
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className={clsx(
                    "relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0",
                    form.isActive ? "bg-emerald-500" : "bg-[var(--surface-3)]"
                  )}
                >
                  <span
                    className={clsx(
                      "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200",
                      form.isActive ? "left-6" : "left-1"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Modal Footer */}
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
                {editCoupon ? "Save Changes" : "Create Coupon"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
