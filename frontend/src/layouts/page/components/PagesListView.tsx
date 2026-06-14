import React, { useState, useRef, useCallback } from 'react';
import {
  Card,
  IconButton,
  Avatar,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  TableContainer,
  Paper,
  Box
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  DescriptionOutlined as PageIcon
} from '@mui/icons-material';

// EKMS React components
import MDBox from "components/MDBox/MDBox";
import MDTypography from 'components/MDTypography/MDTypography';

/**
 * PagesListView - A component for displaying pages in a list view format with resizable columns
 * 
 * @param {Object} props
 * @param {Array} props.pages - The array of pages to display
 * @param {Function} props.handlePageClick - Function to handle when a page is clicked
 * @param {Function} props.handleMenuOpen - Function to handle when the menu icon is clicked
 * @param {String} props.selectedProject - The currently selected project slug
 * @param {Function} props.getStatusBadge - Function to get the status badge for a page
 * @param {String} props.searchQuery - Current search query for highlighting
 * @param {Array} props.projects - The array of all projects
 */
function PagesListView({ 
  pages, 
  handlePageClick, 
  handleMenuOpen, 
  selectedProject,
  getStatusBadge,
  searchQuery = '',
  projects = []
}: any) {
  
  // Initial column widths (in pixels for better control) - load from localStorage if available
  const getInitialColumnWidths = () => {
    const savedWidths = localStorage.getItem('pagesListColumnWidths');
    if (savedWidths) {
      try {
        return JSON.parse(savedWidths);
      } catch (e) {
        console.warn('Failed to parse saved column widths, using defaults');
      }
    }
    return {
      icon: 80,
      title: 300,
      status: 120,
      author: 180,
      project: 200,
      updated: 140,
      actions: 100
    };
  };

  const [columnWidths, setColumnWidths] = useState(getInitialColumnWidths);

  const tableRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState(null);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // Function to highlight search terms in text
  const highlightSearchTerm = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <span key={index} style={{ backgroundColor: '#fff3cd', fontWeight: 'bold' }}>
          {part}
        </span>
      ) : part
    );
  };

  // Handle mouse down on resize handle
  const handleMouseDown = useCallback((e, columnName) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setResizingColumn(columnName);
    setStartX(e.clientX);
    setStartWidth(columnWidths[columnName]);
    
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [columnWidths]);

  // Handle mouse move during resize
  const handleMouseMove = useCallback((e) => {
    if (!isResizing || !resizingColumn) return;
    
    const diff = e.clientX - startX;
    const newWidth = Math.max(50, startWidth + diff); // Minimum width of 50px
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }));
  }, [isResizing, resizingColumn, startX, startWidth]);

  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizingColumn(null);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Save column widths to localStorage whenever they change
  React.useEffect(() => {
    localStorage.setItem('pagesListColumnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

  // Add event listeners for mouse move and up
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Resize handle component
  const ResizeHandle = ({ columnName }: any) => (
    <Box
      sx={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '4px',
        cursor: 'col-resize',
        backgroundColor: 'transparent',
        '&:hover': {
          backgroundColor: 'primary.main',
        },
        zIndex: 10
      }}
      onMouseDown={(e) => handleMouseDown(e, columnName)}
    />
  );

  return (
    <Card sx={{ mb: 3 }}>
      <TableContainer component={Paper}>
        <Table 
          ref={tableRef}
          stickyHeader 
          size="small" 
          sx={{ 
            tableLayout: 'fixed',
            width: Object.values(columnWidths).reduce((sum: number, width: number) => sum + width, 0)
          }}
        >
          <colgroup>
            <col style={{ width: columnWidths.icon }} />
            <col style={{ width: columnWidths.title }} />
            <col style={{ width: columnWidths.status }} />
            <col style={{ width: columnWidths.author }} />
            <col style={{ width: columnWidths.project }} />
            <col style={{ width: columnWidths.updated }} />
            <col style={{ width: columnWidths.actions }} />
          </colgroup>
          <TableHead sx={{ display: "table-header-group" }}>
            <TableRow>
              <DataTableHeadCell width={columnWidths.icon} align="center" resizable>
                Icon
                <ResizeHandle columnName="icon" />
              </DataTableHeadCell>
              <DataTableHeadCell width={columnWidths.title} resizable>
                Title
                <ResizeHandle columnName="title" />
              </DataTableHeadCell>
              <DataTableHeadCell width={columnWidths.status} resizable>
                Status
                <ResizeHandle columnName="status" />
              </DataTableHeadCell>
              <DataTableHeadCell width={columnWidths.author} resizable>
                Author
                <ResizeHandle columnName="author" />
              </DataTableHeadCell>
              <DataTableHeadCell width={columnWidths.project} resizable>
                Project
                <ResizeHandle columnName="project" />
              </DataTableHeadCell>
              <DataTableHeadCell width={columnWidths.updated} resizable>
                Last Updated
                <ResizeHandle columnName="updated" />
              </DataTableHeadCell>
              <DataTableHeadCell width={columnWidths.actions} align="center">
                Actions
                {/* No resize handle for the last column */}
              </DataTableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pages.map((page) => (
              <TableRow 
                key={page.id}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: '#f9f9f9' }
                }}
                onClick={() => handlePageClick(page)}
              >
                <DataTableBodyCell width={columnWidths.icon} align="center">
                  {page.icon ? (
                    <MDTypography variant="h6">
                      {page.icon}
                    </MDTypography>
                  ) : (
                    <PageIcon color="warning" />
                  )}
                </DataTableBodyCell>
                <DataTableBodyCell width={columnWidths.title}>
                  <MDBox>
                    <MDTypography variant="body2" fontWeight="medium">
                      {highlightSearchTerm(page.title, searchQuery)}
                    </MDTypography>
                    {page.child_count > 0 && (
                      <MDTypography variant="caption" color="text">
                        {page.child_count} subpage{page.child_count !== 1 ? 's' : ''}
                      </MDTypography>
                    )}
                    {selectedProject === 'allPages' && page.parent && (
                      <MDBox mt={0.5}>
                        {page.breadcrumbs ? (
                          <MDTypography variant="caption" color="text">
                            Path: {highlightSearchTerm(
                              page.breadcrumbs.map(crumb => crumb.title).join(' > '), 
                              searchQuery
                            )}
                          </MDTypography>
                        ) : (
                          <MDTypography variant="caption" color="text">
                            Subpage
                          </MDTypography>
                        )}
                      </MDBox>
                    )}
                  </MDBox>
                </DataTableBodyCell>
                <DataTableBodyCell width={columnWidths.status}>
                  {getStatusBadge(page.status)}
                </DataTableBodyCell>
                <DataTableBodyCell width={columnWidths.author}>
                  <MDBox display="flex" alignItems="center">
                    <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                      {page.created_by?.username?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                    <MDTypography variant="body2" noWrap>
                      {highlightSearchTerm(
                        page.created_by?.username || page.created_by || 'Unknown',
                        searchQuery
                      )}
                    </MDTypography>
                  </MDBox>
                </DataTableBodyCell>
                <DataTableBodyCell width={columnWidths.project}>
                  <MDTypography variant="body2" noWrap>
                    {highlightSearchTerm(projects.find(p => p.slug === page.project)?.name || page.project, searchQuery)}
                  </MDTypography>
                </DataTableBodyCell>
                <DataTableBodyCell width={columnWidths.updated}>
                  <MDTypography variant="body2" noWrap>
                    {new Date(page.updated_at).toLocaleDateString()}
                  </MDTypography>
                </DataTableBodyCell>
                <DataTableBodyCell width={columnWidths.actions} align="center">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, page);
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </DataTableBodyCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

// Custom table header cell component for consistent styling with resize capability
function DataTableHeadCell({ children, align = "left", width, resizable = false }: any) {
  return (
    <TableCell 
      sx={{ 
        textAlign: align,
        backgroundColor: '#f5f5f5',
        fontWeight: 'bold',
        padding: '12px 16px',
        borderBottom: '1px solid rgba(224, 224, 224, 1)',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        boxSizing: 'border-box',
        width: width,
        position: 'relative',
        borderRight: resizable ? '1px solid rgba(224, 224, 224, 0.5)' : 'none'
      }}
    >
      {children}
    </TableCell>
  );
}

// Custom table body cell component for consistent styling with headers
function DataTableBodyCell({ children, align = "left", width }: any) {
  return (
    <TableCell 
      sx={{ 
        textAlign: align,
        padding: '12px 16px',
        borderBottom: '1px solid rgba(224, 224, 224, 1)',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        boxSizing: 'border-box',
        width: width
      }}
    >
      {children}
    </TableCell>
  );
}

export default PagesListView;