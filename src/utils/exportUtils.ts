/**
 * Real browser file download and report generation utility
 * For TBDetect AI MedTech Platform
 */

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(content: string, filename: string, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

export function downloadCsv(headers: string[], rows: (string | number)[][], filename: string) {
  const csvContent = [
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')),
  ].join('\r\n');

  downloadText(csvContent, filename.endsWith('.csv') ? filename : `${filename}.csv`, 'text/csv;charset=utf-8;');
}

export async function downloadImageFromUrl(url: string, filename: string) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    downloadBlob(blob, filename);
  } catch {
    // If CORS or local blob, fallback to direct anchor download
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.target = '_blank';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }
}

export interface MedicalReportData {
  reportTitle: string;
  patientName: string;
  patientId: string;
  dob?: string;
  gender?: string;
  clinicName: string;
  generatedBy: string;
  generatedAt: string;
  riskScore?: number;
  riskLevel?: string;
  sections: {
    heading: string;
    items: { label: string; value: string | number }[];
    notes?: string;
  }[];
  disclaimer?: string;
}

export function generateMedicalReportHtml(data: MedicalReportData): string {
  const sectionsHtml = data.sections
    .map(
      (s) => `
    <div style="margin-bottom: 24px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fafafa;">
      <h3 style="margin-top: 0; margin-bottom: 12px; color: #1e293b; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
        ${s.heading}
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        ${s.items
          .map(
            (it) => `
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 40%;">${it.label}:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 500;">${it.value}</td>
          </tr>
        `
          )
          .join('')}
      </table>
      ${s.notes ? `<p style="margin: 10px 0 0; font-size: 12px; color: #475569; font-style: italic;"><strong>Clinical Notes:</strong> ${s.notes}</p>` : ''}
    </div>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${data.reportTitle} - ${data.patientName} (${data.patientId})</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      padding: 32px;
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: bold;
      background: #dbeafe;
      color: #1e40af;
    }
    .high-risk {
      background: #ffe4e6;
      color: #be123c;
    }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #cbd5e1;
      font-size: 11px;
      color: #64748b;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 style="margin: 0; font-size: 22px; color: #0f172a;">${data.reportTitle}</h1>
      <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">${data.clinicName}</p>
    </div>
    <div style="text-align: right;">
      <span class="badge ${data.riskLevel === 'HIGH' || data.riskLevel === 'CRITICAL' ? 'high-risk' : ''}">
        ${data.riskLevel ? `Risk: ${data.riskLevel} (${data.riskScore}%)` : 'CONFIDENTIAL MEDICAL DOSSIER'}
      </span>
      <p style="margin: 6px 0 0; font-size: 11px; color: #94a3b8;">Date: ${data.generatedAt}</p>
    </div>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; font-size: 13px;">
    <div>
      <p style="margin: 0 0 4px; color: #64748b;">Patient Name:</p>
      <p style="margin: 0; font-weight: bold; font-size: 15px; color: #0f172a;">${data.patientName}</p>
    </div>
    <div>
      <p style="margin: 0 0 4px; color: #64748b;">National Patient ID:</p>
      <p style="margin: 0; font-family: monospace; font-weight: bold; color: #0f172a;">${data.patientId}</p>
    </div>
    ${data.gender ? `<div><p style="margin: 0 0 4px; color: #64748b;">Gender:</p><p style="margin: 0; font-weight: 500;">${data.gender}</p></div>` : ''}
    ${data.dob ? `<div><p style="margin: 0 0 4px; color: #64748b;">Date of Birth:</p><p style="margin: 0; font-weight: 500;">${data.dob}</p></div>` : ''}
  </div>

  ${sectionsHtml}

  <div class="footer">
    <p><strong>Generated By:</strong> ${data.generatedBy} · TBDetect AI MedTech Decision Support System</p>
    <p style="margin-top: 6px; font-style: italic;">
      ${data.disclaimer || 'NOTICE: This preliminary screening report is an algorithmic decision-support tool. Confirmatory microbiological testing (GeneXpert MTB/RIF, Sputum Smear, Culture) and qualified clinical review are required before initiating anti-tuberculosis chemotherapy.'}
    </p>
  </div>
</body>
</html>
`;
}
