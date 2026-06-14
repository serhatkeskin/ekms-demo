import { useState } from "react";
import projectApi from 'services/projectApi';

interface UseProjectMembersProps {
  showNotification?: (color: string, title: string, content: string) => void;
}

export function useProjectMembers({ showNotification }: UseProjectMembersProps = {}) {
  const [currentRoles, setCurrentRoles] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);

  // Fetch project memberships
  const fetchProjectMemberships = async (projectSlug: string) => {
    try {
      const response = await projectApi.getProject(projectSlug);
      const membershipsData = response.content.memberships;
      setCurrentRoles(membershipsData);
    } catch (err) {
      console.error("Error fetching project memberships:", err);
      if (showNotification) {
        showNotification("error", "Error", "Failed to load project memberships");
      }
    }
  };

  // Fetch roles
  const fetchRoles = async () => {
    try {
      const response = await projectApi.getRoles();
      setAvailableRoles(response.content.data.results);
    } catch (err) {
      console.error("Error fetching roles:", err);
      if (showNotification) {
        showNotification("error", "Error", "Failed to load roles. Please try again later.");
      }
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await projectApi.getUsers();
      setAvailableUsers(response.content.data.results);
    } catch (err) {
      console.error("Error fetching users:", err);
      // Fallback for non-admin users
      try {
        const username = localStorage.getItem("username");
        if (username) {
          setAvailableUsers([{ username, id: "current" }]);
        }
      } catch (fallbackErr) {
        console.error("Error setting fallback user:", fallbackErr);
      }
    }
  };

  // Save Membership
  const saveMembership = async (
    data: { user: any, role: string }, 
    projectSlug: string,
    currentMembership?: any,
    onSuccess?: () => void
  ) => {
    try {
      let response;
      const membershipData = {
        username: data.user.username,
        project_slug: projectSlug,
        role_slug: data.role
      };
      
      try {
        if (currentMembership) {
          // Update existing membership
          response = await projectApi.updateMembership(currentMembership.id, membershipData);
          
          setCurrentRoles((prevRoles) => 
            prevRoles.map(r => r.id === currentMembership.id ? response.content : r)
          );
          
          if (showNotification) {
            showNotification(
              "success",
              "Success",
              `Member role updated successfully`
            );
          }
        } else {
          // Check if user already exists in the project
          const existingMembership = currentRoles.find(
            (membership) => membership.user.username === data.user.username
          );
          
          if (existingMembership) {
            // Update role override
            response = await projectApi.updateMembership(existingMembership.id, membershipData);
            
            setCurrentRoles((prevRoles) => 
              prevRoles.map(r => r.id === existingMembership.id ? response.content : r)
            );
            
             if (showNotification) {
              showNotification(
                "success",
                "Role Updated",
                `${data.user.username}'s role has been updated`
              );
            }
          } else {
            // Create new membership
            response = await projectApi.createMembership(membershipData);
            
            setCurrentRoles((prevRoles) => [...prevRoles, response.content]);
            
             if (showNotification) {
              showNotification(
                "success",
                "Member Added",
                `${data.user.username} has been added to the project`
              );
            }
          }
        }
        
        if (onSuccess) onSuccess();
        
        // Refresh to ensure consistency
        setTimeout(() => {
          fetchProjectMemberships(projectSlug);
        }, 500);
        
      } catch (saveErr: any) {
        console.error("Error in API call:", saveErr);
        
        // Extract error message
        let errorMessage = "Failed to save membership";
        if (saveErr.response?.data?.message) errorMessage = saveErr.response.data.message;
        else if (saveErr.response?.data?.error) errorMessage = saveErr.response.data.error;
        else if (saveErr.response?.data?.detail) errorMessage = saveErr.response.data.detail;
        else if (saveErr.message) errorMessage = saveErr.message;
        
        if (showNotification) {
          showNotification("error", "Error", errorMessage);
        }
      }
    } catch (err) {
      console.error("Unexpected error in saveMembership:", err);
      if (showNotification) {
        showNotification("error", "Unexpected Error", "An unexpected error occurred");
      }
    }
  };

  // Delete membership
  const deleteMembership = async (membership: any) => {
    if (window.confirm(`Are you sure you want to remove this user from the project?`)) {
      try {
        await projectApi.deleteMembership(membership.id);
        setCurrentRoles(currentRoles.filter((r) => r.id !== membership.id));
        if (showNotification) {
          showNotification("success", "Success", "Member removed from project successfully");
        }
      } catch (err) {
        console.error("Error deleting membership:", err);
        if (showNotification) {
          showNotification("error", "Error", "Failed to remove user from project");
        }
      }
    }
  };

  return {
    currentRoles,
    availableUsers,
    availableRoles,
    fetchProjectMemberships,
    fetchRoles,
    fetchUsers,
    saveMembership,
    deleteMembership,
    setCurrentRoles // Exposed in case manual updates needed
  };
}
