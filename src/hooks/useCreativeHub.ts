import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CreativeTask {
  id: string;
  project_id: string;
  category: string;
  title: string;
  description: string | null;
  template_type: string | null;
  prompt_input: string | null;
  context_modules: number[] | null;
  tone: string | null;
  status: string;
  favorite_version_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreativeVersion {
  id: string;
  task_id: string;
  version_number: number;
  content: string;
  refinement_prompt: string | null;
  is_favorite: boolean;
  created_at: string;
}

export function useCreativeTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: ["creative_tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creative_tasks" as any)
        .select("*")
        .eq("project_id", projectId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as unknown as CreativeTask[];
    },
    enabled: !!projectId,
  });
}

export function useCreativeVersions(taskId: string | undefined) {
  return useQuery({
    queryKey: ["creative_versions", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("creative_versions" as any)
        .select("*")
        .eq("task_id", taskId!)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data as unknown as CreativeVersion[];
    },
    enabled: !!taskId,
  });
}

export function useCreateCreativeTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      project_id: string;
      category: string;
      title: string;
      description?: string;
      template_type?: string;
      prompt_input?: string;
      context_modules?: number[];
      tone?: string;
    }) => {
      const { data: task, error } = await supabase
        .from("creative_tasks" as any)
        .insert(data as any)
        .select()
        .single();
      if (error) throw error;
      return task as unknown as CreativeTask;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["creative_tasks", data.project_id] });
    },
    onError: (err: any) => toast.error("Erro ao criar task: " + err.message),
  });
}

export function useUpdateCreativeTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, project_id, ...data }: { id: string; project_id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("creative_tasks" as any)
        .update(data as any)
        .eq("id", id);
      if (error) throw error;
      return { id, project_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["creative_tasks", data.project_id] });
    },
  });
}

export function useDeleteCreativeTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { error } = await supabase
        .from("creative_tasks" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      return { project_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["creative_tasks", data.project_id] });
      toast.success("Task removida!");
    },
  });
}

export function useCreateCreativeVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      task_id: string;
      version_number: number;
      content: string;
      refinement_prompt?: string;
    }) => {
      const { data: version, error } = await supabase
        .from("creative_versions" as any)
        .insert(data as any)
        .select()
        .single();
      if (error) throw error;
      return version as unknown as CreativeVersion;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["creative_versions", data.task_id] });
    },
  });
}

export function useToggleFavoriteVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, task_id, is_favorite }: { id: string; task_id: string; is_favorite: boolean }) => {
      const { error } = await supabase
        .from("creative_versions" as any)
        .update({ is_favorite } as any)
        .eq("id", id);
      if (error) throw error;
      return { task_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["creative_versions", data.task_id] });
    },
  });
}
