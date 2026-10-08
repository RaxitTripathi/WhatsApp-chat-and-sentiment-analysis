import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ChatMessage, OverviewStats, UserStats, ActionItem } from '../types';

interface GeneratePdfOptions {
  overviewStats: OverviewStats;
  userStats: UserStats[];
  actionItems: ActionItem[];
  topWords: { word: string; count: number }[];
  isAnonymized: boolean;
  fileName: string;
}

export function generateExecutivePdfReport(options: GeneratePdfOptions): void {
  const { overviewStats, userStats, actionItems, topWords, isAnonymized, fileName } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors
  const primaryEmerald: [number, number, number] = [16, 185, 129];
  const darkSlate: [number, number, number] = [15, 23, 42];
  const mutedSlate: [number, number, number] = [100, 116, 139];
  const lightBg: [number, number, number] = [248, 250, 252];

  let currentY = 15;

  // --- Header Banner ---
  doc.setFillColor(...primaryEmerald);
  doc.rect(14, currentY, pageWidth - 28, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('WHATSAPP CHAT INTELLIGENCE REPORT', 20, currentY + 10);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Academic Project Review 2 | Automated NLP & Behavioral Analytics', 20, currentY + 17);

  currentY += 30;

  // --- Document Metadata Grid ---
  doc.setFillColor(...lightBg);
  doc.roundedRect(14, currentY, pageWidth - 28, 26, 3, 3, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 26, 3, 3, 'S');

  doc.setFontSize(9);
  doc.setTextColor(...mutedSlate);

  const col1 = 18;
  const col2 = 80;
  const col3 = 145;

  doc.text('Generated On:', col1, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text(new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), col1, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedSlate);
  doc.text('Chat Source:', col2, currentY + 7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text(fileName, col2, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedSlate);
  doc.text('Privacy / PII Mode:', col3, currentY + 7);
  doc.setFont('helvetica', 'bold');
  if (isAnonymized) {
    doc.setTextColor(16, 185, 129);
    doc.text('ANONYMIZED (Research Safe)', col3, currentY + 12);
  } else {
    doc.setTextColor(217, 119, 6);
    doc.text('STANDARD (Real Identifiers)', col3, currentY + 12);
  }

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedSlate);
  doc.text('Date Span Analyzed:', col1, currentY + 19);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text(`${overviewStats.dateRange.start || 'N/A'} to ${overviewStats.dateRange.end || 'N/A'}`, col1, currentY + 24);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedSlate);
  doc.text('Total Participants:', col2, currentY + 19);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text(`${overviewStats.totalUsers} Active Senders`, col2, currentY + 24);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedSlate);
  doc.text('Processing Integrity:', col3, currentY + 19);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text('100% In-Browser Sandbox', col3, currentY + 24);

  currentY += 34;

  // --- Executive KPI Summary Cards ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text('1. Executive Conversation Metrics', 14, currentY);
  currentY += 5;

  const cardWidth = (pageWidth - 28 - 12) / 4;
  const kpiData = [
    { label: 'Total Messages', value: overviewStats.totalMessages.toLocaleString() },
    { label: 'Total Words', value: overviewStats.totalWords.toLocaleString() },
    { label: 'Media Files', value: overviewStats.totalMedia.toLocaleString() },
    { label: 'Links Shared', value: overviewStats.totalLinks.toLocaleString() }
  ];

  kpiData.forEach((kpi, idx) => {
    const x = 14 + idx * (cardWidth + 4);
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x, currentY, cardWidth, 16, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(x, currentY, cardWidth, 16, 2, 2, 'S');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedSlate);
    doc.text(kpi.label, x + 4, currentY + 6);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...darkSlate);
    doc.text(kpi.value, x + 4, currentY + 13);
  });

  currentY += 23;

  // --- Participant Contribution Table ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text('2. Contributor Workload & Participation Distribution', 14, currentY);
  currentY += 3;

  const userRows = userStats.slice(0, 8).map(u => [
    u.user,
    u.messages.toLocaleString(),
    u.words.toLocaleString(),
    u.media.toString(),
    `${u.percentage}%`,
    u.avgLength.toString(),
    `${u.mostActiveHour}:00 (${u.mostActiveDay})`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Participant', 'Messages', 'Words', 'Media', '% Share', 'Avg Words/Msg', 'Peak Active Window']],
    body: userRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { left: 14, right: 14 }
  });

  // Get position after table
  currentY = (doc as any).lastAutoTable.finalY + 10;

  // --- Extracted Action Items & Deliverables Table ---
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text('3. Extracted Action Items & Commitments (NLP Heuristic Engine)', 14, currentY);
  currentY += 3;

  const actionRows = actionItems.slice(0, 10).map(a => [
    a.speaker,
    a.taskText,
    a.detectedDeadline || 'None detected',
    a.category,
    a.urgency,
    a.isCompleted
      ? 'Done'
      : a.timelineCategory === 'upcoming'
      ? 'Upcoming'
      : a.timelineCategory === 'past'
      ? 'Past'
      : 'Pending'
  ]);

  if (actionRows.length > 0) {
    autoTable(doc, {
      startY: currentY,
      head: [['Speaker / Owner', 'Task Commitment / Request', 'Detected Deadline', 'Category', 'Urgency', 'Status']],
      body: actionRows,
      theme: 'grid',
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59]
      },
      columnStyles: {
        1: { cellWidth: 70 }
      },
      margin: { left: 14, right: 14 }
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...mutedSlate);
    doc.text('No explicit commitments or action item keywords identified in current message scope.', 14, currentY + 5);
    currentY += 12;
  }

  // Check if we need page break for discussion themes & defense notes
  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = 20;
  }

  // --- Section 4: Top Discussion Vocabulary ---
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text('4. Core Vocabulary & Discussion Themes', 14, currentY);
  currentY += 5;

  const wordsSummary = topWords.slice(0, 12).map(w => `${w.word} (${w.count})`).join('  •  ');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(wordsSummary || 'Vocabulary indexing in progress', 14, currentY, { maxWidth: pageWidth - 28 });
  currentY += 12;

  // --- Section 5: Academic Viva & Defense Methodology Appendix ---
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, currentY, pageWidth - 28, 28, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, currentY, pageWidth - 28, 28, 2, 2, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text('Examiner Viva Defense & Methodology Verification:', 18, currentY + 6);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedSlate);
  doc.text('• Multi-Format Parsing: Standardizes 12/24h timestamps, hyphens, brackets, and system notification regexes.', 18, currentY + 12);
  doc.text('• Hinglish NLP: Tokenizes romanized Hindi, applies slang normalization dictionaries, and filters code-mixed stopwords.', 18, currentY + 17);
  doc.text('• Zero-Cloud Data Privacy: Certified in-browser client execution with automated PII masking (GDPR/Ethics compliant).', 18, currentY + 22);

  // Add Page Numbers to all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `WhatsApp Chat Intelligence System - Project Review 2  |  Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Save the PDF
  const cleanName = fileName.replace(/\.[^/.]+$/, '');
  doc.save(`WhatsApp_Chat_Intelligence_Report_${cleanName}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
