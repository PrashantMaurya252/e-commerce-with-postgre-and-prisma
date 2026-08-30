"use client";

import { useEffect, useState } from "react";
import { 
  getRolesAndPermissions, 
  deleteRole, 
  getAssignedPermissions 
} from "@/utils/adminApi";
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  ShieldCheck, 
  RefreshCw,
  AlertCircle
} from "lucide-react";
import RoleFormModal from "@/components/admin/RoleFormModal";
import ManagePermissionsModal from "@/components/admin/ManagePermissionsModal";
import { toast } from "sonner";

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
  description?: string;
  isSystemRole: boolean;
  isActive: boolean;
  rolePermissions: { permission: Permission }[];
}

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<Role | null>(null);

  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<Role | null>(null);
  const [initialSelectedPerms, setInitialSelectedPerms] = useState<string[]>([]);

  const fetchRolesAndPermissions = async () => {
    setLoading(true);
    setError("");
    const res = await getRolesAndPermissions();
    if (res.success && res.data) {
      setRoles(res.data.roles || []);
      setPermissions(res.data.permissions || []);
    } else {
      setError(res.message || "Failed to load roles and permissions");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRolesAndPermissions();
  }, []);

  const handleCreateRole = () => {
    setSelectedRoleForEdit(null);
    setIsRoleModalOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRoleForEdit(role);
    setIsRoleModalOpen(true);
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      const res = await deleteRole(roleId);
      if (res.success) {
        toast.success("Role deleted successfully");
        fetchRolesAndPermissions();
      } else {
        toast.error(res.message || "Failed to delete role");
      }
    }
  };

  const handleManagePermissions = async (role: Role) => {
    // Fetch assigned permissions for this role to populate the modal accurately
    toast.loading("Fetching permissions...", { id: "fetch-perms" });
    const res = await getAssignedPermissions(role.id);
    if (res.success && res.data) {
      const assignedIds = res.data.map((rp: any) => rp.permissionId);
      setInitialSelectedPerms(assignedIds);
      setSelectedRoleForPerms(role);
      setIsPermModalOpen(true);
      toast.dismiss("fetch-perms");
    } else {
      toast.error(res.message || "Failed to load assigned permissions", { id: "fetch-perms" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-[var(--surface-2)] rounded-lg" />
          <div className="h-10 w-32 bg-[var(--surface-2)] rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-[var(--surface-2)]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <AlertCircle size={48} className="text-rose-500" />
        <p className="text-[var(--foreground)] font-medium">{error}</p>
        <button
          onClick={fetchRolesAndPermissions}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tight flex items-center gap-2">
            <Shield className="text-emerald-500" />
            Roles & Permissions
          </h1>
          <p className="text-[var(--foreground-muted)] text-sm mt-1">
            Manage access control by defining roles and assigning permissions.
          </p>
        </div>
        <button
          onClick={handleCreateRole}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 w-full sm:w-auto"
        >
          <Plus size={18} />
          <span>Create Role</span>
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {roles.map((role) => (
          <div
            key={role.id}
            className="flex flex-col bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-5 hover:border-emerald-500/30 transition-all shadow-sm group relative overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full opacity-50 -translate-y-4 translate-x-4 pointer-events-none" />
            
            <div className="flex justify-between items-start mb-4 relative">
              <div>
                <h3 className="text-lg font-bold text-[var(--foreground)] capitalize flex items-center gap-2">
                  {role.name}
                  {role.isSystemRole && (
                    <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 text-[10px] font-bold uppercase rounded-md border border-rose-500/20">
                      System
                    </span>
                  )}
                </h3>
                <p className="text-sm text-[var(--foreground-muted)] mt-1 line-clamp-2 min-h-[40px]">
                  {role.description || "No description provided."}
                </p>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-[var(--border)] flex items-center justify-between gap-2 relative">
              <button
                onClick={() => handleManagePermissions(role)}
                className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500 hover:text-emerald-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-emerald-500/10"
              >
                <ShieldCheck size={14} />
                Permissions
              </button>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEditRole(role)}
                  className="p-1.5 text-[var(--foreground-muted)] hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                  title="Edit Role"
                >
                  <Edit size={16} />
                </button>
                {!role.isSystemRole && (
                  <button
                    onClick={() => handleDeleteRole(role.id, role.name)}
                    className="p-1.5 text-[var(--foreground-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Delete Role"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {roles.length === 0 && !loading && (
        <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-2xl">
          <Shield className="mx-auto h-12 w-12 text-[var(--foreground-muted)] mb-3 opacity-20" />
          <h3 className="text-lg font-semibold text-[var(--foreground)]">No Roles Found</h3>
          <p className="text-[var(--foreground-muted)] text-sm mt-1">Get started by creating your first role.</p>
        </div>
      )}

      {/* Modals */}
      <RoleFormModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onSuccess={fetchRolesAndPermissions}
        roleData={selectedRoleForEdit}
        allPermissions={permissions}
      />

      <ManagePermissionsModal
        isOpen={isPermModalOpen}
        onClose={() => setIsPermModalOpen(false)}
        onSuccess={() => {}}
        role={selectedRoleForPerms}
        allPermissions={permissions}
        initialSelected={initialSelectedPerms}
      />
    </div>
  );
}
