import React from "react";
import { Loader2, AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden relative">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition-colors disabled:opacity-50"
        >
          <X size={16} />
        </button>

        <div className="p-6 pt-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto text-rose-500 mb-4">
            <AlertTriangle size={24} />
          </div>
          <h2 className="text-lg font-bold text-[var(--foreground)] tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex items-center gap-3 p-4 bg-[var(--surface-1)] border-t border-[var(--border)]">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-[var(--foreground)] bg-[var(--surface-2)] border border-[var(--border)] hover:bg-[var(--surface-3)] transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl font-semibold text-sm text-white bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all disabled:opacity-60"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
