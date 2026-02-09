'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  MinusCircle,
  FileText,
  Download,
} from 'lucide-react';

interface CheckResult {
  id: string;
  description: string;
  codeReference: string;
  status: 'PASS' | 'FAIL' | 'VERIFY' | 'N/A';
  finding: string;
}

interface CategoryResult {
  category: string;
  name: string;
  codeReference: string;
  overallStatus: 'PASS' | 'FAIL' | 'VERIFY' | 'N/A';
  checks: CheckResult[];
}

interface SheetAnalysis {
  sheetNumber: number;
  sheetType: string;
  categories: CategoryResult[];
}

interface ComplianceReportData {
  projectName: string;
  analyzedAt: string;
  totalSheets: number;
  sheets: SheetAnalysis[];
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    needsVerification: number;
    notApplicable: number;
  };
  overallStatus: 'PASS' | 'FAIL' | 'VERIFY' | 'N/A';
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'PASS':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'FAIL':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'VERIFY':
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    default:
      return <MinusCircle className="w-5 h-5 text-slate-400" />;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const colors = {
    PASS: 'bg-green-100 text-green-800 border-green-200',
    FAIL: 'bg-red-100 text-red-800 border-red-200',
    VERIFY: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'N/A': 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded border ${
        colors[status as keyof typeof colors] || colors['N/A']
      }`}
    >
      {status}
    </span>
  );
};

export function ComplianceReport({ report }: { report: ComplianceReportData }) {
  const { projectName, analyzedAt, summary, sheets, overallStatus } = report;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-800 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">FBC Compliance Report</h2>
            <p className="text-slate-300 mt-1">{projectName}</p>
            <p className="text-sm text-slate-400 mt-1">
              Analyzed: {new Date(analyzedAt).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400 mb-1">Overall Status</div>
            <div
              className={`text-3xl font-bold ${
                overallStatus === 'PASS'
                  ? 'text-green-400'
                  : overallStatus === 'FAIL'
                  ? 'text-red-400'
                  : 'text-yellow-400'
              }`}
            >
              {overallStatus}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 p-6 bg-slate-50 border-b">
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">{summary.passed}</div>
          <div className="text-sm text-slate-600">Passed</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-red-600">{summary.failed}</div>
          <div className="text-sm text-slate-600">Failed</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-yellow-600">
            {summary.needsVerification}
          </div>
          <div className="text-sm text-slate-600">Needs Verification</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-slate-400">
            {summary.notApplicable}
          </div>
          <div className="text-sm text-slate-600">N/A</div>
        </div>
      </div>

      {/* Sheet Results */}
      <div className="p-6">
        {sheets.map((sheet) => (
          <div key={sheet.sheetNumber} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-slate-400" />
              <h3 className="text-lg font-semibold">
                Sheet {sheet.sheetNumber}: {sheet.sheetType}
              </h3>
            </div>

            {sheet.categories.map((category) => (
              <div
                key={category.category}
                className="mb-4 border rounded-lg overflow-hidden"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between p-4 bg-slate-50 border-b">
                  <div>
                    <span className="font-semibold">{category.name}</span>
                    <span className="text-sm text-slate-500 ml-2">
                      ({category.codeReference})
                    </span>
                  </div>
                  <StatusBadge status={category.overallStatus} />
                </div>

                {/* Checks */}
                <div className="divide-y">
                  {category.checks.map((check) => (
                    <div
                      key={check.id}
                      className="p-4 flex items-start gap-3 hover:bg-slate-50"
                    >
                      <StatusIcon status={check.status} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{check.description}</span>
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {check.codeReference}
                          </span>
                        </div>
                        {check.finding && (
                          <p className="text-sm text-slate-600 mt-1">
                            {check.finding}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Export Button */}
      <div className="p-6 bg-slate-50 border-t">
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
          <Download className="w-4 h-4" />
          Export as PDF
        </button>
      </div>
    </div>
  );
}

export default ComplianceReport;
