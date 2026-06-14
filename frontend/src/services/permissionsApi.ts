import { Project, MembershipsMap } from 'types';

interface PermissionsMap {
  [projectId: string]: unknown;
}

const permissionsApi = {
  processProjectPermissions: <T>(
    projects: Project[],
    determinePermissions: (project: Project) => T
  ): { permissionsMap: Record<string, T>; membershipsMap: MembershipsMap } => {
    if (!Array.isArray(projects)) throw new Error("Projects must be an array");

    const permissionsMap: Record<string, T> = {};
    const membershipsMap: MembershipsMap = {};

    projects.forEach(project => {
      if (project?.id) {
        permissionsMap[project.id] = determinePermissions(project);
        if (Array.isArray(project.memberships)) {
          membershipsMap[project.id] = project.memberships;
        }
      }
    });

    return { permissionsMap, membershipsMap };
  }
};

export default permissionsApi;
