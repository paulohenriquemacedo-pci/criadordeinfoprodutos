import { useState, useCallback, useEffect } from "react";
import { CanvasElement } from "@/components/workspace/canvas/types";

export interface DesignTemplate {
  id: string;
  name: string;
  format: "feed" | "story";
  elements: CanvasElement[];
  bgColor: string;
  createdAt: string;
  thumbnail?: string;
}

const STORAGE_KEY = "design_templates";

function loadTemplates(): DesignTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistTemplates(templates: DesignTemplate[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {}
}

export function useDesignTemplates() {
  const [templates, setTemplates] = useState<DesignTemplate[]>(loadTemplates);

  // Sync on mount
  useEffect(() => {
    setTemplates(loadTemplates());
  }, []);

  const saveTemplate = useCallback(
    (name: string, format: "feed" | "story", elements: CanvasElement[], bgColor: string) => {
      // Strip image src from elements to keep template lightweight (images are context-dependent)
      const templateElements = elements.map((el) => {
        if (el.type === "image") {
          return { ...el, src: "" }; // Clear actual image URLs — user will add new ones
        }
        return { ...el };
      });

      const template: DesignTemplate = {
        id: `tpl_${Date.now()}`,
        name,
        format,
        elements: templateElements,
        bgColor,
        createdAt: new Date().toISOString(),
      };

      setTemplates((prev) => {
        const updated = [template, ...prev];
        persistTemplates(updated);
        return updated;
      });

      return template;
    },
    []
  );

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      persistTemplates(updated);
      return updated;
    });
  }, []);

  const renameTemplate = useCallback((id: string, newName: string) => {
    setTemplates((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, name: newName } : t));
      persistTemplates(updated);
      return updated;
    });
  }, []);

  return { templates, saveTemplate, deleteTemplate, renameTemplate };
}
