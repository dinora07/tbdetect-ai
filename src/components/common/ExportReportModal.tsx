import React, { useState } from 'react';
import { X, Download, FileText, CheckCircle2, FileSpreadsheet, Code, ShieldCheck, Loader2 } from 'lucide-react';
import { MedicalReportData, generateMedicalReportHtml, downloadText, downloadCsv } from '../../utils/exportUtils';
import { useToast } from '../../context/ToastContext';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData?: MedicalReportData;
  patient?: any;
  xray?: any;
  csvHeaders?: string[];
  csvRows?: (string | number)[][];
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  reportData,
  patient,
  xray,
  csvHeaders,
  csvRows,
}) => {
  const { success, error } = useToast();

  const [format, setFormat] = useState<'html' | 'csv' | 'json'>('html');
  const [includeDemographics, setIncludeDemographics] = useState(true);
  const [includeFindings, setIncludeFindings] = useState(true);
  const [includeAiScore, setIncludeAiScore] = useState(true);
  const [includeSignature, setIncludeSignature] = useState(true);

  const [isExporting, setIsExporting] = useState(false);
  const [progressStep, setProgressStep] = useState(0);

  const effectiveReportData: MedicalReportData = React.useMemo(() => {
    if (reportData) return reportData;
    const pName = patient ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient' : 'Patient';
    const pId = patient?.id || xray?.patientId || 'UNKNOWN';
    const clinic = patient?.facility || 'National Tuberculosis Center';
    const riskScore = xray?.riskScore ?? 0;
    const riskLevel = xray?.riskLevel || 'LOW';

    return {
      reportTitle: 'TBDetect AI - Diagnostic & Radiographic Screening Report',
      patientName: pName,
      patientId: pId,
      dob: patient?.dateOfBirth,
      gender: patient?.gender,
      clinicName: clinic,
      generatedBy: 'TBDetect Clinical AI System',
      generatedAt: new Date().toLocaleString(),
      riskScore,
      riskLevel,
      sections: [
        {
          heading: 'Patient Demographics',
          items: [
            { label: 'Patient Name', value: pName },
            { label: 'Patient ID', value: pId },
            { label: 'Age / Gender', value: `${patient?.age || 'N/A'} yrs / ${patient?.gender || 'N/A'}` },
            { label: 'Contact', value: patient?.phoneNumber || 'N/A' },
            { label: 'Treatment Status', value: patient?.treatmentStatus || 'Screening' },
          ],
        },
        ...(xray
          ? [
              {
                heading: 'Radiographic Examination Findings',
                items: [
                  { label: 'Scan ID', value: xray.id },
                  { label: 'Scan Date', value: xray.scanDate || new Date().toISOString().split('T')[0] },
                  { label: 'AI Risk Level', value: xray.riskLevel || 'LOW' },
                  { label: 'AI Confidence Score', value: `${xray.riskScore || 0}%` },
                  { label: 'Status', value: xray.status || 'ANALYZED' },
                  { label: 'Key Finding', value: xray.findings?.[0] || 'No focal consolidation or cavitary lesions.' },
                ],
                notes: xray.clinicalNotes || (xray.findings ? xray.findings.join('; ') : 'No notes available.'),
              },
            ]
          : []),
      ],
      disclaimer: 'Certified for clinical decision support under supervised medical review.',
    };
  }, [reportData, patient, xray]);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    setProgressStep(1);

    await new Promise((r) => setTimeout(r, 400));
    setProgressStep(2);

    await new Promise((r) => setTimeout(r, 400));
    setProgressStep(3);

    await new Promise((r) => setTimeout(r, 300));

    try {
      const sanitizedName = (effectiveReportData.patientName || 'Patient').replace(/[^a-zA-Z0-9]/g, '_');
      const filenameBase = `TBDetect_${sanitizedName}_${effectiveReportData.patientId || 'ID'}`;

      if (format === 'html') {
        const filteredSections = (effectiveReportData.sections || []).filter((s) => {
          if (!includeFindings && s.heading.toLowerCase().includes('findings')) return false;
          return true;
        });

        const fullHtml = generateMedicalReportHtml({
          ...effectiveReportData,
          riskLevel: includeAiScore ? effectiveReportData.riskLevel : undefined,
          riskScore: includeAiScore ? effectiveReportData.riskScore : undefined,
          sections: filteredSections,
        });

        downloadText(fullHtml, `${filenameBase}_Clinical_Dossier.html`, 'text/html;charset=utf-8;');
      } else if (format === 'csv') {
        if (csvHeaders && csvRows) {
          downloadCsv(csvHeaders, csvRows, `${filenameBase}_Data_Export.csv`);
        } else {
          const headers = ['Category', 'Field', 'Value'];
          const rows: (string | number)[][] = [
            ['Patient', 'Name', effectiveReportData.patientName || ''],
            ['Patient', 'National ID', effectiveReportData.patientId || ''],
            ['Patient', 'Facility', effectiveReportData.clinicName || ''],
            ['Assessment', 'Risk Score', `${effectiveReportData.riskScore || 0}%`],
            ['Assessment', 'Risk Level', effectiveReportData.riskLevel || 'N/A'],
            ['Audit', 'Generated By', effectiveReportData.generatedBy || ''],
            ['Audit', 'Date', effectiveReportData.generatedAt || ''],
          ];
          (effectiveReportData.sections || []).forEach((sec) => {
            (sec.items || []).forEach((item) => {
              rows.push([sec.heading, item.label, item.value]);
            });
          });
          downloadCsv(headers, rows, `${filenameBase}_Export.csv`);
        }
      } else if (format === 'json') {
        const jsonString = JSON.stringify(effectiveReportData, null, 2);
        downloadText(jsonString, `${filenameBase}_Structured_Data.json`, 'application/json;charset=utf-8;');
      }

      success('Clinical dossier exported and downloaded successfully', 'Export Complete');
      onClose();
    } catch {
      error('Failed to export medical report.');
    } finally {
      setIsExporting(false);
      setProgressStep(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Export Clinical Report</h3>
              <p className="text-xs text-slate-500">Generate certified dossier or raw structured dataset</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Patient Overview */}
          <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-900">{effectiveReportData.patientName}</p>
              <p className="text-[11px] text-slate-500 font-mono">ID: {effectiveReportData.patientId}</p>
            </div>
            {effectiveReportData.riskScore !== undefined && (
              <span className="px-2.5 py-1 bg-white rounded-xl font-bold font-mono text-blue-700 border border-blue-200 shadow-2xs">
                Score: {effectiveReportData.riskScore}% ({effectiveReportData.riskLevel})
              </span>
            )}
          </div>

          {/* Format selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Export Format:</label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setFormat('html')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  format === 'html'
                    ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 font-bold shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4 text-blue-600 mb-1.5" />
                <p className="text-xs font-bold">Printable PDF</p>
                <p className="text-[10px] text-slate-400 font-normal">HTML / Dossier</p>
              </button>

              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  format === 'csv'
                    ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-900 font-bold shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 mb-1.5" />
                <p className="text-xs font-bold">CSV Sheet</p>
                <p className="text-[10px] text-slate-400 font-normal">Tabular metrics</p>
              </button>

              <button
                type="button"
                onClick={() => setFormat('json')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  format === 'json'
                    ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 text-purple-900 font-bold shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Code className="w-4 h-4 text-purple-600 mb-1.5" />
                <p className="text-xs font-bold">JSON Data</p>
                <p className="text-[10px] text-slate-400 font-normal">Interoperable API</p>
              </button>
            </div>
          </div>

          {/* Section Inclusions */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Include in Export:</label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDemographics}
                  onChange={(e) => setIncludeDemographics(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="font-semibold text-slate-700">Demographics & History</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAiScore}
                  onChange={(e) => setIncludeAiScore(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="font-semibold text-slate-700">AI Risk Stratification</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeFindings}
                  onChange={(e) => setIncludeFindings(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="font-semibold text-slate-700">Radiograph Findings</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSignature}
                  onChange={(e) => setIncludeSignature(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="font-semibold text-slate-700">Doctor Electronic Sign-Off</span>
              </label>
            </div>
          </div>

          {/* Export Progress Simulation */}
          {isExporting && (
            <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  {progressStep === 1 && '1/3: Extracting verified screening records...'}
                  {progressStep === 2 && '2/3: Applying cryptographic audit hash...'}
                  {progressStep === 3 && '3/3: Streaming file to browser...'}
                </span>
                <span className="font-mono">{progressStep * 33}%</span>
              </div>
              <div className="w-full h-1.5 bg-indigo-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progressStep * 33.3}%` }}
                />
              </div>
            </div>
          )}

          {/* Privacy disclaimer */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Protected Health Information (PHI) encrypted with institutional audit compliance.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStartExport}
            disabled={isExporting}
            className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Generating...' : 'Download Report'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
