// src/components/Pages/components/DOCXExportButton.tsx
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { DOCXExporter, docxDefaultSchemaMappings } from "@blocknote/xl-docx-exporter";
import { Packer } from "docx";
import MDButton from 'components/MDButton/MDButton';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CircularProgress from '@mui/material/CircularProgress';

// Custom function to safely fetch images
const safeImageFetch = async (url: string) => {
  try {
    // For data URLs, return directly
    if (url.startsWith('data:')) {
      return url;
    }

    // For regular URLs, fetch with CORS mode
    const response = await fetch(url, {
      mode: 'cors',
      cache: 'force-cache',
    });

    if (!response.ok) {
      console.warn(`Failed to fetch image from ${url}`, response.status);
      return null;
    }

    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.warn(`Failed to fetch image from ${url}`, error);
    return null;
  }
};

// Custom mapping function to handle images safely
const createCustomMappings = () => {
  // Start with default mappings
  const customMappings: any = {
    ...docxDefaultSchemaMappings
  };

  // Override the image mapping to handle errors gracefully
  if (customMappings.blockMapping && customMappings.blockMapping.image) {
    const originalImageMapping = customMappings.blockMapping.image;

    customMappings.blockMapping.image = async (block: any, exporter: any) => {
      try {
        // If the block has a URL, try to process it
        if (block.props && block.props.url) {
          return await originalImageMapping(block, exporter);
        }
        return null;
      } catch (error) {
        console.warn('Error processing image in DOCX export:', error);
        // Return a fallback paragraph indicating image couldn't be included
        return exporter.createParagraph({
          children: exporter.createTextRun({
            text: "[Image could not be included]",
            italic: true,
            color: "888888"
          })
        });
      }
    };
  }

  return customMappings;
};

/**
 * Custom hook for DOCX export functionality
 */
export const useDOCXExport = (editor: any, pageTitle: string = 'Document') => {
  const [isExporting, setIsExporting] = useState(false);

  const exportDOCX = useCallback(async () => {
    if (!editor) return;

    try {
      setIsExporting(true);

      // Create filename based on page title
      const filename = `${pageTitle || 'Document'}.docx`.replace(/[/\\?%*:|"<>]/g, '_');

      // Custom options to handle image issues
      const exporterOptions = {
        resolveFileUrl: safeImageFetch,
        skipImageErrors: true,
      };

      // Create exporter instance with custom mappings and options
      const exporter = new DOCXExporter(
        editor.schema,
        createCustomMappings(),
        exporterOptions
      );

      // Convert editor content to DOCX format
      const docxDocument = await exporter.toDocxJsDocument(editor.document, {
        sectionOptions: {},
        documentOptions: {
          title: pageTitle,
          creator: "BlockNote Editor",
          description: `Export of "${pageTitle}"`,
        }
      } as any);

      // Use the browser-compatible method to generate a blob directly
      const blob = await Packer.toBlob(docxDocument);

      // Create download link and trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('DOCX export completed successfully');
    } catch (error) {
      console.error('Error exporting DOCX:', error);
      alert('Failed to export DOCX. Please try again or export as PDF instead.');
    } finally {
      setIsExporting(false);
    }
  }, [editor, pageTitle]);

  return { exportDOCX, isExporting };
};

/**
 * Button component to export page content as DOCX
 */
const DOCXExportButton = ({ editor, pageTitle, disabled }: any) => {
  const { exportDOCX, isExporting } = useDOCXExport(editor, pageTitle);

  return (
    <MDButton
      variant="contained"
      color="dark"
      onClick={exportDOCX}
      disabled={disabled || isExporting}
      startIcon={isExporting ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
      title="Export as Word Document"
    >
      {isExporting ? 'Exporting...' : 'DOCX'}
    </MDButton>
  );
};

DOCXExportButton.propTypes = {
  editor: PropTypes.object.isRequired,
  pageTitle: PropTypes.string,
  disabled: PropTypes.bool
};

DOCXExportButton.defaultProps = {
  pageTitle: 'Document',
  disabled: false
};

export default DOCXExportButton;
