"use client";

import { useState, useEffect } from "react";
import { X, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { assignPermissionToRoles } from "@/utils/adminApi";

interface Permission {
  id: string;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  rolePermissions: { permission: Permission }[];
}

interface ManagePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: Role | null;
  allPermissions: Permission[];
  initialSelected: string[];
}

export default function ManagePermissionsModal({
  isOpen,
  onClose,
  onSuccess,
  role,
  allPermissions,
  initialSelected,
}: ManagePermissionsModalProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && role) {
      setSelectedPermissions(initialSelected);
    } else {
      setSelectedPermissions([]);
    }
  }, [isOpen, role, initialSelected]);

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSubmit = async () => {
    if (!role) return;

    setLoading(true);
    const res = await assignPermissionToRoles({
      roleId: role.id,
      permissionIds: selectedPermissions,
    });

    setLoading(false);
    if (res.success) {
      toast.success("Permissions updated successfully");
      onSuccess();
      onClose();
    } else {
      toast.error(res.message || "Failed to update permissions");
    }
  };

  if (!isOpen || !role) return null;

  // Group permissions by resource for better UI
  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) acc[perm.resource] = [];
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)] flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
              <ShieldCheck size={20} className="text-emerald-500" />
              Manage Permissions
            </h2>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              Role: <span className="font-semibold text-[var(--foreground)]">{role.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] transition-colors self-start"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-6">
          {Object.entries(groupedPermissions).map(([resource, perms]) => (
            <div key={resource} className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-4">
              <h3 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider mb-3">
                {resource}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {perms.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] cursor-pointer hover:border-emerald-500/50 transition-colors group"
                  >
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={() => handleTogglePermission(perm.id)}
                        className="w-4 h-4 rounded border-[var(--border)] text-emerald-500 focus:ring-emerald-500/20 bg-[var(--surface)] transition-colors cursor-pointer"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)] group-hover:text-emerald-500 transition-colors">
                        {perm.name}
                      </p>
                      {perm.description && (
                        <p className="text-xs text-[var(--foreground-muted)] mt-0.5">
                          {perm.description}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
          
          {Object.keys(groupedPermissions).length === 0 && (
            <p className="text-center text-[var(--foreground-muted)] py-8">
              No permissions available in the system.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 p-5 border-t border-[var(--border)] bg-[var(--surface)] rounded-b-2xl flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {loading ? "Saving..." : "Save Permissions"}
          </button>
        </div>
      </div>
    </div>
  );
}
