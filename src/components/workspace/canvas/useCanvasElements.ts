import { useState, useCallback } from "react";
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
  let z = 10; // Start text elements at z=10, leaving room for images below
  let z = 0;

  // Background image
  if (content.imageUrl) {
    elements.push({
      id: uid(), type: "image", x: 0, y: 0,
      width: canvasWidth, height: canvasHeight,
      rotation: 0, opacity: isDark ? 0.25 : 0.35,
      locked: false, visible: true, zIndex: z++,
      src: content.imageUrl,
    });
  }

  // Logo
  if (content.logoUrl) {
    elements.push({
      id: uid(), type: "logo", x: 72, y: 64,
      width: 180, height: 56, rotation: 0, opacity: 1,
      locked: false, visible: true, zIndex: z++,
      src: content.logoUrl,
    });
  }

  // Headline
  if (content.headline) {
    const fontSize = content.headline.length > 60 ? 54 : content.headline.length > 30 ? 66 : 80;
    elements.push({
      id: uid(), type: "text",
      x: 72, y: canvasHeight * 0.3,
      width: canvasWidth - 144, height: 300,
      rotation: 0, opacity: 1, locked: false, visible: true, zIndex: z++,
      text: content.headline.replace(/\*/g, ""),
      fontSize, fontFamily: brand.heading_font,
      fontStyle: "bold", fill: textColor,
      align: "left", lineHeight: 1.1,
    });
  }

  // Subheadline
  if (content.subheadline) {
    elements.push({
      id: uid(), type: "text",
      x: 72, y: canvasHeight * 0.55,
      width: canvasWidth - 144, height: 150,
      rotation: 0, opacity: 0.85, locked: false, visible: true, zIndex: z++,
      text: content.subheadline.replace(/\*/g, ""),
      fontSize: 30, fontFamily: brand.body_font,
      fontStyle: "normal", fill: textColor,
      align: "left", lineHeight: 1.4,
    });
  }

  // Body
  if (content.body) {
    elements.push({
      id: uid(), type: "text",
      x: 72, y: canvasHeight * 0.68,
      width: canvasWidth - 180, height: 200,
      rotation: 0, opacity: 0.65, locked: false, visible: true, zIndex: z++,
      text: content.body,
      fontSize: 24, fontFamily: brand.body_font,
      fontStyle: "normal", fill: textColor,
      align: "left", lineHeight: 1.6,
    });
  }

  // CTA bar background
  if (content.cta) {
    elements.push({
      id: uid(), type: "shape",
      x: 0, y: canvasHeight - 90,
      width: canvasWidth, height: 90,
      rotation: 0, opacity: 1, locked: false, visible: true, zIndex: z++,
      shapeType: "rect", fill: brand.primary_color,
    });
    elements.push({
      id: uid(), type: "text",
      x: 72, y: canvasHeight - 72,
      width: canvasWidth - 144, height: 50,
      rotation: 0, opacity: 1, locked: false, visible: true, zIndex: z++,
      text: content.cta,
      fontSize: 30, fontFamily: brand.heading_font,
      fontStyle: "bold", fill: "#FFFFFF",
      align: "center", lineHeight: 1.2,
    });
  }

  return elements;
}

export function useCanvasElements(initial: CanvasElement[]) {
  const [elements, setElements] = useState<CanvasElement[]>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
