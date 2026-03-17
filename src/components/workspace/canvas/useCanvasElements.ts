import { useState, useCallback, useEffect, useRef } from "react";
import { CanvasElement } from "./types";
import { BrandSettings } from "@/hooks/useBrandSettings";
import { PostContentData } from "../PostTemplate1080x1350";

let idCounter = 0;
const uid = () => `el_${++idCounter}_${Date.now()}`;

export function buildInitialElements(
  content: PostContentData,
  brand: BrandSettings,
  canvasWidth: number,
  canvasHeight: number
): CanvasElement[] {
  const textColor = brand.text_color || "#1a1a1a";
  const elements: CanvasElement[] = [];
  let z = 10;

  if (content.imageUrl) {
    elements.push({
      id: uid(), type: "image", name: "IMAGEM DE FUNDO", x: 0, y: 0,
      width: canvasWidth, height: canvasHeight,
      rotation: 0, opacity: 1,
      locked: false, visible: true, zIndex: -10,
      src: content.imageUrl,
    });
  }

  if (content.logoUrl) {
    elements.push({
      id: uid(), type: "logo", name: "LOGO", x: 72, y: 64,
      width: 180, height: 56, rotation: 0, opacity: 1,
      locked: false, visible: true, zIndex: z++,
      src: content.logoUrl,
    });
  }

  if (content.headline) {
    const fontSize = content.headline.length > 60 ? 54 : content.headline.length > 30 ? 66 : 80;
    elements.push({
      id: uid(), type: "text", name: "TÍTULO",
      x: 72, y: canvasHeight * 0.3,
      width: canvasWidth - 144, height: 300,
      rotation: 0, opacity: 1, locked: false, visible: true, zIndex: z++,
      text: content.headline.replace(/\*/g, ""),
      fontSize, fontFamily: "Bebas Neue",
      fontStyle: "bold", fill: textColor,
      align: "left", lineHeight: 0.9,
      shadowColor: "#000000", shadowBlur: 30, shadowOffsetX: 0, shadowOffsetY: 0,
    });
  }

  if (content.subheadline) {
    elements.push({
      id: uid(), type: "text", name: "SUBTÍTULO",
      x: 72, y: canvasHeight * 0.55,
      width: canvasWidth - 144, height: 150,
      rotation: 0, opacity: 0.85, locked: false, visible: true, zIndex: z++,
      text: content.subheadline.replace(/\*/g, ""),
      fontSize: 30, fontFamily: "Bebas Neue",
      fontStyle: "normal", fill: textColor,
      align: "left", lineHeight: 0.9,
      shadowColor: "#000000", shadowBlur: 30, shadowOffsetX: 0, shadowOffsetY: 0,
    });
  }

  if (content.body) {
    elements.push({
      id: uid(), type: "text", name: "CORPO",
      x: 72, y: canvasHeight * 0.68,
      width: canvasWidth - 180, height: 200,
      rotation: 0, opacity: 0.65, locked: false, visible: true, zIndex: z++,
      text: content.body,
      fontSize: 24, fontFamily: "Bebas Neue",
      fontStyle: "italic", fill: textColor,
      align: "left", lineHeight: 0.9,
      shadowColor: "#000000", shadowBlur: 30, shadowOffsetX: 0, shadowOffsetY: 0,
    });
  }

  if (content.cta) {
    elements.push({
      id: uid(), type: "shape", name: "FUNDO CTA",
      x: 0, y: canvasHeight - 90,
      width: canvasWidth, height: 90,
      rotation: 0, opacity: 1, locked: false, visible: true, zIndex: z++,
      shapeType: "rect", fill: brand.primary_color,
    });
    elements.push({
      id: uid(), type: "text", name: "CTA",
      x: 72, y: canvasHeight - 72,
      width: canvasWidth - 144, height: 50,
      rotation: 0, opacity: 1, locked: false, visible: true, zIndex: z++,
      text: content.cta,
      fontSize: 30, fontFamily: "Bebas Neue",
      fontStyle: "bold", fill: "#FFFFFF",
      align: "center", lineHeight: 0.9,
      shadowColor: "#000000", shadowBlur: 30, shadowOffsetX: 0, shadowOffsetY: 0,
    });
  }

  return elements;
}

/** Backfill `name` for legacy elements and normalize text hierarchy */
function backfillNames(elements: CanvasElement[]): CanvasElement[] {
  const canonicalTextNames = new Set(["TÍTULO", "SUBTÍTULO", "CORPO", "TEXTO", "TITULO", "SUBTITULO"]);
  const isCtaText = (el: CanvasElement) =>
    el.type === "text" && el.align === "center" && Boolean(el.fontStyle?.includes("bold"));

  const base = elements.map(el => {
    if (el.name === "TEXTO") return { ...el, name: "CORPO" };
    if (el.name === "SUBTITULO") return { ...el, name: "SUBTÍTULO" };
    if (el.name) return el;
    if (el.type === "image") return { ...el, name: "IMAGEM DE FUNDO" };
    if (el.type === "logo") return { ...el, name: "LOGO" };
    if (el.type === "text") {
      if (el.fontSize && el.fontSize >= 54) return { ...el, name: "TÍTULO" };
      if (el.fontSize && el.fontSize >= 28 && el.fontSize <= 35) {
        if (isCtaText(el)) return { ...el, name: "CTA" };
        return { ...el, name: "SUBTÍTULO" };
      }
      if (el.fontStyle?.includes("italic") && !el.fontStyle?.includes("bold")) return { ...el, name: "CORPO" };
      if (el.fontSize && el.fontSize <= 26) return { ...el, name: "CORPO" };
      return { ...el, name: "CORPO" };
    }
    if (el.type === "shape") return { ...el, name: "FUNDO CTA" };
    return el;
  });

  const hierarchyCandidates = base
    .filter(
      el =>
        el.type === "text" &&
        !isCtaText(el) &&
        (!el.name || canonicalTextNames.has(el.name.toUpperCase()))
    )
    .sort((a, b) => a.y - b.y)
    .slice(0, 3);

  if (hierarchyCandidates.length < 3) return base;

  const roleById = new Map<string, "TÍTULO" | "SUBTÍTULO" | "CORPO">([
    [hierarchyCandidates[0].id, "TÍTULO"],
    [hierarchyCandidates[1].id, "SUBTÍTULO"],
    [hierarchyCandidates[2].id, "CORPO"],
  ]);

  return base.map(el => {
    const forcedRole = roleById.get(el.id);
    if (!forcedRole) return el;
    if (forcedRole === "CORPO") {
      return {
        ...el,
        name: "CORPO",
        fontStyle: el.fontStyle?.includes("italic") ? el.fontStyle : "italic",
      };
    }
    return { ...el, name: forcedRole };
  });
}

export function useCanvasElements(
  initial: CanvasElement[],
  storageKey?: string,
  canvasSize?: { width: number; height: number }
) {
  const initialRef = useRef(initial);
  initialRef.current = initial;

  const [elements, setElements] = useState<CanvasElement[]>(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return backfillNames(parsed);
        }
      } catch {}
    }
    return backfillNames(initial);
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Reload elements when storageKey changes (e.g. switching between feed/story)
  const prevKeyRef = useRef(storageKey);
  useEffect(() => {
    if (prevKeyRef.current === storageKey) return;
    // Save current elements under the OLD key before switching
    const oldKey = prevKeyRef.current;
    if (oldKey) {
      try {
        localStorage.setItem(oldKey, JSON.stringify(elements));
      } catch {}
    }
    prevKeyRef.current = storageKey;
    setSelectedId(null);
    // Try to load saved data for this format
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setElements(backfillNames(parsed));
            return;
          }
        }
      } catch {}
    }
    // No saved data: clone from previous format and adapt image sizes
    if (oldKey && canvasSize) {
      try {
        const oldSaved = localStorage.getItem(oldKey);
        if (oldSaved) {
          const oldElements: CanvasElement[] = JSON.parse(oldSaved);
          if (Array.isArray(oldElements) && oldElements.length > 0) {
            const adapted = oldElements.map(el => {
              // Resize full-bleed background images to new canvas size
              if ((el.type === "image") && el.x === 0 && el.y === 0) {
                return { ...el, width: canvasSize.width, height: canvasSize.height };
              }
              // Resize full-width shapes (e.g. CTA bar) to new width
              if (el.type === "shape" && el.x === 0 && el.width >= 1000) {
                return { ...el, width: canvasSize.width };
              }
              return { ...el };
            });
            setElements(backfillNames(adapted));
            return;
          }
        }
      } catch {}
    }
    setElements(backfillNames(initialRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Persist elements to localStorage on every change
  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(elements));
    } catch {}
  }, [elements, storageKey]);

  const updateElement = useCallback((id: string, changes: Partial<CanvasElement>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...changes } : el));
  }, []);

  const deleteElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setSelectedId(null);
  }, []);

  const addElement = useCallback((el: CanvasElement) => {
    setElements(prev => [...prev, el]);
    setSelectedId(el.id);
  }, []);

  const duplicateElement = useCallback((id: string) => {
    setElements(prev => {
      const source = prev.find(el => el.id === id);
      if (!source) return prev;
      const dup = { ...source, id: uid(), x: source.x + 20, y: source.y + 20 };
      return [...prev, dup];
    });
  }, []);

  const moveLayer = useCallback((id: string, dir: "up" | "down") => {
    setElements(prev => {
      const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex(el => el.id === id);
      if (idx < 0) return prev;
      const swapIdx = dir === "up" ? idx + 1 : idx - 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
      const oldZ = sorted[idx].zIndex;
      sorted[idx].zIndex = sorted[swapIdx].zIndex;
      sorted[swapIdx].zIndex = oldZ;
      return sorted;
    });
  }, []);

  const selectedElement = elements.find(el => el.id === selectedId) || null;

  return {
    elements, setElements, selectedId, setSelectedId,
    selectedElement, updateElement, deleteElement,
    addElement, duplicateElement, moveLayer,
  };
}
