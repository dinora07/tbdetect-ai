import React, { useState } from 'react';
import { X, ArrowRightLeft, Calendar, FileText, Download, ZoomIn, ZoomOut, Sun } from 'lucide-react';
import { Patient, XRayAnalysis } from '../../types';

interface CompareStudiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  studies: XRayAnalysis[];
  initialStudyId?: string;
}

export const CompareStudiesModal: React.FC<CompareStudiesModalProps> = ({
  isOpen,
  onClose,
  patient,
  studies,
  initialStudyId,
}) => {
  if (!isOpen) return null;

  // Filter studies that belong to this patient only
  const patientStudies = studies.filter((s) => s.patientId === patient.id);

  const [studyAId, setStudyAId] = useState<string>(
    initialStudyId || (patientStudies[0]?.studyId || patientStudies[0]?.id || '')
  );
  const [studyBId, setStudyBId] = useState<string>(
    (patientStudies[1]?.studyId || patientStudies[1]?.id) ||
      (patientStudies[0]?.studyId || patientStudies[0]?.id || '')
  );

  const [zoomA, setZoomA] = useState(1);
  const [zoomB, setZoomB] = useState(1);
  const [invertA, setInvertA] = useState(false);
  const [invertB, setInvertB] = useState(false);

  const studyA = patientStudies.find((s) => s.id === studyAId || s.studyId === studyAId);
  const studyB = patientStudies.find((s) => s.id === studyBId || s.studyId === studyBId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Comparative Radiological Evaluation
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {patient.firstName} {patient.lastName} ({patient.nationalId})
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Compare temporal chest radiograph studies for longitudinal disease progression monitoring.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {patientStudies.length < 2 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-300">
              At least two radiograph studies are required for longitudinal comparison.
            </p>
            <p className="text-xs text-slate-500">
              Current patient has {patientStudies.length} study archived. Upload a follow-up scan to enable comparative analytics.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Return to Studio
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Side by Side Selectors */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Study A Panel */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Study A (Baseline / Reference)
                  </label>
                  <select
                    value={studyAId}
                    onChange={(e) => setStudyAId(e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    {patientStudies.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.studyId || s.id} — {new Date(s.uploadedAt).toLocaleDateString()} ({s.sourceOrigin || 'STUDY'})
                      </option>
                    ))}
                  </select>
                </div>

                {studyA && (
                  <div className="space-y-3">
                    {/* Viewer Controls */}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-[11px] truncate max-w-[200px]">
                        {studyA.fileName || 'Radiograph_A.jpg'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setZoomA((z) => Math.min(z + 0.2, 2.5))}
                          className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setZoomA((z) => Math.max(z - 0.2, 0.8))}
                          className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setInvertA(!invertA)}
                          className={`p-1 rounded ${invertA ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                          title="Invert Contrast"
                        >
                          <Sun className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Image */}
                    <div className="h-72 bg-black rounded-xl overflow-hidden flex items-center justify-center relative border border-slate-800">
                      {studyA.imageUrl ? (
                        <img
                          src={studyA.imageUrl}
                          alt="Study A"
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full object-contain transition-transform"
                          style={{
                            transform: `scale(${zoomA})`,
                            filter: invertA ? 'invert(1) contrast(1.2)' : 'none',
                          }}
                        />
                      ) : (
                        <p className="text-xs text-slate-500">Image not available</p>
                      )}
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 text-[10px] font-mono text-cyan-300">
                        {studyA.dicomMetadata?.viewPosition || 'PA View'}
                      </div>
                    </div>

                    {/* Findings & Risk */}
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Analysis Status:</span>
                        <span className="font-bold text-slate-200">{studyA.status}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Risk Score:</span>
                        <span className="font-bold text-cyan-400">
                          {studyA.riskScore !== undefined ? `${studyA.riskScore}% (${studyA.riskLevel})` : 'Not available'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 italic pt-1 truncate">
                        "{studyA.impression || 'Study archived'}"
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Study B Panel */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    Study B (Comparison / Follow-up)
                  </label>
                  <select
                    value={studyBId}
                    onChange={(e) => setStudyBId(e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    {patientStudies.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.studyId || s.id} — {new Date(s.uploadedAt).toLocaleDateString()} ({s.sourceOrigin || 'STUDY'})
                      </option>
                    ))}
                  </select>
                </div>

                {studyB && (
                  <div className="space-y-3">
                    {/* Viewer Controls */}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-[11px] truncate max-w-[200px]">
                        {studyB.fileName || 'Radiograph_B.jpg'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setZoomB((z) => Math.min(z + 0.2, 2.5))}
                          className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setZoomB((z) => Math.max(z - 0.2, 0.8))}
                          className="p-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setInvertB(!invertB)}
                          className={`p-1 rounded ${invertB ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'}`}
                          title="Invert Contrast"
                        >
                          <Sun className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Image */}
                    <div className="h-72 bg-black rounded-xl overflow-hidden flex items-center justify-center relative border border-slate-800">
                      {studyB.imageUrl ? (
                        <img
                          src={studyB.imageUrl}
                          alt="Study B"
                          referrerPolicy="no-referrer"
                          className="max-h-full max-w-full object-contain transition-transform"
                          style={{
                            transform: `scale(${zoomB})`,
                            filter: invertB ? 'invert(1) contrast(1.2)' : 'none',
                          }}
                        />
                      ) : (
                        <p className="text-xs text-slate-500">Image not available</p>
                      )}
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/75 text-[10px] font-mono text-amber-300">
                        {studyB.dicomMetadata?.viewPosition || 'PA View'}
                      </div>
                    </div>

                    {/* Findings & Risk */}
                    <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Analysis Status:</span>
                        <span className="font-bold text-slate-200">{studyB.status}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Risk Score:</span>
                        <span className="font-bold text-amber-400">
                          {studyB.riskScore !== undefined ? `${studyB.riskScore}% (${studyB.riskLevel})` : 'Not available'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 italic pt-1 truncate">
                        "{studyB.impression || 'Study archived'}"
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Differential / Progression Summary */}
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs space-y-2">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                Longitudinal Assessment Notes
              </h4>
              <p className="text-slate-400 leading-relaxed">
                When comparing studies across treatment milestones, assess for resolution of apical infiltrates, cavitary wall thinning, and clearance of pleural thickening. Clinical decision-making must integrate mycobacterial smear/culture response with radiographic evolution.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-end gap-2 bg-slate-950/50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
