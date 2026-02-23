'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Upload, FileCheck, Loader2, ArrowLeft, ClipboardList, Eye } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { upload } from '@vercel/blob/client';
import ComplianceReport from '@/components/ComplianceReport';
import type { VisualAnnotation } from '@/components/VisualPlanReview';


// Dynamic import to avoid SSR issues with pdfjs-dist (requires browser APIs)
const VisualPlanReview = dynamic(
  () => import('@/components/VisualPlanReview'),
  { ssr: false, loading: () => (
    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
      <Loader2 className="w-12 h-12 mx-auto mb-4 text-cyan-500 animate-spin" />
      <p className="text-slate-500">Loading visual reviewer...</p>
    </div>
  )}
);

type AnalysisState = 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
type ActiveTab = 'checklist' | 'visual';

export default function AnalyzePage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [state, setState] = useState<AnalysisState>('idle');
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('checklist');

  // Visual review state
  const [annotations, setAnnotations] = useState<VisualAnnotation[]>([]);
  const [annotationsLoading, setAnnotationsLoading] = useState(false);
  const annotationsFetched = useRef(false);

  // Create object URL for the file (used by VisualPlanReview)
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFileUrl(null);
    }
  }, [file]);

  // Fetch visual annotations after report is ready
  useEffect(() => {
    if (!report || !blobUrl || annotationsFetched.current) return;
    annotationsFetched.current = true;

    const fetchAnnotations = async () => {
      setAnnotationsLoading(true);
      try {
        const response = await fetch('/api/annotate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blobUrl, report }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.annotations) {
            setAnnotations(result.annotations);
          }
        }
      } catch (err) {
        console.error('Annotation fetch error:', err);
      } finally {
        setAnnotationsLoading(false);
      }
    };

    fetchAnnotations();
  }, [report, blobUrl]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!file) return;

    setState('uploading');
    setProgress(10);

    try {
      // Step 1: Upload PDF to Vercel Blob (bypasses 4.5MB serverless limit)
      const uniqueName = `${Date.now()}-${file.name}`;
      const blob = await upload(uniqueName, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });
      setBlobUrl(blob.url);

      setProgress(30);
      setState('processing');

      // Animate progress while waiting for analysis (takes 2-4 min)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 1;
        });
      }, 3000);

      // Step 2: Call analyze API with the blob URL
      let response: Response;
      try {
        response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blobUrl: blob.url, fileName: file.name }),
        });
      } finally {
        clearInterval(progressInterval);
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Analysis failed');
      }

      const result = await response.json();
      setProgress(100);

      if (!result.success || !result.report) {
        throw new Error(result.error || 'Analysis failed');
      }

      setReport(result.report);
      setState('complete');
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Analysis failed. Please try again.');
      setState('error');
    }
  };

  const resetAnalysis = () => {
    setFile(null);
    setFileUrl(null);
    setBlobUrl(null);
    setState('idle');
    setProgress(0);
    setReport(null);
    setError(null);
    setActiveTab('checklist');
    setAnnotations([]);
    setAnnotationsLoading(false);
    annotationsFetched.current = false;
  };

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-slate-800 text-white py-4">
        <div className="container mx-auto px-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <img
            src="/permit-pass-logo.png"
            alt="Permit Pass"
            className="h-8 w-auto rounded"
          />
          <span className="text-lg font-semibold text-slate-300">— Analyze Plans</span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Upload Section */}
        {state === 'idle' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold mb-6 text-center">
                Upload Construction Plans
              </h2>

              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  file ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-blue-400'
                }`}
              >
                {file ? (
                  <div>
                    <FileCheck className="w-16 h-16 mx-auto mb-4 text-green-500" />
                    <p className="font-semibold text-lg">{file.name}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={resetAnalysis}
                      className="mt-4 text-sm text-slate-600 hover:text-slate-800 underline"
                    >
                      Choose different file
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                    <p className="text-lg mb-2">Drag and drop your PDF here</p>
                    <p className="text-sm text-slate-500 mb-4">or click to browse</p>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg cursor-pointer transition-colors"
                    >
                      Select PDF
                    </label>
                  </div>
                )}
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              {file && (
                <button
                  onClick={handleAnalyze}
                  className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
                >
                  Run FBC Compliance Check
                </button>
              )}
            </div>

            {/* What We Check — FBC Residential Plan Review */}
            <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold mb-1">Florida Building Code — Residential Plan Review Checklist</h3>
              <p className="text-xs text-slate-500 mb-4">42 checks across 5 sections — matches the standard building department sufficiency review</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { label: 'Site Plan', count: 2, code: 'FBC 107.3.5' },
                  { label: 'Flood Construction', count: 1, code: 'FBC-R 322' },
                  { label: 'Foundation Plan', count: 5, code: 'FBC-R R403' },
                  { label: 'Floor Plan / MEP', count: 17, code: 'FBC-R Multiple' },
                  { label: 'Elevations & Details', count: 17, code: 'FBC 107.2.1' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800">{item.label}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{item.count}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-mono">{item.code}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Processing State */}
        {(state === 'uploading' || state === 'processing') && (
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />
              <h2 className="text-xl font-bold mb-2">
                {state === 'uploading' ? 'Uploading...' : 'Analyzing Plans...'}
              </h2>
              <p className="text-slate-500 mb-6">
                {state === 'uploading'
                  ? 'Uploading your PDF...'
                  : 'Running 5 AI agents across your plans — this typically takes 2-4 minutes...'}
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-slate-500 mt-2">{progress}%</p>
            </div>
          </div>
        )}

        {/* Results */}
        {state === 'complete' && report && (
          <div className="max-w-6xl mx-auto">
            {/* Top bar */}
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <button
                onClick={resetAnalysis}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
                Analyze Another
              </button>

              {/* Tabs */}
              <div className="flex bg-white rounded-xl shadow border border-slate-200 p-1">
                <button
                  onClick={() => setActiveTab('checklist')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'checklist'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <ClipboardList className="w-4 h-4" />
                  Compliance Checklist
                </button>
                <button
                  onClick={() => setActiveTab('visual')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'visual'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  Visual Review
                  {annotationsLoading && (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  )}
                  {!annotationsLoading && annotations.length > 0 && (
                    <span className="bg-cyan-100 text-cyan-700 text-xs px-1.5 py-0.5 rounded-full">
                      {annotations.filter(a => a.type !== 'N/A').length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Tab content */}
            {activeTab === 'checklist' && (
              <div className="max-w-4xl mx-auto">
                <ComplianceReport report={report} />
              </div>
            )}

            {activeTab === 'visual' && fileUrl && (
              <VisualPlanReview
                fileUrl={fileUrl}
                annotations={annotations}
                loading={annotationsLoading}
              />
            )}
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-red-500 text-6xl mb-4">!</div>
              <h2 className="text-xl font-bold mb-2">Analysis Failed</h2>
              <p className="text-slate-500 mb-6">{error || 'Something went wrong'}</p>
              <button
                onClick={resetAnalysis}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
