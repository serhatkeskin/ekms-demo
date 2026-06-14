import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { PageSettings, PdfExportOptions } from 'types';

const defaultPageSettings: PageSettings = {
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4',
  compress: true
};

export const generatePagePdf = async ({
  filename = 'page-export.pdf',
  pageTitle,
  contentElement,
  onProgress,
  includeCover = true,
  pageSettings = defaultPageSettings
}: PdfExportOptions): Promise<Blob> => {
  if (!contentElement) {
    throw new Error('Content element is required');
  }

  const pdf = new jsPDF({
    orientation: pageSettings.orientation,
    unit: pageSettings.unit,
    format: pageSettings.format,
    compress: pageSettings.compress
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pdfWidth - (margin * 2);

  pdf.setFontSize(18);
  pdf.text(pageTitle, margin, margin + 10);
  pdf.setFontSize(12);

  let currentY = margin + 20;
  const blockElements = [...contentElement.querySelectorAll('.block')];
  const totalBlocks = blockElements.length;

  if (includeCover) {
    const coverImage = contentElement.querySelector('.page-cover-image') as HTMLElement | null;
    if (coverImage) {
      try {
        const canvas = await html2canvas(coverImage, {
          scale: 2,
          logging: false,
          useCORS: true
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.8);

        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (imgData && imgData !== 'data:,') {
          pdf.addImage(imgData, 'JPEG', margin, currentY, imgWidth, imgHeight);
          currentY += imgHeight + 10;
        }

        onProgress?.(5);
      } catch (imgError) {
        console.warn('Error adding cover image to PDF:', imgError);
      }
    }
  }

  for (let i = 0; i < blockElements.length; i++) {
    const block = blockElements[i] as HTMLElement;
    if (!block.textContent?.trim()) continue;

    const contentWrapper = block.querySelector('.block-content-wrapper') as HTMLElement | null;
    if (!contentWrapper) continue;

    try {
      const canvas = await html2canvas(contentWrapper, {
        scale: 2,
        logging: false,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.8);
      if (!imgData || imgData === 'data:,') continue;

      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (currentY + imgHeight > pdfHeight - margin) {
        pdf.addPage();
        currentY = margin;
      }

      pdf.addImage(imgData, 'JPEG', margin, currentY, imgWidth, imgHeight);
      currentY += imgHeight + 5;
    } catch (blockError) {
      console.warn(`Error processing block ${i}:`, blockError);
      continue;
    }

    onProgress?.(5 + Math.floor((i / totalBlocks) * 90));
  }

  onProgress?.(100);
  return pdf.output('blob');
};

export const downloadPdf = (pdfBlob: Blob, filename: string): void => {
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
};

export const sanitizeFilename = (title: string): string => {
  return title
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/__+/g, '_')
    .slice(0, 100);
};

export default {
  generatePagePdf,
  downloadPdf,
  sanitizeFilename
};
