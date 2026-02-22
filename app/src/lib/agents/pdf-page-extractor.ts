/**
 * Extract specific pages from a PDF using pdf-lib.
 * Creates new PDF buffers containing only the requested pages,
 * so each sub-agent receives only what it needs.
 */

import { PDFDocument } from 'pdf-lib';

/**
 * Extract specific pages from a PDF and return a new PDF as base64.
 * pageNumbers are 1-indexed (matching the manifest).
 */
export async function extractPages(
  pdfBase64: string,
  pageNumbers: number[]
): Promise<string> {
  const sourceBytes = Buffer.from(pdfBase64, 'base64');
  const sourcePdf = await PDFDocument.load(sourceBytes);
  const totalPages = sourcePdf.getPageCount();

  // Convert to 0-indexed and filter valid indices
  const indices = pageNumbers
    .map((p) => p - 1)
    .filter((i) => i >= 0 && i < totalPages);

  if (indices.length === 0) {
    // Return the original PDF if no valid pages specified
    return pdfBase64;
  }

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(sourcePdf, indices);
  copiedPages.forEach((page: any) => newPdf.addPage(page));

  const newBytes = await newPdf.save();
  return Buffer.from(newBytes).toString('base64');
}

/**
 * Get total page count from a PDF.
 */
export async function getPageCount(pdfBase64: string): Promise<number> {
  const bytes = Buffer.from(pdfBase64, 'base64');
  const pdf = await PDFDocument.load(bytes);
  return pdf.getPageCount();
}
