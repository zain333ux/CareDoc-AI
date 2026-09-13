import { jsPDF } from "jspdf";

export interface MedicalSummaryData {
  filename?: string;
  doc_type?: string;
  language?: string;
  simplified_text?: string;
  simplifiedText?: string;
  original_simplified_text?: string;
  medications?: Array<{
    name: string;
    dosage: string;
    frequency?: string;
    duration?: string;
    verified?: boolean;
    frequency_urdu?: string;
    duration_urdu?: string;
  }>;
  follow_up?: Array<{
    action?: string;
    action_urdu?: string;
    when?: string;
    date?: string;
    who?: string;
  }>;
  precautions?: Array<{
    warning?: string;
    warning_urdu?: string;
  }>;
  verification_flags?: Array<{
    claim?: string;
    issue?: string;
  }>;
}

export function downloadMedicalSummaryPDF(summaryData: MedicalSummaryData, docType: string) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  const isDischarge = docType === "discharge_summary" || docType === "discharge";
  const docTypeTitle = isDischarge
    ? "Discharge Summary · Hospital Instructions"
    : "Prescription · Medication List";

  // --- Header Banner ---
  doc.setFillColor(13, 110, 93); // Primary teal color
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text("CareDoc AI - Medical Analysis Report", margin + 6, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(230, 245, 240);
  doc.text(docTypeTitle, margin + 6, y + 17);

  const now = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  doc.text(`Generated: ${now}`, pageWidth - margin - 6, y + 17, { align: "right" });

  y += 32;

  // --- Metadata Box ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("Document:", margin + 4, y + 8.5);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  const fname = summaryData.filename || "Uploaded Medical Document";
  const truncatedFname = fname.length > 38 ? fname.slice(0, 35) + "..." : fname;
  doc.text(truncatedFname, margin + 25, y + 8.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("Analysis Status:", pageWidth - margin - 50, y + 8.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(13, 110, 93);
  doc.text("AI Verified & Simplified", pageWidth - margin - 4, y + 8.5, { align: "right" });

  y += 20;

  // Helper to draw section headers
  const drawSectionHeader = (title: string) => {
    checkPageBreak(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin, y);
    doc.setDrawColor(13, 110, 93);
    doc.setLineWidth(0.7);
    doc.line(margin, y + 2, margin + contentWidth, y + 2);
    y += 8;
  };

  // --- 1. Plain Language Summary ---
  const summaryText = summaryData.original_simplified_text || summaryData.simplified_text || summaryData.simplifiedText || "";
  if (summaryText) {
    drawSectionHeader("1. Plain-Language Summary");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    
    // Clean markdown headings/bullets
    const cleanText = summaryText
      .replace(/#{1,6}\s?/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "");

    const splitLines = doc.splitTextToSize(cleanText, contentWidth);
    for (const line of splitLines) {
      checkPageBreak(6);
      doc.text(line, margin, y);
      y += 5.2;
    }
    y += 6;
  }

  // --- 2. Medications Section ---
  if (summaryData.medications && summaryData.medications.length > 0) {
    drawSectionHeader("2. Medications & Dosage Instructions");
    
    for (const med of summaryData.medications) {
      checkPageBreak(17);
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "FD");

      // Med Name & Dosage
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      const medNameStr = `${med.name} — ${med.dosage || "As directed"}`;
      doc.text(medNameStr, margin + 4, y + 5.5);

      // Verified badge
      if (med.verified === false) {
        doc.setFontSize(8);
        doc.setTextColor(180, 83, 9);
        doc.text("⚠ Needs Confirmation", pageWidth - margin - 4, y + 5.5, { align: "right" });
      } else {
        doc.setFontSize(8);
        doc.setTextColor(13, 110, 93);
        doc.text("✓ Verified", pageWidth - margin - 4, y + 5.5, { align: "right" });
      }

      // Schedule / Frequency
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const schedule = [med.frequency, med.duration].filter(Boolean).join(" · ") || "Follow physician instructions";
      doc.text(schedule, margin + 4, y + 10.5);

      y += 17;
    }
    y += 4;
  }

  // --- 3. Follow-up Plan ---
  if (summaryData.follow_up && summaryData.follow_up.length > 0) {
    drawSectionHeader("3. Follow-Up Instructions");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);

    for (const item of summaryData.follow_up) {
      checkPageBreak(12);
      const action = item.action || "Follow-up consultation";
      const timing = [item.when || item.date, item.who].filter(Boolean).join(" — ");

      doc.setFillColor(13, 110, 93);
      doc.circle(margin + 2, y - 1, 1.1, "F");

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(action, margin + 6, y);

      if (timing) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(`Schedule: ${timing}`, margin + 6, y + 4.5);
        y += 8.5;
      } else {
        y += 6;
      }
    }
    y += 4;
  }

  // --- 4. Precautions & Warnings ---
  if (summaryData.precautions && summaryData.precautions.length > 0) {
    drawSectionHeader("4. Precautions & Warnings");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);

    for (const item of summaryData.precautions) {
      const text = item.warning || "";
      if (!text) continue;

      checkPageBreak(12);
      doc.setFillColor(220, 38, 38);
      doc.circle(margin + 2, y - 1, 1.1, "F");

      doc.setTextColor(185, 28, 28);
      const splitWarn = doc.splitTextToSize(text, contentWidth - 8);
      for (const line of splitWarn) {
        checkPageBreak(5.5);
        doc.text(line, margin + 6, y);
        y += 5;
      }
      y += 2;
    }
    y += 4;
  }

  // --- Footer on all pages ---
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "CareDoc AI · Simplified for patient clarity · Consult licensed healthcare providers for medical advice",
      margin,
      pageHeight - 7
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: "right" });
  }

  // Save the PDF file
  const baseName = summaryData.filename
    ? summaryData.filename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_")
    : "Medical_Summary";
  doc.save(`${baseName}_CareDoc_Summary.pdf`);
}
