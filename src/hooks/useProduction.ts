import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProductionChapter {
  id: string;
  project_id: string;
  chapter_order: number;
  title: string;
  generated_content: string | null;
  status: string;
  created_at: string;
  last_updated: string;
}

export function useProductionChapters(projectId: string | undefined) {
  return useQuery({
    queryKey: ["production_chapters", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_chapters" as any)
        .select("*")
        .eq("project_id", projectId!)
        .order("chapter_order");
      if (error) throw error;
      return (data || []) as unknown as ProductionChapter[];
    },
    enabled: !!projectId,
  });
}

export function useCreateChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { project_id: string; chapter_order: number; title: string }) => {
      const { data: chapter, error } = await supabase
        .from("production_chapters" as any)
        .insert(data as any)
        .select()
        .single();
      if (error) throw error;
      return chapter as unknown as ProductionChapter;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["production_chapters", data.project_id] });
    },
    onError: (error) => {
      toast.error("Erro ao criar capítulo: " + error.message);
    },
  });
}

export function useUpdateChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, project_id, ...data }: { id: string; project_id: string; title?: string; generated_content?: string; status?: string; chapter_order?: number }) => {
      const { data: chapter, error } = await supabase
        .from("production_chapters" as any)
        .update(data as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return { ...(chapter as unknown as ProductionChapter), project_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["production_chapters", data.project_id] });
    },
  });
}

export function useDeleteChapter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { error } = await supabase
        .from("production_chapters" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      return { project_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["production_chapters", data.project_id] });
      toast.success("Capítulo removido!");
    },
  });
}
