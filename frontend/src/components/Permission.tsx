import React from 'react';
import PropTypes from 'prop-types';
import { usePermissions } from "contexts/permissions/PermissionsContext";

const Permission = ({ 
  type, 
  project, 
  fallback = null, 
  children 
}: any) => {
  const permissions = usePermissions();
  
  // Check if the user has the required permission
  const hasPermission = permissions.hasPermission(type, project);
  
  // Render children if user has permission, otherwise render fallback
  return hasPermission ? children : fallback;
};

Permission.propTypes = {
  // The type of permission to check ('view', 'edit', 'delete', 'manage_members', 'manage_pages')
  type: PropTypes.oneOf(['view', 'edit', 'delete', 'manage_members', 'manage_pages']).isRequired,
  
  // The project to check permissions for (object, id, or null for current project)
  project: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
    PropTypes.number
  ]),
  
  // Content to render if permission check fails
  fallback: PropTypes.node,
  
  // Content to render if permission check passes
  children: PropTypes.node.isRequired
};

export default Permission;