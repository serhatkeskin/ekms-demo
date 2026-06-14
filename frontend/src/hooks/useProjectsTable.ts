import { useState, useEffect, useCallback } from "react";
import projectApi from 'services/projectApi';

interface UseProjectsTableProps {
  initialPageSize?: number;
  permissions?: any; // Start with any, refine if PermissionContext type is available
  showNotification?: (color: string, title: string, content: string) => void;
}

export function useProjectsTable({ 
  initialPageSize = 10, 
  permissions,
  showNotification 
}: UseProjectsTableProps = {}) {
  // Data state
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [processedProjects, setProcessedProjects] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProjects, setTotalProjects] = useState(0);
  
  // Filtering state
  const [filterName, setFilterName] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Fetch projects
  const fetchProjects = useCallback(async (page = currentPage, size = pageSize, filters: any = {}) => {
    try {
      setLoadingData(true);
      
      const options = {
        page,
        size,
        ...filters
      };
      
      const response = await projectApi.getAllProjects(options);
      const projectsData = response.content.data.results;
      const pageInfo = response.content.data.page || {};
      
      const safeProjectsData = projectsData.map((project: any) => ({
        ...project,
        memberships: project.memberships || []
      }));
      
      setProjects(safeProjectsData);
      setTotalProjects(response.content.data.count || 0);
      setTotalPages(pageInfo.total || 1);
      
      // Reset processed state when new data arrives
      setProcessedProjects(false);
      
    } catch (err) {
      console.error("Error fetching projects:", err);
      if (showNotification) {
        showNotification("error", "Error", "Failed to load projects. Please try again later.");
      }
    } finally {
      setLoadingData(false);
    }
  }, [currentPage, pageSize, showNotification]);

  // Handle permissions processing
  useEffect(() => {
    if (permissions && !processedProjects && projects.length > 0) {
      permissions.processProjects(projects);
      setProcessedProjects(true);
    }
  }, [projects, permissions, processedProjects]);

  // Initial fetch and fetch on filter/page change
  // Note: We're watching specific dependencies to trigger fetch
  useEffect(() => {
    fetchProjects(currentPage, pageSize, {
      name: filterName,
      status: filterStatus
    });
  }, [currentPage, pageSize, filterName, filterStatus]);

  // Handlers
  const handlePageChange = (newPage: number) => setCurrentPage(newPage);
  
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };
  
  const handleFilterNameChange = (event: any) => {
    setFilterName(event.target.value);
    setCurrentPage(1);
  };
  
  const handleFilterStatusChange = (event: any) => {
    setFilterStatus(event.target.value);
    setCurrentPage(1);
  };
  
  const applyFilters = () => {
    fetchProjects(1, pageSize, {
      name: filterName,
      status: filterStatus
    });
  };
  
  const resetFilters = () => {
    setFilterName("");
    setFilterStatus("all");
    // The useEffect will trigger fetch when these change, but we might want to ensure it happens
    // Since we set state, useEffect will fire.
  };

  // Delete project
  const deleteProject = async (project: any) => {
    if (window.confirm(`Are you sure you want to delete the project "${project.name}"?`)) {
      try {
        await projectApi.deleteProject(project.slug);
        if (showNotification) {
          showNotification("success", "Success", "Project deleted successfully");
        }
        
        // Refresh
        fetchProjects(currentPage, pageSize, {
          name: filterName,
          status: filterStatus
        });
      } catch (err) {
        console.error("Error deleting project:", err);
        if (showNotification) {
          showNotification("error", "Error", "Failed to delete project");
        }
      }
    }
  };

  return {
    projects,
    loadingData,
    pagination: {
      currentPage,
      pageSize,
      totalPages,
      totalProjects,
      onPageChange: handlePageChange,
      onPageSizeChange: handlePageSizeChange
    },
    filters: {
      name: filterName,
      status: filterStatus,
      onNameChange: handleFilterNameChange,
      onStatusChange: handleFilterStatusChange,
      apply: applyFilters,
      reset: resetFilters
    },
    fetchProjects, // Expose for manual refresh
    deleteProject
  };
}
