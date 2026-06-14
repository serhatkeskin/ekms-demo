// src/components/Pages/components/PDFExportButton.tsx
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { PDFExporter, pdfDefaultSchemaMappings } from "@blocknote/xl-pdf-exporter";
import * as ReactPDF from "@react-pdf/renderer";
import { Text } from "@react-pdf/renderer";
import MDButton from 'components/MDButton/MDButton';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
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
    ...pdfDefaultSchemaMappings
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
        console.warn('Error processing image in PDF export:', error);
        // Return a fallback text element indicating image couldn't be included
        return <Text style={{ fontStyle: 'italic', color: '#888888' }}>[Image could not be included]</Text>;
      }
    };
  }

  return customMappings;
};

/**
 * Custom hook for PDF export functionality
 */
export const usePDFExport = (editor: any, pageTitle: string = 'Document') => {
  const [isExporting, setIsExporting] = useState(false);

  const exportPDF = useCallback(async () => {
    if (!editor) return;

    try {
      setIsExporting(true);

      // Create filename based on page title
      const filename = `${pageTitle || 'Document'}.pdf`.replace(/[/\\?%*:|"<>]/g, '_');

      // Custom options to handle image issues
      const exporterOptions = {
        resolveFileUrl: safeImageFetch,
        skipImageErrors: true,
        emojiSource: {
          format: "png",
          url: "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/",
        }
      };

      // Create exporter instance with custom mappings and options
      const exporter = new PDFExporter(
        editor.schema,
        createCustomMappings(),
        exporterOptions
      );

      // Create header and footer for the PDF
      const header = (
        <Text style={{ textAlign: 'center', margin: 10, fontSize: 10, color: '#666' }}>
          {pageTitle}
        </Text>
      );

      const footer = (
        <Text style={{ textAlign: 'center', margin: 10, fontSize: 8, color: '#666' }}>
          Page <Text render={({ pageNumber, totalPages }: any) => `${pageNumber} of ${totalPages}`} />
        </Text>
      );

      // Convert editor content to PDF format
      const pdfDocument = await exporter.toReactPDFDocument(editor.document, {
        header: header,
        footer: footer
      } as any);

      // Create a blob URL for the PDF
      const blob = await ReactPDF.pdf(pdfDocument).toBlob();
      const url = URL.createObjectURL(blob);

      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('PDF export completed successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again or export as DOCX instead.');
    } finally {
      setIsExporting(false);
    }
  }, [editor, pageTitle]);

  return { exportPDF, isExporting };
};

/**
 * Button component to export page content as PDF
 */
const PDFExportButton = ({ editor, pageTitle, disabled }: any) => {
  const { exportPDF, isExporting } = usePDFExport(editor, pageTitle);

  return (
    <MDButton
      variant="contained"
      color="dark"
      onClick={exportPDF}
      disabled={disabled || isExporting}
      startIcon={isExporting ? <CircularProgress size={20} color="inherit" /> : <PictureAsPdfIcon />}
      title="Export as PDF Document"
    >
      {isExporting ? 'Exporting...' : 'PDF'}
    </MDButton>
  );
};

PDFExportButton.propTypes = {
  editor: PropTypes.object.isRequired,
  pageTitle: PropTypes.string,
  disabled: PropTypes.bool
};

PDFExportButton.defaultProps = {
  pageTitle: 'Document',
  disabled: false
};

export default PDFExportButton;
