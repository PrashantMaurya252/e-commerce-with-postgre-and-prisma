"use client";

import { useEffect, useState } from "react";
import { getAllCampaigns, createCampaign, deleteCampaign } from "@/utils/adminApi";
import {
  Megaphone,
  Plus,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
  Users,
  Send,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";

interface Campaign {
  id: string;
  title: string;
  description: string;
  channel: "IN_APP" | "EMAIL" | "PUSH" | "SMS";
  scheduledAt: string | null;
  createdBy: string;
  createdAt: string;
  _count: { notifications: number };
}

const CHANNEL_OPTIONS = ["IN_APP", "EMAIL", "PUSH", "SMS"] as const;

const EMPTY_FORM = {
  title: "",
  description: "",
  channel: "IN_APP" as Campaign["channel"],
  notificationTitle: "",
  notificationDescription: "",
  actionUrl: "",
  scheduledAt: "",
};

const channelBadge: Record<string, string> = {
  IN_APP: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  EMAIL: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  PUSH: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  SMS: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

const inputClass =
  "w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] transition-colors";

const labelClass =
  "text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest block mb-1.5";

const sectionLabel =
  "text-[10px] font-black text-[var(--foreground-muted)] uppercase tracking-widest mb-3";

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<"all" | "instant" | "scheduled">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCampaigns = async (pg = page) => {
    setLoading(true);
    const res = await getAllCampaigns(
      pg,
      10,
      filter === "all" ? undefined : filter
    );
    if (res.success) {
      setCampaigns(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCampaigns(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filter]);

  const handleCreate = async () => {
    if (!form.title.trim()) return toast.error("Campaign title is required");
    if (!form.description.trim()) return toast.error("Campaign description is required");
    if (!form.notificationTitle.trim()) return toast.error("Notification title is required");
    if (!form.notificationDescription.trim()) return toast.error("Notification description is required");

    setSaving(true);
    const payload: Record<string, any> = {
      title: form.title.trim(),
      description: form.description.trim(),
      channel: form.channel,
      notificationTitle: form.notificationTitle.trim(),
      notificationDescription: form.notificationDescription.trim(),
    };
    if (form.actionUrl.trim()) payload.actionUrl = form.actionUrl.trim();
    if (form.scheduledAt) payload.scheduledAt = new Date(form.scheduledAt).toISOString();

    try {
      const res = await createCampaign(payload);
      if (res.success) {
        toast.success(form.scheduledAt ? "Campaign scheduled!" : "Campaign sent instantly!");
        setModalOpen(false);
        setForm(EMPTY_FORM);
        fetchCampaigns(1);
      } else {
        toast.error(res.message || "Something went wrong");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (campaign: Campaign) => {
    if (!campaign.scheduledAt) return toast.error("Only scheduled campaigns can be deleted");
    if (!confirm(`Delete campaign "${campaign.title}"?`)) return;
    setDeletingId(campaign.id);
    const res = await deleteCampaign(campaign.id);
    if (res.success) {
      toast.success("Campaign deleted");
      fetchCampaigns(page);
    } else {
      toast.error(res.message || "Failed");
    }
    setDeletingId(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tight">
            Campaigns
          </h1>
          <p className="text-[var(--foreground-muted)] text-sm mt-1">
            {total} campaigns total
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchCampaigns(page)}
            className="p-2.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground-muted)] border border-[var(--border)] transition-all"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus size={16} />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* ── Filter Tabs ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-1 w-fit">
        {(["all", "instant", "scheduled"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => { setFilter(tab); setPage(1); }}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize",
              filter === tab
                ? "bg-emerald-500/15 text-emerald-500"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            )}
          >
            {tab === "instant" && <Zap size={11} />}
            {tab === "scheduled" && <Clock size={11} />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Campaigns List ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Megaphone size={44} className="text-[var(--foreground-muted)] opacity-30" />
            <p className="text-[var(--foreground-muted)] font-medium text-sm">
              No campaigns yet
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="text-emerald-500 text-sm font-semibold hover:underline"
            >
              Launch your first campaign →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {campaigns.map((campaign) => {
              const isScheduled = !!campaign.scheduledAt;
              const isExpired =
                isScheduled && new Date(campaign.scheduledAt!) < new Date();
              return (
                <div
                  key={campaign.id}
                  className="px-4 sm:px-5 py-4 hover:bg-[var(--surface-2)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Icon */}
                      <div
                        className={clsx(
                          "p-2 rounded-xl border flex-shrink-0",
                          isScheduled && !isExpired
                            ? "bg-amber-500/10 border-amber-500/20"
                            : "bg-emerald-500/10 border-emerald-500/20"
                        )}
                      >
                        {isScheduled && !isExpired ? (
                          <Clock size={16} className="text-amber-500" />
                        ) : (
                          <Zap size={16} className="text-emerald-500" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-[var(--foreground)] text-sm truncate">
                            {campaign.title}
                          </h3>
                          <span
                            className={clsx(
                              "px-2 py-0.5 rounded-md text-[10px] font-bold border flex-shrink-0",
                              channelBadge[campaign.channel]
                            )}
                          >
                            {campaign.channel}
                          </span>
                        </div>
                        <p className="text-[var(--foreground-muted)] text-xs mt-0.5 line-clamp-2">
                          {campaign.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <div className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                            <Users size={11} />
                            <span>{campaign._count.notifications} recipients</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                            <Calendar size={11} />
                            <span>
                              {new Date(campaign.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          {isScheduled ? (
                            <div className={clsx("flex items-center gap-1 text-xs", isExpired ? "text-rose-500" : "text-amber-500")}>
                              <Clock size={11} />
                              <span>
                                {isExpired ? "Was: " : "Scheduled: "}
                                {new Date(campaign.scheduledAt!).toLocaleString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-emerald-500">
                              <CheckCircle2 size={11} />
                              <span>Sent instantly</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Delete */}
                    {isScheduled && !isExpired && (
                      <button
                        onClick={() => handleDelete(campaign)}
                        disabled={deletingId === campaign.id}
                        className="p-2 rounded-xl bg-[var(--surface-2)] hover:bg-rose-500/10 text-[var(--foreground-muted)] hover:text-rose-500 border border-[var(--border)] hover:border-rose-500/30 transition-all flex-shrink-0"
                      >
                        {deletingId === campaign.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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

      {/* ── Create Campaign Modal ────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl shadow-2xl max-h-[92dvh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--card)] z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Megaphone size={16} className="text-emerald-500" />
                </div>
                <h2 className="text-base font-bold text-[var(--foreground)]">
                  Launch Campaign
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Campaign Details */}
              <div>
                <p className={sectionLabel}>Campaign Details</p>
                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>Campaign Title *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Summer Sale 2025"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Campaign Description *</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Internal note about this campaign..."
                      rows={2}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                  {/* Channel */}
                  <div>
                    <label className={labelClass}>Channel *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {CHANNEL_OPTIONS.map((ch) => (
                        <button
                          key={ch}
                          onClick={() => setForm((f) => ({ ...f, channel: ch }))}
                          className={clsx(
                            "px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-center",
                            form.channel === ch
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500"
                              : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-2)]"
                          )}
                        >
                          {ch}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notification Content */}
              <div className="border-t border-[var(--border)] pt-4">
                <p className={sectionLabel}>Notification Content</p>
                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>Notification Title *</label>
                    <input
                      type="text"
                      value={form.notificationTitle}
                      onChange={(e) => setForm((f) => ({ ...f, notificationTitle: e.target.value }))}
                      placeholder="e.g. 🎉 Flat 50% OFF Today Only!"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Notification Body *</label>
                    <textarea
                      value={form.notificationDescription}
                      onChange={(e) => setForm((f) => ({ ...f, notificationDescription: e.target.value }))}
                      placeholder="Message users will see..."
                      rows={3}
                      className={`${inputClass} resize-none`}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Action URL</label>
                    <input
                      type="url"
                      value={form.actionUrl}
                      onChange={(e) => setForm((f) => ({ ...f, actionUrl: e.target.value }))}
                      placeholder="https://... (optional)"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Delivery */}
              <div className="border-t border-[var(--border)] pt-4">
                <p className={sectionLabel}>Delivery</p>
                <div>
                  <label className={labelClass}>
                    Scheduled Date & Time{" "}
                    <span className="text-[var(--foreground-muted)] normal-case font-normal opacity-70">
                      (blank = send instantly)
                    </span>
                  </label>
                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                    className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`}
                  />
                </div>
                {form.scheduledAt ? (
                  <div className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <Clock size={13} className="text-amber-500 flex-shrink-0" />
                    <p className="text-xs text-amber-500">
                      Scheduled for{" "}
                      {new Date(form.scheduledAt).toLocaleString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <Zap size={13} className="text-emerald-500 flex-shrink-0" />
                    <p className="text-xs text-emerald-500">
                      Will be sent immediately to all active users
                    </p>
                  </div>
                )}
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
                onClick={handleCreate}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : form.scheduledAt ? (
                  <Calendar size={14} />
                ) : (
                  <Send size={14} />
                )}
                {form.scheduledAt ? "Schedule Campaign" : "Send Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
