"use client";

import { useEffect, useState } from "react";
import {
  getAllFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  toggleFaqStatus,
} from "@/utils/adminApi";
import {
  HelpCircle,
  Plus,
  Edit3,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

interface Faq {
  id: string;
  question: string;
  answer: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_FORM = { question: "", answer: "", isActive: true };

const inputClass =
  "w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] transition-colors";

const labelClass =
  "text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest block mb-1.5";

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editFaq, setEditFaq] = useState<Faq | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchFaqs = async () => {
    setLoading(true);
    const res = await getAllFaqs(1, 100, true);
    if (res.success) setFaqs(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const openCreate = () => {
    setEditFaq(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (faq: Faq) => {
    setEditFaq(faq);
    setForm({ question: faq.question, answer: faq.answer, isActive: faq.isActive });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.question.trim()) return toast.error("Question is required");
    if (!form.answer.trim()) return toast.error("Answer is required");
    setSaving(true);
    try {
      const res = editFaq
        ? await updateFaq(editFaq.id, form)
        : await createFaq(form);
      if (res.success) {
        toast.success(editFaq ? "FAQ updated!" : "FAQ created!");
        setModalOpen(false);
        fetchFaqs();
      } else {
        toast.error(res.message || "Something went wrong");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (faq: Faq) => {
    if (!confirm(`Delete this FAQ?`)) return;
    setDeletingId(faq.id);
    const res = await deleteFaq(faq.id);
    if (res.success) {
      toast.success("FAQ deleted");
      fetchFaqs();
    } else {
      toast.error(res.message || "Failed");
    }
    setDeletingId(null);
  };

  const handleToggle = async (faq: Faq) => {
    setTogglingId(faq.id);
    const res = await toggleFaqStatus(faq.id);
    if (res.success) {
      toast.success(faq.isActive ? "FAQ deactivated" : "FAQ activated");
      setFaqs((prev) =>
        prev.map((f) => (f.id === faq.id ? { ...f, isActive: !f.isActive } : f))
      );
    } else {
      toast.error(res.message || "Failed");
    }
    setTogglingId(null);
  };

  const filtered = search.trim()
    ? faqs.filter(
        (f) =>
          f.question.toLowerCase().includes(search.toLowerCase()) ||
          f.answer.toLowerCase().includes(search.toLowerCase())
      )
    : faqs;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tight">
            FAQs
          </h1>
          <p className="text-[var(--foreground-muted)] text-sm mt-1">
            {faqs.length} questions · {faqs.filter((f) => f.isActive).length} active
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchFaqs}
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
            <span>Add FAQ</span>
          </button>
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────────── */}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)]"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search questions or answers..."
          className="w-full pl-11 pr-4 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] transition-colors"
        />
      </div>

      {/* ── FAQ List ────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <HelpCircle size={44} className="text-[var(--foreground-muted)] opacity-30" />
          <p className="text-[var(--foreground-muted)] font-medium text-sm">
            {search ? "No FAQs match your search" : "No FAQs yet"}
          </p>
          {!search && (
            <button
              onClick={openCreate}
              className="text-emerald-500 text-sm font-semibold hover:underline"
            >
              Add your first FAQ →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((faq, index) => (
            <div
              key={faq.id}
              className={clsx(
                "rounded-2xl border bg-[var(--card)] overflow-hidden transition-all duration-200",
                faq.isActive
                  ? "border-[var(--card-border)]"
                  : "border-[var(--border)] opacity-60"
              )}
            >
              {/* Question Row */}
              <div className="flex items-center gap-3 px-4 py-3.5">
                {/* Number badge */}
                <span className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-[10px] font-black text-emerald-500 flex-shrink-0">
                  {index + 1}
                </span>

                {/* Question text */}
                <button
                  onClick={() =>
                    setExpandedId(expandedId === faq.id ? null : faq.id)
                  }
                  className="flex-1 text-left min-w-0"
                >
                  <p className="font-semibold text-[var(--foreground)] text-sm leading-snug line-clamp-2 sm:line-clamp-1">
                    {faq.question}
                  </p>
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(faq)}
                    disabled={togglingId === faq.id}
                    title={faq.isActive ? "Deactivate" : "Activate"}
                    className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                  >
                    {togglingId === faq.id ? (
                      <Loader2 size={15} className="animate-spin text-[var(--foreground-muted)]" />
                    ) : faq.isActive ? (
                      <ToggleRight size={17} className="text-emerald-500" />
                    ) : (
                      <ToggleLeft size={17} className="text-[var(--foreground-muted)]" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(faq)}
                    className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <Edit3 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(faq)}
                    disabled={deletingId === faq.id}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-[var(--foreground-muted)] hover:text-rose-500 transition-colors"
                  >
                    {deletingId === faq.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === faq.id ? null : faq.id)
                    }
                    className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    {expandedId === faq.id ? (
                      <ChevronUp size={15} />
                    ) : (
                      <ChevronDown size={15} />
                    )}
                  </button>
                </div>
              </div>

              {/* Answer Dropdown */}
              {expandedId === faq.id && (
                <div className="px-4 pb-4 border-t border-[var(--border)]">
                  <div className="flex items-start gap-3 mt-3">
                    <div className="w-6 h-6 rounded-lg bg-[var(--surface-2)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <HelpCircle size={12} className="text-[var(--foreground-muted)]" />
                    </div>
                    <p className="text-[var(--foreground-muted)] text-sm leading-relaxed whitespace-pre-wrap">
                      {faq.answer}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border)] flex-wrap">
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border",
                        faq.isActive
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-[var(--surface-3)] text-[var(--foreground-muted)] border-[var(--border)]"
                      )}
                    >
                      <span
                        className={clsx(
                          "w-1.5 h-1.5 rounded-full",
                          faq.isActive ? "bg-emerald-500" : "bg-[var(--foreground-muted)]"
                        )}
                      />
                      {faq.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="text-xs text-[var(--foreground-muted)]">
                      Updated{" "}
                      {new Date(faq.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Modal ──────────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl max-h-[92dvh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--card)] z-10">
              <h2 className="text-base font-bold text-[var(--foreground)]">
                {editFaq ? "Edit FAQ" : "Add FAQ"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Question */}
              <div>
                <label className={labelClass}>Question *</label>
                <input
                  type="text"
                  value={form.question}
                  onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
                  placeholder="e.g. How do I return a product?"
                  className={inputClass}
                />
              </div>

              {/* Answer */}
              <div>
                <label className={labelClass}>Answer *</label>
                <textarea
                  value={form.answer}
                  onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                  placeholder="Provide a detailed answer..."
                  rows={6}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between px-4 py-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    Visible to users
                  </p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    Inactive FAQs are hidden from public
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
                {editFaq ? "Save Changes" : "Create FAQ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
