import { ChatMessage, FileCategory, FileItem } from '../types';

// Regex to identify direct file mentions with extensions (e.g., DAA_Assignment_3.pdf, notes.docx)
const FILE_EXT_REGEX = /\b([a-zA-Z0-9_\-.\s]+\.(pdf|docx?|pptx?|xlsx?|csv|zip|rar|tar\.gz|ipynb|py|cpp|java|txt))\b/gi;

// WhatsApp file attached format: "filename.ext (file attached)"
const ATTACHED_REGEX = /([a-zA-Z0-9_\-.\s]+\.[a-zA-Z0-9]+)\s*\(file attached\)/i;

// Drive / Cloud sharing URLs
const CLOUD_DRIVE_REGEX = /(https?:\/\/(?:drive|docs)\.google\.com\/[^\s]+|https?:\/\/(?:www\.)?(?:dropbox|onedrive|github|notion)\.(?:com|so)\/[^\s]+)/gi;

function categorizeExtension(ext: string): FileCategory {
  const clean = ext.toLowerCase().replace('.', '');
  if (clean === 'pdf') return 'pdf';
  if (['doc', 'docx', 'txt', 'rtf'].includes(clean)) return 'document';
  if (['ppt', 'pptx', 'key'].includes(clean)) return 'presentation';
  if (['xls', 'xlsx', 'csv'].includes(clean)) return 'spreadsheet';
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(clean)) return 'archive';
  if (['py', 'cpp', 'java', 'js', 'ts', 'html', 'css', 'ipynb'].includes(clean)) return 'code';
  return 'other';
}

function cleanFileName(raw: string): string {
  return raw.replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Extracts all files, document attachments, and cloud storage links from WhatsApp chat messages.
 */
export function extractFilesAndResources(messages: ChatMessage[]): FileItem[] {
  const fileItems: FileItem[] = [];
  const seenKeys = new Set<string>();

  for (const msg of messages) {
    if (msg.messageType === 'system' || msg.messageType === 'deleted') continue;

    const text = msg.message;

    // 1. Check for "(file attached)" pattern common in WhatsApp exports
    const attachedMatch = text.match(ATTACHED_REGEX);
    if (attachedMatch) {
      const fileName = cleanFileName(attachedMatch[1]);
      const extMatch = fileName.match(/\.([a-zA-Z0-9]+)$/);
      const ext = extMatch ? extMatch[1].toLowerCase() : 'file';
      const key = `${msg.id}-${fileName}`;

      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        fileItems.push({
          id: `file-${msg.id}-${fileItems.length}`,
          messageId: msg.id,
          fileName,
          fileExtension: ext,
          category: categorizeExtension(ext),
          sender: msg.user,
          dateStr: msg.dateStr,
          timeStr: msg.timeStr,
          originalMessage: msg.message,
          contextNote: text.replace(ATTACHED_REGEX, '').trim() || undefined
        });
      }
    }

    // 2. Check for explicit file extensions in text (e.g. "DAA_Assignment_3.pdf" or "take this lab_manual.docx")
    let match: RegExpExecArray | null;
    FILE_EXT_REGEX.lastIndex = 0;
    while ((match = FILE_EXT_REGEX.exec(text)) !== null) {
      const fileName = cleanFileName(match[1]);
      const ext = match[2].toLowerCase();
      const key = `${msg.id}-${fileName}`;

      if (!seenKeys.has(key) && fileName.length >= 4) {
        seenKeys.add(key);
        fileItems.push({
          id: `file-${msg.id}-${fileItems.length}`,
          messageId: msg.id,
          fileName,
          fileExtension: ext,
          category: categorizeExtension(ext),
          sender: msg.user,
          dateStr: msg.dateStr,
          timeStr: msg.timeStr,
          originalMessage: msg.message,
          contextNote: text.replace(match[0], '').trim() || undefined
        });
      }
    }

    // 3. Check for cloud drive / storage URLs
    CLOUD_DRIVE_REGEX.lastIndex = 0;
    let urlMatch: RegExpExecArray | null;
    while ((urlMatch = CLOUD_DRIVE_REGEX.exec(text)) !== null) {
      const url = urlMatch[1];
      const key = `${msg.id}-${url}`;

      // Derive human friendly title from message context or URL
      let title = 'Cloud Shared Document / Folder';
      const surroundingText = text.replace(url, '').trim();
      if (surroundingText.length > 3 && surroundingText.length < 60) {
        title = surroundingText;
      } else if (url.includes('drive.google.com')) {
        title = 'Google Drive Shared Resource';
      } else if (url.includes('docs.google.com')) {
        title = 'Google Docs / Sheets Document';
      } else if (url.includes('github.com')) {
        title = 'GitHub Repository / Code Link';
      }

      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        fileItems.push({
          id: `drive-${msg.id}-${fileItems.length}`,
          messageId: msg.id,
          fileName: title,
          fileExtension: 'cloud',
          category: 'cloud_drive',
          sender: msg.user,
          dateStr: msg.dateStr,
          timeStr: msg.timeStr,
          originalMessage: msg.message,
          directUrl: url,
          contextNote: surroundingText || undefined
        });
      }
    }
  }

  return fileItems;
}

/**
 * Fuzzy search / semantic-like search for files
 * User query examples:
 * "daa assignment 3 pdf"
 * "maths notes"
 * "drive link"
 * "rohan slides"
 */
export function searchFiles(files: FileItem[], query: string): FileItem[] {
  if (!query || !query.trim()) return files;

  const tokens = query.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);

  const scored = files.map(file => {
    let score = 0;
    const nameLower = file.fileName.toLowerCase();
    const extLower = file.fileExtension.toLowerCase();
    const senderLower = file.sender.toLowerCase();
    const contextLower = (file.contextNote || '').toLowerCase();
    const msgLower = file.originalMessage.toLowerCase();

    for (const token of tokens) {
      // Direct filename match
      if (nameLower.includes(token)) {
        score += 15;
        if (nameLower.startsWith(token)) score += 5;
      }
      // Exact extension match (e.g. "pdf", "docx")
      if (extLower === token || (token.startsWith('.') && extLower === token.slice(1))) {
        score += 20;
      }
      // Sender match (e.g. "Rohan", "Meera")
      if (senderLower.includes(token)) {
        score += 10;
      }
      // Surrounding conversational context match
      if (contextLower.includes(token)) {
        score += 8;
      } else if (msgLower.includes(token)) {
        score += 5;
      }
      // Category match (e.g. "pdf", "code", "drive", "assignment")
      if (file.category.toLowerCase().includes(token)) {
        score += 10;
      }
    }

    return { ...file, matchScore: score };
  });

  return scored
    .filter(item => (item.matchScore ?? 0) > 0)
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
}

/**
 * Generates a synthetic mock/companion PDF document for download in the browser
 * when the user asks to download an indexed PDF from a .txt chat export!
 */
export function generateSyntheticPdfBlob(file: FileItem): Blob {
  // Simple PDF generator using text canvas representation
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 280 >>
stream
BT
/F1 18 Tf
50 720 Td
(${file.fileName}) Tj
/F1 12 Tf
0 -30 Td
(Shared by: ${file.sender} on ${file.dateStr} at ${file.timeStr}) Tj
0 -25 Td
(Retrieved via: WhatsApp Chat Intelligence & Document Finder) Tj
0 -40 Td
(Context from chat:) Tj
0 -20 Td
(${file.originalMessage.replace(/[()\\]/g, ' ')}) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000224 00000 n 
0000000557 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
634
%%EOF`;

  return new Blob([content], { type: 'application/pdf' });
}
