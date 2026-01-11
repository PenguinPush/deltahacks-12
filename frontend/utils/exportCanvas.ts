import { toPng, toSvg } from 'html-to-image';
// import { getRectOfNodes, getTransformForBounds } from 'reactflow';

/**
 * Export options
 */
interface ExportOptions {
  backgroundColor?: string;
  padding?: number;
  quality?: number;
}

/**
 * Get the React Flow viewport element
 */
function getViewportElement(): HTMLElement | null {
  return document.querySelector('.react-flow__viewport');
}


/**
 * Export canvas as PNG
 *
 * TODO: Add watermark option
 * TODO: Add resolution options
 * TODO: Add selected nodes only export
 */
export async function exportCanvasAsPng(
  filename: string = 'workflow',
  options: ExportOptions = {}
): Promise<void> {
  const { backgroundColor = '#0A0A0A', padding = 50, quality = 1 } = options;

  const viewport = getViewportElement();
  if (!viewport) {
    throw new Error('React Flow viewport not found');
  }

  try {
    const dataUrl = await toPng(viewport, {
      backgroundColor,
      cacheBust: true,
      pixelRatio: quality * 2,
      style: {
        padding: `${padding}px`,
      },
    });

    // Download
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Failed to export as PNG:', error);
    throw error;
  }
}

/**
 * Export canvas as SVG
 *
 * TODO: Add font embedding
 * TODO: Add style inlining
 */
export async function exportCanvasAsSvg(
  filename: string = 'workflow',
  options: ExportOptions = {}
): Promise<void> {
  const { backgroundColor = '#0A0A0A', padding = 50 } = options;

  const viewport = getViewportElement();
  if (!viewport) {
    throw new Error('React Flow viewport not found');
  }

  try {
    const dataUrl = await toSvg(viewport, {
      backgroundColor,
      cacheBust: true,
      style: {
        padding: `${padding}px`,
      },
    });

    // Download
    const link = document.createElement('a');
    link.download = `${filename}.svg`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Failed to export as SVG:', error);
    throw error;
  }
}

/**
 * Export canvas as JSON
 */
export function exportCanvasAsJson(
  workflow: unknown,
  filename: string = 'workflow'
): void {
  const json = JSON.stringify(workflow, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.download = `${filename}.json`;
  link.href = url;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Copy canvas as image to clipboard
 */
export async function copyCanvasToClipboard(): Promise<void> {
  const viewport = getViewportElement();
  if (!viewport) {
    throw new Error('React Flow viewport not found');
  }

  try {
    const dataUrl = await toPng(viewport, {
      backgroundColor: '#0A0A0A',
      cacheBust: true,
      pixelRatio: 2,
    });

    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Copy to clipboard
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    throw error;
  }
}

/**
 * Generate thumbnail for workflow
 */
export async function generateThumbnail(
  maxWidth: number = 400,
  maxHeight: number = 300
): Promise<string> {
  const viewport = getViewportElement();
  if (!viewport) {
    throw new Error('React Flow viewport not found');
  }

  try {
    const dataUrl = await toPng(viewport, {
      backgroundColor: '#0A0A0A',
      cacheBust: true,
      width: maxWidth,
      height: maxHeight,
      style: {
        transform: `scale(${Math.min(maxWidth / viewport.offsetWidth, maxHeight / viewport.offsetHeight)})`,
        transformOrigin: 'top left',
      },
    });

    return dataUrl;
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    throw error;
  }
}

export default {
  exportCanvasAsPng,
  exportCanvasAsSvg,
  exportCanvasAsJson,
  copyCanvasToClipboard,
  generateThumbnail,
};
