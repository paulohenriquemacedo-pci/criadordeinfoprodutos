import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ChatConversation {
  id: string;
  project_id: string;
  title: string;
  context_modules: number[];
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export function useConversations(projectId?: string) {
  return useQuery({
    queryKey: ["chat_conversations", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_conversations" as any)
        .select("*")
        .eq("project_id", projectId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ChatConversation[];
    },
    enabled: !!projectId,
  });
}

export function useMessages(conversationId?: string) {
  return useQuery({
    queryKey: ["chat_messages", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages" as any)
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as unknown as ChatMessage[];
    },
    enabled: !!conversationId,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { project_id: string; title?: string; context_modules?: number[] }) => {
      const { data, error } = await supabase
        .from("chat_conversations" as any)
        .insert({
          project_id: params.project_id,
          title: params.title || "Nova conversa",
          context_modules: params.context_modules || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ChatConversation;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["chat_conversations", vars.project_id] }),
  });
}

export function useUpdateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; title?: string; context_modules?: number[] }) => {
      const { id, ...updates } = params;
      const { error } = await supabase
        .from("chat_conversations" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat_conversations"] }),
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("chat_conversations" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat_conversations"] }),
  });
}

export function useSaveMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { conversation_id: string; role: string; content: string }) => {
      const { data, error } = await supabase
        .from("chat_messages" as any)
        .insert(params as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ChatMessage;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["chat_messages", vars.conversation_id] }),
  });
}
