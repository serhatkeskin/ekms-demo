import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import { useAuth } from "contexts/auth/AuthContext";
import permissionsApi from "services/permissionsApi";
import projectApi from "services/projectApi";
import { Project, Membership, Role } from "types";

interface ProjectPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isManager: boolean;
  isMember: boolean;
  canManageMembers: boolean;
  canManagePages: boolean;
  canCreatePageContent: boolean;
  canEditPageContent: boolean;
  canDeletePageContent: boolean;
  canUploadFiles: boolean;
  canExportPages: boolean;
  canClonePages: boolean;
  role: Role | null;
}

interface PermissionsContextType {
  currentProject: Project | null;
  setActiveProject: (project: Project | string | null) => Promise<void>;
  projectPermissions: ProjectPermissions | Record<string, never>;
  loading: boolean;
  error: string | null;
  processProjects: (projects: Project[]) => void;
  clearPermissions: () => void;
  canViewProject: (p: Project | string) => boolean;
  canEditProject: (p: Project | string) => boolean;
  canDeleteProject: (p: Project | string) => boolean;
  isProjectManager: (p: Project | string) => boolean;
  isProjectMember: (p: Project | string) => boolean;
  canManageProjectMembers: (p: Project | string) => boolean;
  canManageProjectPages: (p: Project | string) => boolean;
  canCreatePageContent: (p: Project | string) => boolean;
  canEditPageContent: (p: Project | string) => boolean;
  canDeletePageContent: (p: Project | string) => boolean;
  canUploadFiles: (p: Project | string) => boolean;
  canExportPages: (p: Project | string) => boolean;
  canClonePages: (p: Project | string) => boolean;
  getUserProjectRole: (p: Project | string) => Role | null;
  hasPermission: (type: string, p: Project | string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | null>(null);
PermissionsContext.displayName = "PermissionsContext";

const defaultPermissions: ProjectPermissions = {
  canView: false, canCreate: false, canEdit: false, canDelete: false,
  isManager: false, isMember: false, canManageMembers: false, canManagePages: false,
  canCreatePageContent: false, canEditPageContent: false, canDeletePageContent: false,
  canUploadFiles: false, canExportPages: false, canClonePages: false, role: null
};

function PermissionsProvider({ children }: { children: ReactNode }) {
  const [auth] = useAuth();
  const { isAuthenticated, user } = auth;

  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectPermissions, setProjectPermissions] = useState<ProjectPermissions | Record<string, never>>({});
  const [permissionsCache, setPermissionsCache] = useState<Record<string, ProjectPermissions>>({});
  const [projectMemberships, setProjectMemberships] = useState<Record<string, Membership[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const determineProjectPermissions = useCallback((project: Project): ProjectPermissions => {
    if (!project || !isAuthenticated || !user) return defaultPermissions;
    
    if (user.is_staff) {
      return { ...defaultPermissions, canView: true, canCreate: true, canEdit: true, canDelete: true,
        isManager: true, isMember: true, canManageMembers: true, canManagePages: true,
        canCreatePageContent: true, canEditPageContent: true, canDeletePageContent: true,
        canUploadFiles: true, canExportPages: true, canClonePages: true,
        role: { id: 0, name: 'Administrator' } };
    }

    const membership = project.memberships?.find(m => m.user?.username === user.username);
    if (!membership?.role) return defaultPermissions;

    const role = membership.role as Role & { is_supermanager?: boolean; can_view?: boolean; can_create?: boolean; can_edit?: boolean; can_delete?: boolean };
    const isManager = Boolean(role.is_supermanager) || /manager|admin/i.test(role.name);

    return {
      canView: !!role.can_view, canCreate: !!role.can_create, canEdit: !!role.can_edit, canDelete: !!role.can_delete,
      isManager, isMember: true, canManageMembers: isManager, canManagePages: isManager || !!role.can_edit,
      canCreatePageContent: !!role.can_edit || isManager, canEditPageContent: !!role.can_edit || isManager,
      canDeletePageContent: !!role.can_delete, canUploadFiles: !!role.can_edit || isManager,
      canExportPages: !!role.can_view, canClonePages: !!role.can_view, role
    };
  }, [isAuthenticated, user]);

  const getUserRole = useCallback((projectId: string | number): Role | null => {
    const memberships = projectMemberships[projectId];
    return memberships?.find(m => m.user?.username === user?.username)?.role || null;
  }, [projectMemberships, user]);

  const clearPermissions = useCallback(() => {
    setCurrentProject(null);
    setProjectPermissions({});
    setPermissionsCache({});
    setProjectMemberships({});
  }, []);

  const fetchProjectPermissions = useCallback(async (projectSlug: string) => {
    if (!isAuthenticated || !projectSlug) return null;
    if (permissionsCache[projectSlug]) return permissionsCache[projectSlug];

    setLoading(true);
    setError(null);

    try {
      const project = await projectApi.getProject(projectSlug);
      const permissions = determineProjectPermissions(project);
      if (project.memberships) {
        setProjectMemberships(prev => ({ ...prev, [projectSlug]: project.memberships! }));
      }
      setPermissionsCache(prev => ({ ...prev, [projectSlug]: permissions }));
      return permissions;
    } catch (err) {
      setError("Failed to fetch project permissions");
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, permissionsCache, determineProjectPermissions]);

  const processProjects = useCallback((projects: Project[]) => {
    const { permissionsMap, membershipsMap } = permissionsApi.processProjectPermissions(projects, determineProjectPermissions);
    setPermissionsCache(prev => ({ ...prev, ...permissionsMap }));
    setProjectMemberships(prev => ({ ...prev, ...membershipsMap }));
  }, [determineProjectPermissions]);

  const setActiveProject = useCallback(async (project: Project | string | null) => {
    if (!project) { setCurrentProject(null); setProjectPermissions({}); return; }
    const projectSlug = typeof project === 'object' ? String(project.id) : project;
    setCurrentProject(typeof project === 'object' ? project : null);
    const cached = permissionsCache[projectSlug];
    if (cached) { setProjectPermissions(cached); }
    else { const perms = await fetchProjectPermissions(projectSlug); if (perms) setProjectPermissions(perms); }
  }, [permissionsCache, fetchProjectPermissions]);

  useEffect(() => { if (!isAuthenticated) clearPermissions(); }, [isAuthenticated, clearPermissions]);

  const checkPermission = useCallback((project: Project | string, key: keyof ProjectPermissions): boolean => {
    if (user?.is_staff) return true;
    const id = typeof project === 'object' ? String(project?.id) : project;
    if (!id) return false;
    const cached = permissionsCache[id];
    if (cached) return !!cached[key];
    if (typeof project === 'object' && project.memberships) return !!determineProjectPermissions(project)[key];
    return false;
  }, [permissionsCache, determineProjectPermissions, user]);

  const value = useMemo<PermissionsContextType>(() => ({
    currentProject, setActiveProject, projectPermissions, loading, error, processProjects, clearPermissions,
    canViewProject: (p) => checkPermission(p, 'canView'),
    canEditProject: (p) => checkPermission(p, 'canEdit'),
    canDeleteProject: (p) => checkPermission(p, 'canDelete'),
    isProjectManager: (p) => checkPermission(p, 'isManager'),
    isProjectMember: (p) => checkPermission(p, 'isMember'),
    canManageProjectMembers: (p) => checkPermission(p, 'canManageMembers'),
    canManageProjectPages: (p) => checkPermission(p, 'canManagePages'),
    canCreatePageContent: (p) => checkPermission(p, 'canCreatePageContent'),
    canEditPageContent: (p) => checkPermission(p, 'canEditPageContent'),
    canDeletePageContent: (p) => checkPermission(p, 'canDeletePageContent'),
    canUploadFiles: (p) => checkPermission(p, 'canUploadFiles'),
    canExportPages: (p) => checkPermission(p, 'canExportPages'),
    canClonePages: (p) => checkPermission(p, 'canClonePages'),
    getUserProjectRole: (p) => getUserRole(typeof p === 'object' ? p.id : p),
    hasPermission: (type, p) => {
      const map: Record<string, keyof ProjectPermissions> = {
        view: 'canView', edit: 'canEdit', delete: 'canDelete',
        manage_members: 'canManageMembers', manage_pages: 'canManagePages',
      };
      return checkPermission(p, map[type] || 'canView');
    }
  }), [currentProject, setActiveProject, projectPermissions, loading, error, processProjects, clearPermissions, checkPermission, getUserRole]);

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

function usePermissions(): PermissionsContextType {
  const context = useContext(PermissionsContext);
  if (!context) throw new Error("usePermissions must be used within a PermissionsProvider");
  return context;
}

export { PermissionsProvider, usePermissions };
