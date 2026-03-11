import jsPDF from "jspdf";
import { MODULE_CONFIG } from "@/lib/modules";
import { renderMarkdownToPdf } from "@/lib/pdf-markdown";

interface ModuleData {
  module_number: number;
  generated_content: string | null;
}

interface ProjectData {
  name: string;
  niche: string | null;
  promise: string | null;
  target_audience: string | null;
}

export function exportProjectPdf(project: ProjectData, modules: ModuleData[]) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const addPage = () => {
    doc.addPage();
    y = margin;
  };

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      addPage();
    }
  };

  // === COVER PAGE ===
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(project.name, contentWidth);
  doc.text(titleLines, pageWidth / 2, 80, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(156, 163, 175);
  if (project.niche) {
    doc.text(project.niche, pageWidth / 2, 100 + titleLines.length * 10, { align: "center" });
  }

  doc.setFontSize(10);
  doc.text("Gerado pelo Orquestrador de Infoprodutos", pageWidth / 2, 130 + titleLines.length * 10, { align: "center" });
  doc.text(new Date().toLocaleDateString("pt-BR"), pageWidth / 2, 138 + titleLines.length * 10, { align: "center" });

  // === TABLE OF CONTENTS ===
  addPage();
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Sumário", margin, y);
  y += 15;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  MODULE_CONFIG.filter((c) => c.number > 0).forEach((config) => {
    const mod = modules.find((m) => m.module_number === config.number);
    const hasContent = !!mod?.generated_content;
    if (hasContent) {
      doc.setTextColor(34, 197, 94);
      doc.text("✓", margin, y);
    } else {
      doc.setTextColor(156, 163, 175);
      doc.text("—", margin, y);
    }
    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "normal");
    doc.text(`M${config.number} — ${config.title}`, margin + 8, y);
    y += 8;
  });

  // === BRIEFING PAGE ===
  y += 10;
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Briefing do Projeto", margin, y);
  y += 10;

  const briefingItems = [
    { label: "Nicho", value: project.niche || "Não definido" },
    { label: "Promessa", value: project.promise || "Não definida" },
    { label: "Público-alvo", value: project.target_audience || "Não definido" },
  ];

  doc.setFontSize(10);
  briefingItems.forEach((item) => {
    checkPageBreak(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 24, 39);
    doc.text(`${item.label}:`, margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(75, 85, 99);
    const lines = doc.splitTextToSize(item.value, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 5;
  });

  // === MODULE PAGES ===
  modules
    .filter((m) => m.generated_content)
    .sort((a, b) => a.module_number - b.module_number)
    .forEach((mod) => {
      const config = MODULE_CONFIG.find((c) => c.number === mod.module_number);
      if (!config || !mod.generated_content) return;

      addPage();

      // Module header
      doc.setFillColor(243, 244, 246);
      doc.rect(margin - 5, y - 5, contentWidth + 10, 18, "F");
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`M${config.number} — ${config.title}`, margin, y + 7);
      y += 20;

      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(107, 114, 128);
      doc.text(config.description, margin, y);
      y += 10;

      // Render markdown content
      const ctx = { doc, margin, contentWidth, y, pageHeight };
      renderMarkdownToPdf(ctx, mod.generated_content);
      y = ctx.y;
    });

  // === FOOTER on all pages ===
  const totalPages = doc.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(156, 163, 175);
    doc.text(
      `${project.name} — Página ${i - 1} de ${totalPages - 1}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  doc.save(`${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_projeto_completo.pdf`);
}

export function exportModulePdf(project: ProjectData, mod: ModuleData) {
  const config = MODULE_CONFIG.find((c) => c.number === mod.module_number);
  if (!config || !mod.generated_content) return;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Header
  doc.setFillColor(243, 244, 246);
  doc.rect(0, 0, pageWidth, 35, "F");
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(`M${config.number} — ${config.title}`, margin, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text(`${project.name} • ${project.niche || ""}`, margin, 28);

  // Render markdown content
  const ctx = { doc, margin, contentWidth, y: 45, pageHeight };
  renderMarkdownToPdf(ctx, mod.generated_content);

  doc.save(`M${config.number}_${config.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}
