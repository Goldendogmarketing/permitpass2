/**
 * PDF Processing utilities for plan review
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

export interface ProcessedPage {
  pageNumber: number;
  imagePath: string;
  width: number;
  height: number;
}

export interface ProcessedPDF {
  originalName: string;
  pageCount: number;
  pages: ProcessedPage[];
  outputDir: string;
}

/**
 * Convert PDF to high-resolution PNG images using pdftoppm
 */
export async function convertPDFToImages(
  pdfPath: string,
  outputDir: string,
  dpi: number = 300
): Promise<ProcessedPDF> {
  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  const baseName = path.basename(pdfPath, '.pdf');
  const outputPrefix = path.join(outputDir, baseName);

  // Convert PDF to PNG images at specified DPI
  await execAsync(`pdftoppm -png -r ${dpi} "${pdfPath}" "${outputPrefix}"`);

  // Find all generated images
  const files = await fs.readdir(outputDir);
  const imageFiles = files
    .filter((f) => f.startsWith(baseName) && f.endsWith('.png'))
    .sort();

  const pages: ProcessedPage[] = imageFiles.map((file, index) => ({
    pageNumber: index + 1,
    imagePath: path.join(outputDir, file),
    width: 0, // Will be populated if needed
    height: 0,
  }));

  return {
    originalName: path.basename(pdfPath),
    pageCount: pages.length,
    pages,
    outputDir,
  };
}

/**
 * Get PDF info (page count, dimensions)
 */
export async function getPDFInfo(pdfPath: string): Promise<{
  pageCount: number;
  title?: string;
  author?: string;
}> {
  try {
    const { stdout } = await execAsync(`pdfinfo "${pdfPath}"`);
    
    const pageMatch = stdout.match(/Pages:\s+(\d+)/);
    const titleMatch = stdout.match(/Title:\s+(.+)/);
    const authorMatch = stdout.match(/Author:\s+(.+)/);

    return {
      pageCount: pageMatch ? parseInt(pageMatch[1]) : 0,
      title: titleMatch ? titleMatch[1].trim() : undefined,
      author: authorMatch ? authorMatch[1].trim() : undefined,
    };
  } catch (error) {
    console.error('Error getting PDF info:', error);
    return { pageCount: 0 };
  }
}

/**
 * Clean up temporary files
 */
export async function cleanupProcessedFiles(outputDir: string): Promise<void> {
  try {
    await fs.rm(outputDir, { recursive: true, force: true });
  } catch (error) {
    console.error('Error cleaning up files:', error);
  }
}
