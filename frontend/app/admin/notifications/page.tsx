"use client";

import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/utils/adminApi";
import api from "@/utils/interceptor";
import {
  Bell,
  Send,
  X,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Mail,
  Smartphone,
  MessageSquare,
  MonitorSmartphone,
  CheckCheck,
  Clock,
  AlertCircle,
  Info,
  CheckCircle2,
  Triangle,
  User,
} from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";
import { normalAPIResponse } from "@/types/auth";

// ── Types ───────────────────────────────────────────────────────────────────
interface Notification {
  id: string;
  title: string;
  description: string;
  actionUrl?: string | null;
  channel: "IN_APP" | "EMAIL" | "PUSH" | "SMS";
  status: "PENDING" | "SENT" | "FAILED" | "READ";
  type: "INFO" | "WARNING" | "ERROR" | "SUCCESS";
  priority: "HIGH" | "MEDIUM" | "LOW";
  isRead: boolean;
  receiver?: { id: string; name: string; email: string } | null;
  scheduledAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
}

const TYPE_OPTIONS = ["INFO", "WARNING", "ERROR", "SUCCESS"] as const;
const CHANNEL_OPTIONS = ["IN_APP", "EMAIL", "PUSH", "SMS"] as const;
const PRIORITY_OPTIONS = ["HIGH", "MEDIUM", "LOW"] as const;

const EMPTY_FORM = {
  title: "",
  description: "",
  channel: "IN_APP" as Notification["channel"],
  type: "INFO" as Notification["type"],
  priority: "MEDIUM" as Notification["priority"],
  actionUrl: "",
  scheduledAt: "",
  receiverId: "",
};

// ── Inline API helpers ──────────────────────────────────────────────────────
const getAdminNotifications = async (page = 1, limit = 15): Promise<normalAPIResponse> => {
  try {
    const res = await api.get(`${BACKEND_URL}/notification`, {
      params: { page, limit },
      withCredentials: true,
    });
    return res.data;
  } catch (error: any) {
    return { success: false, message: error?.response?.data?.message || "Internal Server Error" };
  }
};

const sendNotification = async (data: Record<string, any>): Promise<normalAPIResponse> => {
  try {
    const res = await api.post(`${BACKEND_URL}/notification/send`, data, { withCredentials: true });
    return res.data;
  } catch (error: any) {
    return { success: false, message: error?.response?.data?.message || "Internal Server Error" };
  }
};

// ── Maps ────────────────────────────────────────────────────────────────────
const channelIcon: Record<string, React.ElementType> = {
  IN_APP: MonitorSmartphone,
  EMAIL: Mail,
  PUSH: Smartphone,
  SMS: MessageSquare,
};

const channelBadge: Record<string, string> = {
  IN_APP: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  EMAIL: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  PUSH: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  SMS: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

const typeIcon: Record<string, React.ElementType> = {
  INFO: Info,
  WARNING: Triangle,
  ERROR: AlertCircle,
  SUCCESS: CheckCircle2,
};

const typeColor: Record<string, string> = {
  INFO: "text-blue-500",
  WARNING: "text-amber-500",
  ERROR: "text-rose-500",
  SUCCESS: "text-emerald-500",
};

const statusBadge: Record<string, string> = {
  PENDING: "bg-[var(--surface-3)] text-[var(--foreground-muted)] border-[var(--border)]",
  SENT: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  FAILED: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  READ: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

// ── Shared classes ──────────────────────────────────────────────────────────
const inputClass =
  "w-full px-4 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-emerald-500 focus:outline-none rounded-xl text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] transition-colors";

const labelClass =
  "text-[11px] font-bold text-[var(--foreground-muted)] uppercase tracking-widest block mb-1.5";

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchNotifications = async (pg = page) => {
    setLoading(true);
    const res = await getAdminNotifications(pg, 15);
    if (res.success) {
      setNotifications(res.data || []);
      setTotalPages(res.totalPages || 1);
      setTotal(res.total || res.totalNotifications || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSend = async () => {
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.description.trim()) return toast.error("Description is required");

    setSaving(true);
    const payload: Record<string, any> = {
      title: form.title.trim(),
      description: form.description.trim(),
      channel: form.channel,
      type: form.type,
      priority: form.priority,
    };
    if (form.actionUrl.trim()) payload.actionUrl = form.actionUrl.trim();
    if (form.receiverId.trim()) payload.receiverId = form.receiverId.trim();
    if (form.scheduledAt) payload.scheduledAt = new Date(form.scheduledAt).toISOString();

    try {
      const res = await sendNotification(payload);
      if (res.success) {
        toast.success("Notification sent!");
        setModalOpen(false);
        setForm(EMPTY_FORM);
        fetchNotifications(1);
      } else {
        toast.error(res.message || "Something went wrong");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tight">
            Notifications
          </h1>
          <p className="text-[var(--foreground-muted)] text-sm mt-1">
            {total} notifications total
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchNotifications(page)}
            className="p-2.5 rounded-xl bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--foreground-muted)] border border-[var(--border)] transition-all"
          >
            <RefreshCw size={15} />
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20"
          >
            <Send size={14} />
            <span>Send Notification</span>
          </button>
        </div>
      </div>

      {/* ── Notifications List ──────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Bell size={44} className="text-[var(--foreground-muted)] opacity-30" />
            <p className="text-[var(--foreground-muted)] font-medium text-sm">
              No notifications yet
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="text-emerald-500 text-sm font-semibold hover:underline"
            >
              Send your first notification →
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {notifications.map((notif) => {
              const ChannelIcon = channelIcon[notif.channel] || Bell;
              const TypeIcon = typeIcon[notif.type] || Info;
              return (
                <div
                  key={notif.id}
                  className="px-4 sm:px-5 py-4 hover:bg-[var(--surface-2)] transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Channel Icon */}
                    <div
                      className={clsx(
                        "p-2 rounded-xl border flex-shrink-0",
                        channelBadge[notif.channel]
                      )}
                    >
                      <ChannelIcon size={14} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <TypeIcon size={13} className={typeColor[notif.type]} />
                            <p className="font-semibold text-[var(--foreground)] text-sm leading-tight truncate">
                              {notif.title}
                            </p>
                          </div>
                          <p className="text-[var(--foreground-muted)] text-xs mt-0.5 line-clamp-2">
                            {notif.description}
                          </p>
                        </div>

                        {/* Status badge */}
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border flex-shrink-0",
                            statusBadge[notif.status]
                          )}
                        >
                          {notif.status === "SENT" || notif.status === "READ" ? (
                            <CheckCheck size={9} />
                          ) : notif.status === "PENDING" ? (
                            <Clock size={9} />
                          ) : (
                            <AlertCircle size={9} />
                          )}
                          {notif.status}
                        </span>
                      </div>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {notif.receiver && (
                          <div className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                            <User size={10} />
                            <span className="truncate max-w-[100px]">{notif.receiver.name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                          <Clock size={10} />
                          <span>
                            {new Date(notif.createdAt).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <span
                          className={clsx(
                            "px-1.5 py-0.5 rounded text-[10px] font-bold border",
                            channelBadge[notif.channel]
                          )}
                        >
                          {notif.channel}
                        </span>
                        <span
                          className={clsx(
                            "text-[10px] font-black",
                            notif.priority === "HIGH"
                              ? "text-rose-500"
                              : notif.priority === "MEDIUM"
                              ? "text-amber-500"
                              : "text-[var(--foreground-muted)]"
                          )}
                        >
                          {notif.priority}
                        </span>
                      </div>
                    </div>
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

      {/* ── Send Notification Modal ──────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-xl shadow-2xl max-h-[92dvh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] sticky top-0 bg-[var(--card)] z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Bell size={16} className="text-emerald-500" />
                </div>
                <h2 className="text-base font-bold text-[var(--foreground)]">
                  Send Notification
                </h2>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Title & Message */}
              <div>
                <label className={labelClass}>Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Notification title..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Message *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Notification body text..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Channel */}
              <div>
                <label className={labelClass}>Channel *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {CHANNEL_OPTIONS.map((ch) => {
                    const Icon = channelIcon[ch];
                    return (
                      <button
                        key={ch}
                        onClick={() => setForm((f) => ({ ...f, channel: ch }))}
                        className={clsx(
                          "flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-[11px] font-bold transition-all",
                          form.channel === ch
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500"
                            : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-2)]"
                        )}
                      >
                        <Icon size={15} />
                        {ch}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Type & Priority row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Type */}
                <div>
                  <label className={labelClass}>Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TYPE_OPTIONS.map((t) => {
                      const Icon = typeIcon[t];
                      return (
                        <button
                          key={t}
                          onClick={() => setForm((f) => ({ ...f, type: t }))}
                          className={clsx(
                            "flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all",
                            form.type === t
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500"
                              : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-2)]"
                          )}
                        >
                          <Icon size={12} className={form.type === t ? "" : typeColor[t]} />
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className={labelClass}>Priority</label>
                  <div className="flex flex-col gap-2">
                    {PRIORITY_OPTIONS.map((p) => (
                      <button
                        key={p}
                        onClick={() => setForm((f) => ({ ...f, priority: p }))}
                        className={clsx(
                          "px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all text-left",
                          form.priority === p
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500"
                            : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--border-2)]"
                        )}
                      >
                        {p === "HIGH" ? "🔴 High" : p === "MEDIUM" ? "🟡 Medium" : "🟢 Low"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Receiver & Action URL */}
              <div>
                <label className={labelClass}>
                  Receiver User ID{" "}
                  <span className="text-[var(--foreground-muted)] normal-case font-normal opacity-70">
                    (blank = broadcast)
                  </span>
                </label>
                <input
                  type="text"
                  value={form.receiverId}
                  onChange={(e) => setForm((f) => ({ ...f, receiverId: e.target.value }))}
                  placeholder="UUID of target user"
                  className={inputClass}
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

              {/* Schedule */}
              <div>
                <label className={labelClass}>
                  Schedule At{" "}
                  <span className="text-[var(--foreground-muted)] normal-case font-normal opacity-70">
                    (blank = instant)
                  </span>
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledAt: e.target.value }))}
                  className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`}
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
                onClick={handleSend}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-60"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {form.scheduledAt ? "Schedule" : "Send Now"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
