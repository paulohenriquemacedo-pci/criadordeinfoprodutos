import jsPDF from "jspdf";

/**
 * Markdown-aware PDF renderer for jsPDF.
 * Parses markdown content and renders it with proper formatting.
 */

interface RenderContext {
  doc: jsPDF;
  margin: number;
  contentWidth: number;
  y: number;
  pageHeight: number;
}

function checkPageBreak(ctx: RenderContext, needed: number): RenderContext {
  if (ctx.y + needed > ctx.pageHeight - ctx.margin) {
    ctx.doc.addPage();
    ctx.y = ctx.margin;
  }
  return ctx;
}

/** Strip markdown bold/italic markers for measuring, return segments for styled rendering */
interface TextSegment {
  text: string;
  bold: boolean;
  italic: boolean;
}

function parseInlineStyles(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  // Match **bold**, *italic*, __bold__, _italic_
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false, italic: false });
    }
    if (match[2]) {
      // ***bold italic***
      segments.push({ text: match[2], bold: true, italic: true });
    } else if (match[3]) {
      // **bold**
      segments.push({ text: match[3], bold: true, italic: false });
    } else if (match[4]) {
      // *italic*
      segments.push({ text: match[4], bold: false, italic: true });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false, italic: false });
  }

  if (segments.length === 0) {
    segments.push({ text, bold: false, italic: false });
  }

  return segments;
}

function stripMarkdown(text: string): string {
  return text.replace(/\*\*\*(.+?)\*\*\*/g, "$1").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
}

/** Render a line of text with inline bold/italic support */
function renderStyledLine(ctx: RenderContext, text: string, fontSize: number, baseStyle: "normal" | "bold" | "italic" = "normal", color: [number, number, number] = [55, 65, 81]) {
  const segments = parseInlineStyles(text);
  const lineHeight = fontSize * 0.45; // mm per line approx

  // For mixed segments, we need to render word by word
  // First, get the full plain text to check wrapping
  const plainText = stripMarkdown(text);
  ctx.doc.setFontSize(fontSize);
  ctx.doc.setFont("helvetica", baseStyle);
  const wrappedLines = ctx.doc.splitTextToSize(plainText, ctx.contentWidth);

  if (wrappedLines.length === 1 && segments.length <= 1) {
    // Simple case: single line, no mixed styles
    checkPageBreak(ctx, lineHeight);
    const seg = segments[0];
    const style = seg.bold ? "bold" : seg.italic ? "italic" : baseStyle;
    ctx.doc.setFont("helvetica", style);
    ctx.doc.setTextColor(color[0], color[1], color[2]);
    ctx.doc.setFontSize(fontSize);
    ctx.doc.text(seg.text, ctx.margin, ctx.y);
    ctx.y += lineHeight;
    return;
  }

  // Complex case: render segment by segment with word wrapping
  let currentX = ctx.margin;
  const maxX = ctx.margin + ctx.contentWidth;

  for (const seg of segments) {
    const style = seg.bold ? "bold" : seg.italic ? "italic" : baseStyle;
    ctx.doc.setFont("helvetica", style);
    ctx.doc.setTextColor(color[0], color[1], color[2]);
    ctx.doc.setFontSize(fontSize);

    const words = seg.text.split(/(\s+)/);
    for (const word of words) {
      if (!word) continue;
      const wordWidth = ctx.doc.getTextWidth(word);
      if (currentX + wordWidth > maxX && word.trim().length > 0) {
        // Wrap to next line
        ctx.y += lineHeight;
        checkPageBreak(ctx, lineHeight);
        currentX = ctx.margin;
      }
      ctx.doc.text(word, currentX, ctx.y);
      currentX += wordWidth;
    }
  }
  ctx.y += lineHeight;
}

/** Parse and render a markdown table */
function renderTable(ctx: RenderContext, lines: string[]) {
  // Parse header
  const parseRow = (line: string) =>
    line.split("|").map((c) => c.trim()).filter((c) => c.length > 0 && !c.match(/^[-:]+$/));

  const headerCells = parseRow(lines[0]);
  // Skip separator line (lines[1])
  const dataRows = lines.slice(2).map(parseRow);

  if (headerCells.length === 0) return;

  const colCount = headerCells.length;
  const colWidth = ctx.contentWidth / colCount;
  const cellPadding = 2;
  const fontSize = 7;
  ctx.doc.setFontSize(fontSize);

  const getCellHeight = (text: string) => {
    const lines = ctx.doc.splitTextToSize(stripMarkdown(text), colWidth - cellPadding * 2);
    return Math.max(lines.length * 3.5 + cellPadding, 6);
  };

  // Render header
  const headerHeight = Math.max(...headerCells.map(getCellHeight), 6);
  checkPageBreak(ctx, headerHeight + 10);

  ctx.doc.setFillColor(229, 231, 235);
  ctx.doc.rect(ctx.margin, ctx.y - 1, ctx.contentWidth, headerHeight, "F");

  headerCells.forEach((cell, i) => {
    ctx.doc.setFont("helvetica", "bold");
    ctx.doc.setTextColor(17, 24, 39);
    ctx.doc.setFontSize(fontSize);
    const cellLines = ctx.doc.splitTextToSize(stripMarkdown(cell), colWidth - cellPadding * 2);
    ctx.doc.text(cellLines, ctx.margin + i * colWidth + cellPadding, ctx.y + 2);
  });

  ctx.y += headerHeight + 1;

  // Render data rows
  dataRows.forEach((row, rowIdx) => {
    if (row.length === 0) return;
    const rowHeight = Math.max(...row.map(getCellHeight), 6);
    checkPageBreak(ctx, rowHeight);

    // Alternate row background
    if (rowIdx % 2 === 0) {
      ctx.doc.setFillColor(249, 250, 251);
      ctx.doc.rect(ctx.margin, ctx.y - 1, ctx.contentWidth, rowHeight, "F");
    }

    // Draw row border
    ctx.doc.setDrawColor(229, 231, 235);
    ctx.doc.line(ctx.margin, ctx.y - 1 + rowHeight, ctx.margin + ctx.contentWidth, ctx.y - 1 + rowHeight);

    row.forEach((cell, i) => {
      if (i >= colCount) return;
      ctx.doc.setFont("helvetica", "normal");
      ctx.doc.setTextColor(55, 65, 81);
      ctx.doc.setFontSize(fontSize);
      const cellLines = ctx.doc.splitTextToSize(stripMarkdown(cell), colWidth - cellPadding * 2);
      ctx.doc.text(cellLines, ctx.margin + i * colWidth + cellPadding, ctx.y + 2);
    });

    ctx.y += rowHeight;
  });

  ctx.y += 4;
}

/** Main function: render markdown content to PDF */
export function renderMarkdownToPdf(ctx: RenderContext, content: string) {
  const lines = content.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line
    if (trimmed === "") {
      ctx.y += 2;
      i++;
      continue;
    }

    // Horizontal rule ---
    if (trimmed.match(/^[-*_]{3,}$/)) {
      checkPageBreak(ctx, 6);
      ctx.doc.setDrawColor(209, 213, 219);
      ctx.doc.line(ctx.margin, ctx.y, ctx.margin + ctx.contentWidth, ctx.y);
      ctx.y += 4;
      i++;
      continue;
    }

    // Headers
    const h1Match = trimmed.match(/^#\s+(.+)/);
    const h2Match = trimmed.match(/^##\s+(.+)/);
    const h3Match = trimmed.match(/^###\s+(.+)/);

    if (h1Match) {
      checkPageBreak(ctx, 14);
      ctx.y += 4;
      renderStyledLine(ctx, h1Match[1], 16, "bold", [17, 24, 39]);
      ctx.y += 2;
      i++;
      continue;
    }

    if (h2Match) {
      checkPageBreak(ctx, 12);
      ctx.y += 3;
      renderStyledLine(ctx, h2Match[1], 13, "bold", [31, 41, 55]);
      ctx.y += 1;
      i++;
      continue;
    }

    if (h3Match) {
      checkPageBreak(ctx, 10);
      ctx.y += 2;
      renderStyledLine(ctx, h3Match[1], 11, "bold", [55, 65, 81]);
      ctx.y += 1;
      i++;
      continue;
    }

    // Table detection
    if (trimmed.startsWith("|") && i + 1 < lines.length && lines[i + 1].trim().match(/^\|[\s:-]+\|/)) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      renderTable(ctx, tableLines);
      continue;
    }

    // Bullet list
    const bulletMatch = trimmed.match(/^[-*]\s+(.+)/);
    if (bulletMatch) {
      checkPageBreak(ctx, 6);
      ctx.doc.setFontSize(10);
      ctx.doc.setFont("helvetica", "normal");
      ctx.doc.setTextColor(55, 65, 81);
      ctx.doc.text("•", ctx.margin + 2, ctx.y);

      // Render the rest with inline styles at offset
      const segments = parseInlineStyles(bulletMatch[1]);
      let xPos = ctx.margin + 7;
      const bulletContentWidth = ctx.contentWidth - 7;

      // Simple approach: render full text with wrapping
      const plainText = stripMarkdown(bulletMatch[1]);
      ctx.doc.setFontSize(10);
      const wrappedLines = ctx.doc.splitTextToSize(plainText, bulletContentWidth);

      if (wrappedLines.length === 1 && segments.length <= 1) {
        const seg = segments[0];
        const style = seg.bold ? "bold" : seg.italic ? "italic" : "normal";
        ctx.doc.setFont("helvetica", style);
        ctx.doc.text(seg.text, xPos, ctx.y);
        ctx.y += 5;
      } else {
        // Render with inline styles and word wrapping
        const maxX = ctx.margin + ctx.contentWidth;
        for (const seg of segments) {
          const style = seg.bold ? "bold" : seg.italic ? "italic" : "normal";
          ctx.doc.setFont("helvetica", style);
          ctx.doc.setFontSize(10);
          const words = seg.text.split(/(\s+)/);
          for (const word of words) {
            if (!word) continue;
            const ww = ctx.doc.getTextWidth(word);
            if (xPos + ww > maxX && word.trim().length > 0) {
              ctx.y += 4.5;
              checkPageBreak(ctx, 5);
              xPos = ctx.margin + 7;
            }
            ctx.doc.text(word, xPos, ctx.y);
            xPos += ww;
          }
        }
        ctx.y += 5;
      }
      i++;
      continue;
    }

    // Numbered list
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      checkPageBreak(ctx, 6);
      ctx.doc.setFontSize(10);
      ctx.doc.setFont("helvetica", "bold");
      ctx.doc.setTextColor(55, 65, 81);
      const numLabel = `${numMatch[1]}.`;
      ctx.doc.text(numLabel, ctx.margin + 1, ctx.y);

      ctx.doc.setFont("helvetica", "normal");
      const listContentWidth = ctx.contentWidth - 8;
      const plainText = stripMarkdown(numMatch[2]);
      const wrappedLines = ctx.doc.splitTextToSize(plainText, listContentWidth);

      // Render with inline styles
      const segments = parseInlineStyles(numMatch[2]);
      let xPos = ctx.margin + 8;
      const maxX = ctx.margin + ctx.contentWidth;

      for (const seg of segments) {
        const style = seg.bold ? "bold" : seg.italic ? "italic" : "normal";
        ctx.doc.setFont("helvetica", style);
        ctx.doc.setFontSize(10);
        const words = seg.text.split(/(\s+)/);
        for (const word of words) {
          if (!word) continue;
          const ww = ctx.doc.getTextWidth(word);
          if (xPos + ww > maxX && word.trim().length > 0) {
            ctx.y += 4.5;
            checkPageBreak(ctx, 5);
            xPos = ctx.margin + 8;
          }
          ctx.doc.text(word, xPos, ctx.y);
          xPos += ww;
        }
      }
      ctx.y += 5;
      i++;
      continue;
    }

    // Regular paragraph
    checkPageBreak(ctx, 6);
    renderStyledLine(ctx, trimmed, 10, "normal", [55, 65, 81]);
    i++;
  }
}
