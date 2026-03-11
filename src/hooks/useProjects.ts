import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export function useProjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["projects", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useProjectModules(projectId: string | undefined) {
  return useQuery({
    queryKey: ["modules", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .eq("project_id", projectId!)
        .order("module_number");
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useProjectFiles(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project_files", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_files")
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useModuleVersions(moduleId: string | undefined) {
  return useQuery({
    queryKey: ["module_versions", moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("module_versions")
        .select("*")
        .eq("module_id", moduleId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!moduleId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: { name: string; niche?: string; promise?: string; target_audience?: string }) => {
      const { data: project, error } = await supabase
        .from("projects")
        .insert({ ...data, user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projeto criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar projeto: " + error.message);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; niche?: string; promise?: string; target_audience?: string }) => {
      const { data: project, error } = await supabase
        .from("projects")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return project;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", data.id] });
    },
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, generated_content, is_outdated, research_prompt, generation_prompt }: { 
      id: string; 
      generated_content?: string; 
      is_outdated?: boolean;
      research_prompt?: string;
      generation_prompt?: string;
    }) => {
      const updateData: Record<string, any> = {};
      if (generated_content !== undefined) updateData.generated_content = generated_content;
      if (is_outdated !== undefined) updateData.is_outdated = is_outdated;
      if (research_prompt !== undefined) updateData.research_prompt = research_prompt;
      if (generation_prompt !== undefined) updateData.generation_prompt = generation_prompt;
      
      const { data, error } = await supabase
        .from("modules")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["modules", data.project_id] });
    },
  });
}

export function useMarkModulesOutdated() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("modules")
        .update({ is_outdated: true })
        .eq("project_id", projectId)
        .not("generated_content", "is", null);
      if (error) throw error;
    },
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["modules", projectId] });
      toast.info("Módulos marcados para atualização devido a mudanças no briefing.");
    },
  });
}
