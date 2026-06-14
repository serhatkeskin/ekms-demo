// PageActions.tsx - Modern floating toolbar design
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SnapshotManager from 'components/Pages/components/SnapshotManager';
import { usePDFExport } from 'components/Pages/components/PDFExportButton';
import { useDOCXExport } from 'components/Pages/components/DOCXExportButton';

// Styled toolbar container
const ToolbarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 16px',
  marginBottom: '20px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '12px',
  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
}));

// Styled button group
const ButtonGroup = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
});

// Styled action button
const ActionButton = styled(IconButton)<{ component?: React.ElementType }>(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.9)',
  padding: '10px 16px',
  borderRadius: '8px',
  fontSize: '0.8125rem',
  fontWeight: 500,
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: '#ffffff',
    transform: 'translateY(-1px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&.Mui-disabled': {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.25rem',
  },
}));

// Styled divider
const ToolbarDivider = styled(Divider)({
  height: '24px',
  margin: '0 8px',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
});

// Button label component
const ButtonLabel = styled('span')({
  fontSize: '0.8125rem',
  fontWeight: 500,
  letterSpacing: '0.02em',
});

const PageActions = ({
  slug,
  pageTitle,
  contentRef,
  hasCoverImage,
  isSaving,
  clonePage,
  onSnapshotRestored,
  canClone,
  canExport,
  canCreateSnapshots,
  editor,
  refreshEditor,
  isRefreshing
}: any) => {
  const navigate = useNavigate();

  // Use export hooks
  const { exportPDF, isExporting: isExportingPDF } = usePDFExport(editor, pageTitle);
  const { exportDOCX, isExporting: isExportingDOCX } = useDOCXExport(editor, pageTitle);

  return (
    <ToolbarContainer>
      {/* Left side - Navigation */}
      <ButtonGroup>
        <Tooltip title="Go back to previous page" arrow placement="bottom">
          <ActionButton onClick={() => navigate(-1)}>
            <ArrowBackIcon />
            <ButtonLabel>Back</ButtonLabel>
          </ActionButton>
        </Tooltip>
      </ButtonGroup>

      {/* Right side - Actions */}
      <ButtonGroup>
        {/* Refresh */}
        <Tooltip title="Refresh editor content from server" arrow placement="bottom">
          <span>
            <ActionButton
              onClick={refreshEditor}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <CircularProgress size={20} sx={{ color: 'rgba(255,255,255,0.9)' }} />
              ) : (
                <RefreshIcon />
              )}
              <ButtonLabel>{isRefreshing ? 'Refreshing...' : 'Refresh'}</ButtonLabel>
            </ActionButton>
          </span>
        </Tooltip>

        <ToolbarDivider orientation="vertical" flexItem />

        {/* Snapshots */}
        {canCreateSnapshots && (
          <SnapshotManager
            slug={slug}
            onSnapshotRestored={onSnapshotRestored}
            canCreateSnapshots={canCreateSnapshots}
            variant="toolbar"
          />
        )}

        {/* Clone */}
        {canClone && (
          <Tooltip title="Create a copy of this page" arrow placement="bottom">
            <span>
              <ActionButton
                onClick={clonePage}
                disabled={isSaving}
              >
                <ContentCopyIcon />
                <ButtonLabel>Clone</ButtonLabel>
              </ActionButton>
            </span>
          </Tooltip>
        )}

        {/* Export buttons - rendered directly for consistency */}
        {editor && canExport && (
          <>
            <ToolbarDivider orientation="vertical" flexItem />

            {/* PDF Export */}
            <Tooltip title="Export as PDF Document" arrow placement="bottom">
              <span>
                <ActionButton
                  onClick={exportPDF}
                  disabled={!canExport || isExportingPDF}
                >
                  {isExportingPDF ? (
                    <CircularProgress size={20} sx={{ color: 'rgba(255,255,255,0.9)' }} />
                  ) : (
                    <PictureAsPdfIcon />
                  )}
                  <ButtonLabel>{isExportingPDF ? 'Exporting...' : 'PDF'}</ButtonLabel>
                </ActionButton>
              </span>
            </Tooltip>

            {/* DOCX Export */}
            <Tooltip title="Export as Word Document" arrow placement="bottom">
              <span>
                <ActionButton
                  onClick={exportDOCX}
                  disabled={!canExport || isExportingDOCX}
                >
                  {isExportingDOCX ? (
                    <CircularProgress size={20} sx={{ color: 'rgba(255,255,255,0.9)' }} />
                  ) : (
                    <FileDownloadIcon />
                  )}
                  <ButtonLabel>{isExportingDOCX ? 'Exporting...' : 'DOCX'}</ButtonLabel>
                </ActionButton>
              </span>
            </Tooltip>
          </>
        )}
      </ButtonGroup>
    </ToolbarContainer>
  );
};

export default PageActions;
