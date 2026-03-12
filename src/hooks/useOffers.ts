import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Product {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  price: number | null;
  product_type: string;
  positioning: string | null;
  delivery_format: string | null;
  target_transformation: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ProductBonus {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  perceived_value: number | null;
  delivery_type: string | null;
  strategic_function: string | null;
  sort_order: number;
  created_at: string;
}

export interface ProductBump {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  price: number | null;
  bump_type: string;
  trigger_point: string | null;
  value_proposition: string | null;
  sort_order: number;
  created_at: string;
}

export function useProducts(projectId: string | undefined) {
  return useQuery({
    queryKey: ["products", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products" as any)
        .select("*")
        .eq("project_id", projectId!)
        .order("created_at");
      if (error) throw error;
      return (data || []) as unknown as Product[];
    },
    enabled: !!projectId,
  });
}

export function useProductBonuses(productId: string | undefined) {
  return useQuery({
    queryKey: ["product_bonuses", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_bonuses" as any)
        .select("*")
        .eq("product_id", productId!)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as unknown as ProductBonus[];
    },
    enabled: !!productId,
  });
}

export function useProductBumps(productId: string | undefined) {
  return useQuery({
    queryKey: ["product_bumps", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_bumps" as any)
        .select("*")
        .eq("product_id", productId!)
        .order("sort_order");
      if (error) throw error;
      return (data || []) as unknown as ProductBump[];
    },
    enabled: !!productId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { project_id: string; name: string; description?: string; price?: number; product_type?: string; positioning?: string; delivery_format?: string; target_transformation?: string }) => {
      const { data: product, error } = await supabase
        .from("products" as any)
        .insert(data as any)
        .select()
        .single();
      if (error) throw error;
      return product as unknown as Product;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products", data.project_id] });
      toast.success("Produto criado!");
    },
    onError: (err: any) => toast.error("Erro ao criar produto: " + err.message),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, project_id, ...data }: { id: string; project_id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("products" as any)
        .update(data as any)
        .eq("id", id);
      if (error) throw error;
      return { id, project_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products", data.project_id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, project_id }: { id: string; project_id: string }) => {
      const { error } = await supabase
        .from("products" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      return { project_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["products", data.project_id] });
      toast.success("Produto removido!");
    },
  });
}

export function useCreateBonus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { product_id: string; name: string; description?: string; perceived_value?: number; delivery_type?: string; strategic_function?: string; sort_order?: number }) => {
      const { data: bonus, error } = await supabase
        .from("product_bonuses" as any)
        .insert(data as any)
        .select()
        .single();
      if (error) throw error;
      return bonus as unknown as ProductBonus;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product_bonuses", data.product_id] });
      toast.success("Bônus adicionado!");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });
}

export function useDeleteBonus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, product_id }: { id: string; product_id: string }) => {
      const { error } = await supabase
        .from("product_bonuses" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      return { product_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product_bonuses", data.product_id] });
      toast.success("Bônus removido!");
    },
  });
}

export function useCreateBump() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { product_id: string; name: string; description?: string; price?: number; bump_type?: string; trigger_point?: string; value_proposition?: string; sort_order?: number }) => {
      const { data: bump, error } = await supabase
        .from("product_bumps" as any)
        .insert(data as any)
        .select()
        .single();
      if (error) throw error;
      return bump as unknown as ProductBump;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product_bumps", data.product_id] });
      toast.success("Bump adicionado!");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });
}

export function useDeleteBump() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, product_id }: { id: string; product_id: string }) => {
      const { error } = await supabase
        .from("product_bumps" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
      return { product_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["product_bumps", data.product_id] });
      toast.success("Bump removido!");
    },
  });
}

export function useSaveOfferVersion() {
  return useMutation({
    mutationFn: async ({ product_id, snapshot }: { product_id: string; snapshot: any }) => {
      const { error } = await supabase
        .from("offer_versions" as any)
        .insert({ product_id, snapshot } as any);
      if (error) throw error;
    },
  });
}
