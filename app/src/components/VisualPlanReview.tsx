'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { pdfjs } from 'react-pdf';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
} from 'lucide-react';

// Local worker — no CDN dependency, no network failure risk
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/* ═══════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════ */

export interface VisualAnnotation {
  page: number;
  x: number;
  y: number;
  type: 'PASS' | 'FAIL' | 'VERIFY' | 'N/A';
  label: string;
  detail: string;
  category: string;
  checkId: string;
  codeReference: string;
  approximate?: boolean;
}

interface Props {
  fileUrl: string;
  annotations: VisualAnnotation[];
  loading?: boolean;
}

type PageImage = {
  dataUrl: string;
  width: number;
  height: number;
};

/* ═══════════════════════════════════════════════════════════════════════
   PDF → STATIC IMAGE CAPTURE HOOK
   Renders every PDF page to a canvas, converts to PNG data URLs.
   Once captured, pages display as plain <img> tags — cannot fail.
   ═══════════════════════════════════════════════════════════════════════ */

function usePdfCapture(fileUrl: string | null) {
  const [pages, setPages] = useState<Map<number, PageImage>>(new Map());
  const [numPages, setNumPages] = useState(0);
  const [capturingPage, setCapturingPage] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileUrl) return;

    let cancelled = false;

    const capture = async () => {
      setReady(false);
      setError(null);
      setPages(new Map());
      setCapturingPage(0);

      try {
        // Load the PDF document using pdfjs directly
        const loadingTask = pdfjs.getDocument(fileUrl);
        const pdf = await loadingTask.promise;

        if (cancelled) return;
        setNumPages(pdf.numPages);

        const captured = new Map<number, PageImage>();

        // Render every page to a static image
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          setCapturingPage(i);

          const page = await pdf.getPage(i);
          // Scale 2x for crisp images, even when zoomed
          const viewport = page.getViewport({ scale: 3 });

          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvas, viewport }).promise;

          const dataUrl = canvas.toDataURL('image/png');

          // Free canvas memory immediately
          canvas.width = 0;
          canvas.height = 0;

          captured.set(i, {
            dataUrl,
            width: viewport.width,
            height: viewport.height,
          });

          // Update progressively so first page shows in loading UI
          if (!cancelled) {
            setPages(new Map(captured));
          }
        }

        if (!cancelled) {
          setCapturingPage(0);
          setReady(true);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to capture PDF pages';
          console.error('PDF capture failed:', err);
          setError(msg);
          setCapturingPage(0);
        }
      }
    };

    capture();
    return () => { cancelled = true; };
  }, [fileUrl]);

  return { pages, numPages, capturingPage, ready, error };
}

/* ═══════════════════════════════════════════════════════════════════════
   STATUS STYLES
   ═══════════════════════════════════════════════════════════════════════ */

const STATUS_STYLES = {
  PASS: {
    bg: 'bg-green-500',
    border: 'border-green-400',
    ring: 'ring-green-400/30',
    text: 'text-green-700',
    bgLight: 'bg-green-50',
    borderLight: 'border-green-200',
    label: 'Pass',
  },
  FAIL: {
    bg: 'bg-red-500',
    border: 'border-red-400',
    ring: 'ring-red-400/30',
    text: 'text-red-700',
    bgLight: 'bg-red-50',
    borderLight: 'border-red-200',
    label: 'Fail',
  },
  VERIFY: {
    bg: 'bg-amber-500',
    border: 'border-amber-400',
    ring: 'ring-amber-400/30',
    text: 'text-amber-700',
    bgLight: 'bg-amber-50',
    borderLight: 'border-amber-200',
    label: 'Verify',
  },
  'N/A': {
    bg: 'bg-slate-400',
    border: 'border-slate-300',
    ring: 'ring-slate-300/30',
    text: 'text-slate-600',
    bgLight: 'bg-slate-50',
    borderLight: 'border-slate-200',
    label: 'N/A',
  },
};

/* ═══════════════════════════════════════════════════════════════════════
   ANNOTATION MARKER (overlay on plan image)
   ═══════════════════════════════════════════════════════════════════════ */

function StatusIcon({ status, size = 14 }: { status: string; size?: number }) {
  switch (status) {
    case 'PASS':
      return <CheckCircle2 style={{ width: size, height: size }} className="text-green-600" />;
    case 'FAIL':
      return <XCircle style={{ width: size, height: size }} className="text-red-600" />;
    case 'VERIFY':
      return <AlertCircle style={{ width: size, height: size }} className="text-amber-600" />;
    default:
      return null;
  }
}

function AnnotationMarker({
  annotation,
  index,
  isSelected,
  onClick,
}: {
  annotation: VisualAnnotation;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const style = STATUS_STYLES[annotation.type] || STATUS_STYLES['N/A'];

  return (
    <div
      className="absolute z-20 cursor-pointer group annotation-marker"
      style={{
        left: `${Math.min(Math.max(annotation.x, 2), 98)}%`,
        top: `${Math.min(Math.max(annotation.y, 2), 98)}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onClick={onClick}
    >
      {/* Pulse ring for FAIL items */}
      {annotation.type === 'FAIL' && (
        <span
          className={`absolute inset-0 w-10 h-10 -m-1 rounded-full ${style.bg} opacity-30 animate-ping`}
        />
      )}

      {/* Main marker */}
      <div
        className={`relative w-8 h-8 rounded-full ${style.bg} border-2 border-white shadow-lg
          flex items-center justify-center text-white text-xs font-bold
          transition-all duration-200
          ${isSelected ? `ring-4 ${style.ring} scale-125` : 'hover:scale-110'}
        `}
      >
        {index + 1}
      </div>

      {/* Hover tooltip — shows label, code ref, and finding detail */}
      <div
        className={`absolute left-10 top-1/2 -translate-y-1/2 max-w-xs w-64
          bg-white rounded-lg shadow-xl border px-3 py-2.5 pointer-events-none
          opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30
          ${isSelected ? 'opacity-100 pointer-events-auto' : ''}
        `}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <StatusIcon status={annotation.type} size={14} />
          <span className={`text-xs font-bold ${style.text}`}>{annotation.label}</span>
        </div>
        <p className="text-[11px] text-slate-500 font-mono mb-1">{annotation.codeReference}</p>
        <p className="text-xs text-slate-700 leading-relaxed">{annotation.detail}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SIDEBAR FINDING CARD
   ═══════════════════════════════════════════════════════════════════════ */

function FindingCard({
  annotation,
  index,
  isSelected,
  onClick,
}: {
  annotation: VisualAnnotation;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const style = STATUS_STYLES[annotation.type] || STATUS_STYLES['N/A'];

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg border transition-all duration-200
        ${isSelected
          ? `${style.bgLight} ${style.borderLight} shadow-sm`
          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
        }
      `}
    >
      <div className="flex items-start gap-2">
        <div
          className={`flex-shrink-0 w-5 h-5 rounded-full ${style.bg}
            flex items-center justify-center text-white text-[9px] font-bold mt-0.5`}
        >
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusIcon status={annotation.type} size={14} />
            <span className={`text-xs font-semibold ${style.text}`}>
              {style.label}
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
              {annotation.checkId}
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
              {annotation.codeReference}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-800 mt-1">
            {annotation.label}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            {annotation.detail}
          </p>
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════════ */

export function VisualPlanReview({ fileUrl, annotations, loading = false }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);

  // Annotation visibility toggles
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [visibleStatuses, setVisibleStatuses] = useState<Set<string>>(
    new Set(['PASS', 'FAIL', 'VERIFY'])
  );

  // Pan (drag-to-scroll) state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState({ x: 0, y: 0 });

  // Refs
  const viewerRef = useRef<HTMLDivElement>(null);
  const [fitWidth, setFitWidth] = useState<number | null>(null);

  // PDF → static image capture (runs in parallel with annotation loading)
  const { pages, numPages, capturingPage, ready, error } = usePdfCapture(fileUrl);

  const currentImage = pages.get(currentPage);

  // ─── Compute "fit to width" base ────────────────────────────────────
  const computeFitWidth = useCallback(() => {
    if (!viewerRef.current) return;
    const containerWidth = viewerRef.current.clientWidth - 32; // 16px padding each side
    setFitWidth(containerWidth);
  }, []);

  useEffect(() => {
    computeFitWidth();
    window.addEventListener('resize', computeFitWidth);
    return () => window.removeEventListener('resize', computeFitWidth);
  }, [computeFitWidth, ready]);

  // ─── Ctrl/Cmd + mouse wheel zoom ───────────────────────────────────
  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom((prev) => {
        const next = Math.round((prev + delta) * 100) / 100;
        return Math.max(0.25, Math.min(4, next));
      });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [ready]);

  // ─── Drag-to-pan handlers ──────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return;
    if ((e.target as HTMLElement).closest('.annotation-marker')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setScrollStart({
      x: viewerRef.current?.scrollLeft ?? 0,
      y: viewerRef.current?.scrollTop ?? 0,
    });
  }, [zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !viewerRef.current) return;
    viewerRef.current.scrollLeft = scrollStart.x - (e.clientX - dragStart.x);
    viewerRef.current.scrollTop = scrollStart.y - (e.clientY - dragStart.y);
  }, [isDragging, dragStart, scrollStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Toggle a status filter
  const toggleStatus = useCallback((status: string) => {
    setVisibleStatuses(prev => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }, []);

  // All non-N/A annotations with stable global indices
  const allFindings = annotations
    .filter((a) => a.type !== 'N/A')
    .map((a, i) => ({ ...a, globalIndex: i }));

  // Annotations visible based on toggle state (for markers on the image)
  const visibleOnPage = showAnnotations
    ? allFindings.filter((a) => a.page === currentPage && visibleStatuses.has(a.type))
    : [];

  // All findings on current page (for sidebar — always show all)
  const currentPageAllFindings = allFindings.filter((a) => a.page === currentPage);

  // Navigate to annotation's page when selected
  const selectAnnotation = (globalIndex: number) => {
    const anno = allFindings[globalIndex];
    if (anno && anno.page !== currentPage) {
      setCurrentPage(anno.page);
    }
    setSelectedIndex(globalIndex);
  };

  // ─── Loading: AI generating annotations ──────────────────────────────
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-cyan-500 animate-spin" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          Generating Visual Review
        </h3>
        <p className="text-slate-500 text-sm">
          AI is analyzing plan pages and placing compliance markers...
        </p>
        {capturingPage > 0 && numPages > 0 && (
          <p className="text-xs text-slate-400 mt-3">
            Capturing page {capturingPage} of {numPages}...
          </p>
        )}
        {ready && (
          <p className="text-xs text-green-500 mt-3">
            Plan pages captured successfully
          </p>
        )}
      </div>
    );
  }

  // ─── Error: PDF capture failed ───────────────────────────────────────
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <XCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          Plan Rendering Failed
        </h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto">{error}</p>
      </div>
    );
  }

  // ─── Capturing: rendering pages to images ────────────────────────────
  if (!ready) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-cyan-500 animate-spin" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          Capturing Plan Pages
        </h3>
        {numPages > 0 ? (
          <>
            <p className="text-slate-500 text-sm">
              Rendering page {capturingPage} of {numPages}...
            </p>
            <div className="w-64 mx-auto mt-4 bg-slate-200 rounded-full h-2">
              <div
                className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(capturingPage / Math.max(numPages, 1)) * 100}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-slate-500 text-sm">Loading plan document...</p>
        )}
      </div>
    );
  }

  // Compute the displayed image width
  const imageWidth = fitWidth ? fitWidth * zoom : undefined;

  // ─── Ready: full interactive viewer ──────────────────────────────────
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 text-white px-6 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold">Visual Plan Review</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {allFindings.length} finding{allFindings.length !== 1 ? 's' : ''} across{' '}
              {numPages} page{numPages !== 1 ? 's' : ''}
              {zoom > 1 && <span className="ml-2 text-slate-500">Ctrl+scroll to zoom, drag to pan</span>}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Annotation master toggle */}
            <button
              onClick={() => setShowAnnotations(!showAnnotations)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${showAnnotations
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-400 hover:text-slate-200'
                }
              `}
            >
              {showAnnotations ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
              Annotations
            </button>

            {/* Status filters (visible when annotations are on) */}
            {showAnnotations && (
              <div className="hidden sm:flex items-center gap-1.5">
                {(['PASS', 'FAIL', 'VERIFY'] as const).map((status) => {
                  const active = visibleStatuses.has(status);
                  const colors = {
                    PASS: active
                      ? 'bg-green-500 text-white'
                      : 'bg-slate-700 text-slate-500 hover:text-slate-300',
                    FAIL: active
                      ? 'bg-red-500 text-white'
                      : 'bg-slate-700 text-slate-500 hover:text-slate-300',
                    VERIFY: active
                      ? 'bg-amber-500 text-white'
                      : 'bg-slate-700 text-slate-500 hover:text-slate-300',
                  };
                  return (
                    <button
                      key={status}
                      onClick={() => toggleStatus(status)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${colors[status]}`}
                    >
                      {STATUS_STYLES[status].label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setZoom((z) => Math.max(0.25, +(z - 0.25).toFixed(2)))}
                className="p-1.5 rounded hover:bg-slate-600 transition-colors"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs min-w-[40px] text-center font-medium text-slate-300">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}
                className="p-1.5 rounded hover:bg-slate-600 transition-colors"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom(1)}
                className="p-1.5 rounded hover:bg-slate-600 transition-colors"
                title="Fit to width"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  setSelectedIndex(null);
                }}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg hover:bg-slate-700 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium min-w-[80px] text-center">
                Page {currentPage} / {numPages}
              </span>
              <button
                onClick={() => {
                  setCurrentPage((p) => Math.min(numPages, p + 1));
                  setSelectedIndex(null);
                }}
                disabled={currentPage >= numPages}
                className="p-1.5 rounded-lg hover:bg-slate-700 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Body: Plan + Sidebar */}
      <div className="flex flex-col lg:flex-row" style={{ height: 'calc(100vh - 180px)', minHeight: '500px' }}>
        {/* Plan viewer — fills viewport, scroll for zoom */}
        <div
          ref={viewerRef}
          className={`flex-1 relative bg-slate-100 overflow-auto ${
            isDragging ? 'cursor-grabbing select-none' : zoom > 1 ? 'cursor-grab' : ''
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Image + annotation markers — width-based zoom, no CSS transform */}
          <div className="p-4">
            <div className="relative inline-block shadow-lg">
              {currentImage ? (
                <>
                  <img
                    src={currentImage.dataUrl}
                    alt={`Plan page ${currentPage}`}
                    className="block select-none"
                    style={{
                      width: imageWidth ? `${imageWidth}px` : '100%',
                      height: 'auto',
                    }}
                    draggable={false}
                  />

                  {/* Annotation markers overlaid on the image */}
                  {visibleOnPage.map((anno) => (
                    <AnnotationMarker
                      key={`${anno.page}-${anno.checkId}-${anno.globalIndex}`}
                      annotation={anno}
                      index={anno.globalIndex}
                      isSelected={selectedIndex === anno.globalIndex}
                      onClick={() =>
                        setSelectedIndex(
                          selectedIndex === anno.globalIndex ? null : anno.globalIndex
                        )
                      }
                    />
                  ))}
                </>
              ) : (
                <div className="w-[600px] h-[800px] flex items-center justify-center bg-white rounded">
                  <p className="text-slate-400 text-sm">Page not available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Findings sidebar */}
        <div className="w-full lg:w-96 xl:w-[28rem] border-t lg:border-t-0 lg:border-l border-slate-200 bg-slate-50 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800 text-sm">
              Findings — Page {currentPage}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentPageAllFindings.length} item{currentPageAllFindings.length !== 1 ? 's' : ''} on this page
            </p>
          </div>

          <div className="p-3 space-y-2 flex-1 overflow-y-auto">
            {currentPageAllFindings.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">
                No findings on this page.
              </p>
            )}

            {currentPageAllFindings.map((anno) => (
              <FindingCard
                key={`${anno.checkId}-${anno.globalIndex}`}
                annotation={anno}
                index={anno.globalIndex}
                isSelected={selectedIndex === anno.globalIndex}
                onClick={() =>
                  setSelectedIndex(
                    selectedIndex === anno.globalIndex ? null : anno.globalIndex
                  )
                }
              />
            ))}
          </div>

          {/* Page quick-jump */}
          {numPages > 1 && (
            <div className="p-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 font-medium mb-2">Jump to page</p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: numPages }, (_, i) => i + 1).map((pg) => {
                  const pgFindings = allFindings.filter((a) => a.page === pg);
                  const hasFail = pgFindings.some((a) => a.type === 'FAIL');
                  const hasVerify = pgFindings.some((a) => a.type === 'VERIFY');
                  return (
                    <button
                      key={pg}
                      onClick={() => {
                        setCurrentPage(pg);
                        setSelectedIndex(null);
                      }}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-all
                        ${currentPage === pg
                          ? 'bg-slate-800 text-white'
                          : hasFail
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : hasVerify
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : pgFindings.length > 0
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }
                      `}
                    >
                      {pg}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected annotation detail bar */}
      {selectedIndex !== null && allFindings[selectedIndex] && (
        <div
          className={`border-t-2 p-4 ${
            allFindings[selectedIndex].type === 'FAIL'
              ? 'border-red-400 bg-red-50'
              : allFindings[selectedIndex].type === 'VERIFY'
              ? 'border-amber-400 bg-amber-50'
              : 'border-green-400 bg-green-50'
          }`}
        >
          <div className="flex items-start gap-3 max-w-3xl">
            <StatusIcon status={allFindings[selectedIndex].type} size={20} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-900">
                  {allFindings[selectedIndex].label}
                </span>
                <span className="text-xs bg-white/80 px-2 py-0.5 rounded border text-slate-600 font-mono">
                  {allFindings[selectedIndex].codeReference}
                </span>
                <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {allFindings[selectedIndex].checkId} — {allFindings[selectedIndex].category.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-sm text-slate-700 mt-1">
                {allFindings[selectedIndex].detail}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VisualPlanReview;
