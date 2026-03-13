import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BrandSettings {
  id: string;
  project_id: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  heading_font: string;
  body_font: string;
  logo_url: string | null;
  visual_style: string;
  created_at: string;
  updated_at: string;
}

const DEFAULT_BRAND: Omit<BrandSettings, "id" | "project_id" | "created_at" | "updated_at"> = {
  primary_color: "#6366f1",
  secondary_color: "#8b5cf6",
  accent_color: "#f59e0b",
  background_color: "#ffffff",
  text_color: "#1f2937",
  heading_font: "Inter",
  body_font: "Inter",
  logo_url: null,
  visual_style: "clean",
};

export function useBrandSettings(projectId: string | undefined) {
  return useQuery({
    queryKey: ["brand_settings", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brand_settings" as any)
        .select("*")
        .eq("project_id", projectId!)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as BrandSettings) || null;
    },
    enabled: !!projectId,
  });
}

export function useUpsertBrandSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ project_id, ...settings }: { project_id: string } & Partial<Omit<BrandSettings, "id" | "project_id" | "created_at" | "updated_at">>) => {
      // Check if exists
      const { data: existing } = await supabase
        .from("brand_settings" as any)
        .select("id")
        .eq("project_id", project_id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("brand_settings" as any)
          .update(settings as any)
          .eq("project_id", project_id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("brand_settings" as any)
          .insert({ project_id, ...DEFAULT_BRAND, ...settings } as any);
        if (error) throw error;
      }
      return { project_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["brand_settings", data.project_id] });
      toast.success("Identidade visual salva!");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });
}

export { DEFAULT_BRAND };
