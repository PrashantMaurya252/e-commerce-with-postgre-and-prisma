"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { toast } from "sonner";
import { createRole, updateRole, getAssignedPermissions, assignPermissionToRoles } from "@/utils/adminApi";

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roleData: any | null; // Pass null for create, object for edit
  allPermissions: any[];
}

export default function RoleFormModal({
  isOpen,
  onClose,
  onSuccess,
  roleData,
  allPermissions = [],
}: RoleFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPerms = async () => {
      if (isOpen) {
        if (roleData) {
          setName(roleData.name || "");
          setDescription(roleData.description || "");
          setLoading(true);
          const res = await getAssignedPermissions(roleData.id);
          if (res.success && res.data) {
            setSelectedPermissions(res.data.permissions?.map((rp: any) => rp.permissionId) || []);
          }
          setLoading(false);
        } else {
          setName("");
          setDescription("");
          setSelectedPermissions([]);
        }
      }
    };
    fetchPerms();
  }, [isOpen, roleData]);

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast.error("Role name is required");
      return;
    }

    setLoading(true);
    let res;
    if (roleData) {
      res = await updateRole(roleData.id, { name, description });
    } else {
      res = await createRole({ name, description });
    }

    setLoading(false);
    if (res.success) {
      const roleId = roleData ? roleData.id : res.data?.role?.id;
      if (roleId) {
        await assignPermissionToRoles({ roleId, permissionIds: selectedPermissions });
      }
      toast.success(roleData ? "Role updated successfully" : "Role created successfully");
      onSuccess();
      onClose();
    } else {
      toast.error(res.message || "Failed to save role");
    }
  };

  const groupedPermissions = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) acc[perm.resource] = [];
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, any[]>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)] flex-shrink-0">
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            {roleData ? "Edit Role" : "Create Role"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[var(--foreground)]">
              Role Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Moderator"
              className="w-full px-3 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-[var(--foreground)]">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the role..."
              rows={3}
              className="w-full px-3 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          <div className="space-y-1.5 mt-4">
            <label className="text-sm font-semibold text-[var(--foreground)]">
              Permissions
            </label>
            <div className="max-h-[30vh] overflow-y-auto space-y-4 pr-2">
              {Object.entries(groupedPermissions).map(([resource, perms]: [string, any]) => (
                <div key={resource} className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-4">
                  <h3 className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wider mb-3">
                    {resource}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {perms.map((perm: any) => (
                      <label
                        key={perm.id}
                        className="flex items-start gap-2 p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] cursor-pointer hover:border-emerald-500/50 transition-colors group"
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
                          <p className="text-xs font-semibold text-[var(--foreground)] group-hover:text-emerald-500 transition-colors">
                            {perm.name}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(groupedPermissions).length === 0 && (
                <p className="text-xs text-[var(--foreground-muted)]">No permissions available.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)] mt-4 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-[var(--foreground-muted)] hover:bg-[var(--surface-2)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
