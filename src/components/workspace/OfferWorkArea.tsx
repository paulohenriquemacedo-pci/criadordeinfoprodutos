import { useState, useEffect } from "react";
import { useProducts, useProductBonuses, useProductBumps, useCreateProduct, useUpdateProduct, useDeleteProduct, useCreateBonus, useDeleteBonus, useCreateBump, useDeleteBump, useSaveOfferVersion, Product } from "@/hooks/useOffers";
import { useProjectModules } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Package, Gift, Zap, Sparkles, Loader2, Save, Upload, FileText, BookOpen, LayoutGrid, Download, Send, RefreshCw } from "lucide-react";
import { HelpTooltip } from "@/components/HelpTooltip";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { buildProjectContext } from "@/lib/context-builder";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  projectId: string;
  project: any;
}

function ProductForm({ product, projectId, onClose }: { product?: Product; projectId: string; onClose: () => void }) {
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const [form, setForm] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price?.toString() || "",
    product_type: product?.product_type || "digital",
    positioning: product?.positioning || "",
    delivery_format: product?.delivery_format || "",
    target_transformation: product?.target_transformation || "",
  });

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    const payload = {
      ...form,
      price: form.price ? parseFloat(form.price) : null,
    };
    if (product) {
      await updateProduct.mutateAsync({ id: product.id, project_id: projectId, ...payload });
      toast.success("Produto atualizado!");
    } else {
      await createProduct.mutateAsync({ project_id: projectId, ...payload });
    }
    onClose();
  };

  return (
    <div className="space-y-4">
      <Input placeholder="Nome do produto *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
      <Textarea placeholder="Descrição detalhada" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Preço (R$)" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
        <Select value={form.product_type} onValueChange={v => setForm(p => ({ ...p, product_type: v }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="digital">Digital</SelectItem>
            <SelectItem value="fisico">Físico</SelectItem>
            <SelectItem value="servico">Serviço</SelectItem>
            <SelectItem value="hibrido">Híbrido</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Textarea placeholder="Posicionamento / diferencial competitivo" value={form.positioning} onChange={e => setForm(p => ({ ...p, positioning: e.target.value }))} rows={2} />
      <Input placeholder="Formato de entrega (ex: curso online, ebook, mentoria)" value={form.delivery_format} onChange={e => setForm(p => ({ ...p, delivery_format: e.target.value }))} />
      <Textarea placeholder="Transformação principal prometida ao cliente" value={form.target_transformation} onChange={e => setForm(p => ({ ...p, target_transformation: e.target.value }))} rows={2} />
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSave} disabled={createProduct.isPending || updateProduct.isPending}>
          {product ? "Salvar" : "Criar Produto"}
        </Button>
      </div>
    </div>
  );
}

function BonusList({ productId }: { productId: string }) {
  const { data: bonuses } = useProductBonuses(productId);
  const createBonus = useCreateBonus();
  const deleteBonus = useDeleteBonus();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", perceived_value: "", delivery_type: "imediato", strategic_function: "" });

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    await createBonus.mutateAsync({
      product_id: productId,
      name: form.name,
      description: form.description || undefined,
      perceived_value: form.perceived_value ? parseFloat(form.perceived_value) : undefined,
      delivery_type: form.delivery_type,
      strategic_function: form.strategic_function || undefined,
      sort_order: (bonuses?.length || 0),
    });
    setForm({ name: "", description: "", perceived_value: "", delivery_type: "imediato", strategic_function: "" });
    setAdding(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5"><Gift className="h-4 w-4 text-primary" /> Bônus</h4>
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)} className="gap-1"><Plus className="h-3 w-3" /> Adicionar</Button>
      </div>
      {bonuses?.map(b => (
        <Card key={b.id} className="bg-secondary/30">
          <CardContent className="p-3 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium">{b.name}</p>
              {b.description && <p className="text-xs text-muted-foreground mt-0.5">{b.description}</p>}
              <div className="flex gap-2 mt-1">
                {b.perceived_value && <Badge variant="outline" className="text-[10px]">Valor: R${b.perceived_value}</Badge>}
                {b.delivery_type && <Badge variant="secondary" className="text-[10px]">{b.delivery_type}</Badge>}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteBonus.mutate({ id: b.id, product_id: productId })}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </CardContent>
        </Card>
      ))}
      {adding && (
        <Card className="border-dashed">
          <CardContent className="p-3 space-y-2">
            <Input placeholder="Nome do bônus *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <Textarea placeholder="Descrição" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Valor percebido (R$)" type="number" value={form.perceived_value} onChange={e => setForm(p => ({ ...p, perceived_value: e.target.value }))} />
              <Select value={form.delivery_type} onValueChange={v => setForm(p => ({ ...p, delivery_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="imediato">Imediato</SelectItem>
                  <SelectItem value="condicional">Condicional</SelectItem>
                  <SelectItem value="progressivo">Progressivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea placeholder="Função estratégica (ex: reduzir objeção de preço)" value={form.strategic_function} onChange={e => setForm(p => ({ ...p, strategic_function: e.target.value }))} rows={2} />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleAdd} disabled={createBonus.isPending}>Adicionar</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {!bonuses?.length && !adding && <p className="text-xs text-muted-foreground italic">Nenhum bônus cadastrado</p>}
    </div>
  );
}

function BumpList({ productId }: { productId: string }) {
  const { data: bumps } = useProductBumps(productId);
  const createBump = useCreateBump();
  const deleteBump = useDeleteBump();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", bump_type: "order_bump", trigger_point: "checkout", value_proposition: "" });

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    await createBump.mutateAsync({
      product_id: productId,
      name: form.name,
      description: form.description || undefined,
      price: form.price ? parseFloat(form.price) : undefined,
      bump_type: form.bump_type,
      trigger_point: form.trigger_point,
      value_proposition: form.value_proposition || undefined,
      sort_order: (bumps?.length || 0),
    });
    setForm({ name: "", description: "", price: "", bump_type: "order_bump", trigger_point: "checkout", value_proposition: "" });
    setAdding(false);
  };

  const bumpTypeLabel: Record<string, string> = { order_bump: "Order Bump", upsell: "Upsell", downsell: "Downsell" };
  const triggerLabel: Record<string, string> = { checkout: "Checkout", "pos-compra": "Pós-Compra", abandono: "Abandono" };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5"><Zap className="h-4 w-4 text-primary" /> Order Bumps / Upsells</h4>
        <Button variant="ghost" size="sm" onClick={() => setAdding(true)} className="gap-1"><Plus className="h-3 w-3" /> Adicionar</Button>
      </div>
      {bumps?.map(b => (
        <Card key={b.id} className="bg-secondary/30">
          <CardContent className="p-3 flex items-start justify-between">
            <div>
              <p className="text-sm font-medium">{b.name}</p>
              {b.description && <p className="text-xs text-muted-foreground mt-0.5">{b.description}</p>}
              <div className="flex gap-2 mt-1">
                <Badge variant="outline" className="text-[10px]">{bumpTypeLabel[b.bump_type] || b.bump_type}</Badge>
                {b.price && <Badge variant="secondary" className="text-[10px]">R${b.price}</Badge>}
                {b.trigger_point && <Badge variant="secondary" className="text-[10px]">{triggerLabel[b.trigger_point] || b.trigger_point}</Badge>}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteBump.mutate({ id: b.id, product_id: productId })}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </CardContent>
        </Card>
      ))}
      {adding && (
        <Card className="border-dashed">
          <CardContent className="p-3 space-y-2">
            <Input placeholder="Nome *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <Textarea placeholder="Descrição" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Preço (R$)" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
              <Select value={form.bump_type} onValueChange={v => setForm(p => ({ ...p, bump_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="order_bump">Order Bump</SelectItem>
                  <SelectItem value="upsell">Upsell</SelectItem>
                  <SelectItem value="downsell">Downsell</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.trigger_point} onValueChange={v => setForm(p => ({ ...p, trigger_point: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkout">Checkout</SelectItem>
                  <SelectItem value="pos-compra">Pós-Compra</SelectItem>
                  <SelectItem value="abandono">Abandono</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea placeholder="Proposta de valor (por que o cliente compraria isso junto?)" value={form.value_proposition} onChange={e => setForm(p => ({ ...p, value_proposition: e.target.value }))} rows={2} />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleAdd} disabled={createBump.isPending}>Adicionar</Button>
            </div>
          </CardContent>
        </Card>
      )}
      {!bumps?.length && !adding && <p className="text-xs text-muted-foreground italic">Nenhum bump cadastrado</p>}
    </div>
  );
}

export default function OfferWorkArea({ projectId, project }: Props) {
  const { data: products, isLoading } = useProducts(projectId);
  const deleteProduct = useDeleteProduct();
  const saveVersion = useSaveOfferVersion();
  const createProduct = useCreateProduct();
  const createBonus = useCreateBonus();
  const createBump = useCreateBump();
  const { data: modules } = useProjectModules(projectId);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [evaluating, setEvaluating] = useState(false);
  const [evalProgress, setEvalProgress] = useState(0);
  const [evalStage, setEvalStage] = useState("");
  const [evaluation, setEvaluation] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [importingM2, setImportingM2] = useState(false);
  const [refinementInput, setRefinementInput] = useState("");
  const [refining, setRefining] = useState(false);

  // Load last saved evaluation when selecting a product
  useEffect(() => {
    setEvaluation("");
    if (!selectedProduct) return;
    const loadLastEvaluation = async () => {
      const { data } = await supabase
        .from("offer_versions")
        .select("snapshot")
        .eq("product_id", selectedProduct.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (data?.[0]?.snapshot) {
        const snapshot = data[0].snapshot as any;
        if (snapshot.evaluation) {
          setEvaluation(snapshot.evaluation);
        }
      }
    };
    loadLastEvaluation();
  }, [selectedProduct?.id]);

  const handleDownloadEvaluation = () => {
    if (!evaluation || !selectedProduct) return;
    const blob = new Blob([evaluation], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `avaliacao-${selectedProduct.name.replace(/\s+/g, "-").toLowerCase()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportFromModules = async (moduleNumbers: number[]) => {
    setImportingM2(true);
    try {
      const relevantModules = modules?.filter(m => moduleNumbers.includes(m.module_number) && m.generated_content);
      if (!relevantModules?.length) {
        toast.error(`Os módulos selecionados ainda não foram gerados. Complete-os primeiro.`);
        return;
      }

      const combinedText = relevantModules
        .map(m => {
          const labels: Record<number, string> = { 1: "Briefing", 2: "Estrutura do Produto", 3: "Copy e VSL", 6: "E-mail Marketing", 7: "Funil WhatsApp", 8: "Funil de Vendas" };
          return `=== MÓDULO ${m.module_number} - ${labels[m.module_number] || `Módulo ${m.module_number}`} ===\n${m.generated_content}`;
        })
        .join("\n\n---\n\n");

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-offer-from-files`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ filesText: combinedText }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${response.status}`);
      }

      const result = await response.json();

      if (!result.products?.length) {
        toast.error("Não foi possível identificar produtos nos módulos selecionados.");
        return;
      }

      for (const p of result.products) {
        const product = await createProduct.mutateAsync({
          project_id: projectId,
          name: p.name,
          description: p.description || undefined,
          product_type: p.product_type || "digital",
          positioning: p.positioning || undefined,
          delivery_format: p.delivery_format || undefined,
          target_transformation: p.target_transformation || undefined,
        });

        if (p.bonuses?.length) {
          for (let i = 0; i < p.bonuses.length; i++) {
            const b = p.bonuses[i];
            await createBonus.mutateAsync({
              product_id: product.id,
              name: b.name,
              description: b.description || undefined,
              delivery_type: b.delivery_type || "imediato",
              strategic_function: b.strategic_function || undefined,
              sort_order: i,
            });
          }
        }

        if (p.bumps?.length) {
          for (let i = 0; i < p.bumps.length; i++) {
            const b = p.bumps[i];
            await createBump.mutateAsync({
              product_id: product.id,
              name: b.name,
              description: b.description || undefined,
              bump_type: b.bump_type || "order_bump",
              trigger_point: b.trigger_point || "checkout",
              value_proposition: b.value_proposition || undefined,
              sort_order: i,
            });
          }
        }

        setSelectedProduct(product);
      }

      toast.success(`${result.products.length} produto(s) importado(s) com sucesso!`);
    } catch (err: any) {
      toast.error("Erro ao importar dos módulos: " + err.message);
    } finally {
      setImportingM2(false);
    }
  };

  const handleImportFromFiles = async () => {
    setImporting(true);
    try {
      const { data: files, error } = await supabase
        .from("project_files")
        .select("file_name, extracted_text, file_type")
        .eq("project_id", projectId)
        .not("extracted_text", "is", null);

      if (error) throw error;
      if (!files?.length) {
        toast.error("Nenhum material base encontrado. Envie seus arquivos primeiro na seção 'Material Base'.");
        return;
      }

      const filesText = files
        .map((f: any) => `=== ARQUIVO: ${f.file_name || "Sem nome"} (${f.file_type}) ===\n${f.extracted_text}`)
        .join("\n\n");

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-offer-from-files`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ filesText }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${response.status}`);
      }

      const result = await response.json();

      if (!result.products?.length) {
        toast.error("Não foi possível identificar produtos no material enviado.");
        return;
      }

      for (const p of result.products) {
        const product = await createProduct.mutateAsync({
          project_id: projectId,
          name: p.name,
          description: p.description || undefined,
          product_type: p.product_type || "digital",
          positioning: p.positioning || undefined,
          delivery_format: p.delivery_format || undefined,
          target_transformation: p.target_transformation || undefined,
        });

        if (p.bonuses?.length) {
          for (let i = 0; i < p.bonuses.length; i++) {
            const b = p.bonuses[i];
            await createBonus.mutateAsync({
              product_id: product.id,
              name: b.name,
              description: b.description || undefined,
              delivery_type: b.delivery_type || "imediato",
              strategic_function: b.strategic_function || undefined,
              sort_order: i,
            });
          }
        }

        if (p.bumps?.length) {
          for (let i = 0; i < p.bumps.length; i++) {
            const b = p.bumps[i];
            await createBump.mutateAsync({
              product_id: product.id,
              name: b.name,
              description: b.description || undefined,
              bump_type: b.bump_type || "order_bump",
              trigger_point: b.trigger_point || "checkout",
              value_proposition: b.value_proposition || undefined,
              sort_order: i,
            });
          }
        }

        setSelectedProduct(product);
      }

      toast.success(`${result.products.length} produto(s) importado(s) com sucesso!`);
    } catch (err: any) {
      toast.error("Erro ao importar: " + err.message);
    } finally {
      setImporting(false);
    }
  };

  const handleEvaluateOffer = async () => {
    if (!selectedProduct) { toast.error("Selecione um produto primeiro"); return; }
    setEvaluating(true);
    setEvaluation("");
    setEvalProgress(5);
    setEvalStage("Preparando contexto...");

    try {
      setEvalProgress(10);
      setEvalStage("Construindo contexto do projeto...");
      const context = await buildProjectContext(projectId);
      setEvalProgress(20);
      setEvalStage("Carregando dados da oferta...");

      // Fetch bonuses and bumps for the selected product
      const { data: bonuses } = await supabase.from("product_bonuses" as any).select("*").eq("product_id", selectedProduct.id).order("sort_order");
      const { data: bumps } = await supabase.from("product_bumps" as any).select("*").eq("product_id", selectedProduct.id).order("sort_order");

      const offerContext = `
PRODUTO PRINCIPAL:
- Nome: ${selectedProduct.name}
- Descrição: ${selectedProduct.description || "N/A"}
- Preço: ${selectedProduct.price ? `R$${selectedProduct.price}` : "Não definido"}
- Tipo: ${selectedProduct.product_type}
- Posicionamento: ${selectedProduct.positioning || "N/A"}
- Formato de entrega: ${selectedProduct.delivery_format || "N/A"}
- Transformação prometida: ${selectedProduct.target_transformation || "N/A"}

BÔNUS (${(bonuses as any[])?.length || 0}):
${(bonuses as any[])?.map((b: any) => `- ${b.name}: ${b.description || ""} | Valor percebido: ${b.perceived_value ? `R$${b.perceived_value}` : "N/A"} | Entrega: ${b.delivery_type} | Função: ${b.strategic_function || "N/A"}`).join("\n") || "Nenhum bônus cadastrado"}

BUMPS/UPSELLS (${(bumps as any[])?.length || 0}):
${(bumps as any[])?.map((b: any) => `- ${b.name} (${b.bump_type}): ${b.description || ""} | Preço: ${b.price ? `R$${b.price}` : "N/A"} | Trigger: ${b.trigger_point} | Proposta: ${b.value_proposition || "N/A"}`).join("\n") || "Nenhum bump cadastrado"}`;

      setEvalProgress(30);
      setEvalStage("Enviando para avaliação IA...");
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate-offer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            offerContext,
            projectContext: context.fullContext,
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${response.status}`);
      }

      if (!response.body) throw new Error("Stream não disponível");

      setEvalProgress(40);
      setEvalStage("Gerando avaliação...");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let result = "";
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "" || !line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            // Support both OpenAI format and Gemini native format
            const content = parsed.choices?.[0]?.delta?.content
              || parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) {
              result += content;
              chunkCount++;
              // Progress from 40% to 85% during streaming
              const streamProgress = Math.min(85, 40 + chunkCount * 0.5);
              setEvalProgress(streamProgress);
              setEvaluation(result);
            }
          } catch { /* partial json */ }
        }
      }
      setEvalProgress(90);
      setEvalStage("Salvando resultado...");

      // Save version snapshot
      const snapshot = {
        product: selectedProduct,
        bonuses: bonuses || [],
        bumps: bumps || [],
        evaluation: result,
        timestamp: new Date().toISOString(),
      };
      await saveVersion.mutateAsync({ product_id: selectedProduct.id, snapshot });
      setEvalProgress(100);
      setEvalStage("Concluído!");

    } catch (err: any) {
      toast.error("Erro na avaliação: " + err.message);
    } finally {
      setEvaluating(false);
      setTimeout(() => { setEvalProgress(0); setEvalStage(""); }, 1500);
    }
  };

  // Also save M9 module content when evaluation is done
  const handleSaveToModule = async () => {
    if (!evaluation) return;
    const m9 = modules?.find(m => m.module_number === 9);
    if (!m9) return;
    await supabase.from("modules").update({ generated_content: evaluation, is_outdated: false } as any).eq("id", m9.id);
    toast.success("Avaliação salva no módulo M9!");
  };

  const handleRefineEvaluation = async () => {
    if (!refinementInput.trim() || !selectedProduct || !evaluation) return;
    setRefining(true);

    try {
      const context = await buildProjectContext(projectId);

      const { data: bonuses } = await supabase.from("product_bonuses" as any).select("*").eq("product_id", selectedProduct.id).order("sort_order");
      const { data: bumps } = await supabase.from("product_bumps" as any).select("*").eq("product_id", selectedProduct.id).order("sort_order");

      const offerContext = `
PRODUTO PRINCIPAL:
- Nome: ${selectedProduct.name}
- Descrição: ${selectedProduct.description || "N/A"}
- Preço: ${selectedProduct.price ? `R$${selectedProduct.price}` : "Não definido"}
- Tipo: ${selectedProduct.product_type}
- Posicionamento: ${selectedProduct.positioning || "N/A"}
- Formato de entrega: ${selectedProduct.delivery_format || "N/A"}
- Transformação prometida: ${selectedProduct.target_transformation || "N/A"}

BÔNUS (${(bonuses as any[])?.length || 0}):
${(bonuses as any[])?.map((b: any) => `- ${b.name}: ${b.description || ""} | Valor percebido: ${b.perceived_value ? `R$${b.perceived_value}` : "N/A"}`).join("\n") || "Nenhum"}

BUMPS/UPSELLS (${(bumps as any[])?.length || 0}):
${(bumps as any[])?.map((b: any) => `- ${b.name} (${b.bump_type}): ${b.description || ""} | Preço: ${b.price ? `R$${b.price}` : "N/A"}`).join("\n") || "Nenhum"}`;

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const refinementPrompt = `${context.fullContext}\n\n========\n\nOFERTA AVALIADA:\n${offerContext}\n\n========\n\nAVALIAÇÃO ANTERIOR (GERADA POR VOCÊ):\n${evaluation}\n\n========\n\nFEEDBACK DO USUÁRIO PARA REFINAMENTO:\n${refinementInput}\n\nCom base no feedback acima, REFINE e APRIMORE a avaliação anterior. Considere os novos elementos, contexto e perspectivas fornecidos. Mantenha a mesma estrutura de avaliação, mas atualize as análises, notas e recomendações conforme o novo entendimento. Seja específico sobre o que mudou em relação à avaliação anterior.`;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate-offer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            offerContext: refinementPrompt,
            projectContext: "",
          }),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${response.status}`);
      }
      if (!response.body) throw new Error("Stream não disponível");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let result = "";

      setEvaluation("");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "" || !line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content
              || parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (content) {
              result += content;
              setEvaluation(result);
            }
          } catch { /* partial json */ }
        }
      }

      // Save refined version
      const snapshot = {
        product: selectedProduct,
        bonuses: bonuses || [],
        bumps: bumps || [],
        evaluation: result,
        refinement: refinementInput,
        timestamp: new Date().toISOString(),
      };
      await saveVersion.mutateAsync({ product_id: selectedProduct.id, snapshot });
      setRefinementInput("");
      toast.success("Avaliação refinada e salva!");

    } catch (err: any) {
      toast.error("Erro ao refinar: " + err.message);
    } finally {
      setRefining(false);
    }
  };

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: Product Management */}
      <div className="w-1/2 border-r border-border/50 flex flex-col">
        <div className="p-4 border-b border-border/30 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Definição de Oferta <HelpTooltip text="Cadastre produtos, bônus e order bumps. Importe dados dos módulos ou de PDFs. Use 'Avaliar Oferta' para a IA pontuar e sugerir melhorias." side="bottom" /></h2>
            <p className="text-xs text-muted-foreground">Cadastre seus produtos, bônus e bumps</p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5" disabled={importing || importingM2}>
                  {(importing || importingM2) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {importing ? "Importando materiais..." : importingM2 ? "Importando do M2..." : "Importar Produto"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Escolha a origem do produto</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleImportFromFiles} className="gap-2 cursor-pointer">
                  <FileText className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Material Base (arquivos)</p>
                    <p className="text-xs text-muted-foreground">Extrair produto dos arquivos enviados pelo usuário</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleImportFromModules([2])} className="gap-2 cursor-pointer">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">M2 — Estrutura do Produto</p>
                    <p className="text-xs text-muted-foreground">Produto principal + bônus definidos no M2</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleImportFromModules([2, 6, 7, 8])} className="gap-2 cursor-pointer">
                  <LayoutGrid className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Todos os Módulos (M2+M6+M7+M8)</p>
                    <p className="text-xs text-muted-foreground">Consolida produto, bônus, bumps e upsells de todos os módulos</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" onClick={() => { setEditingProduct(undefined); setProductFormOpen(true); }} className="gap-1.5">
              <Plus className="h-4 w-4" /> Novo Produto
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {products?.map(product => (
              <Card
                key={product.id}
                className={`cursor-pointer transition-all ${selectedProduct?.id === product.id ? "border-primary/50 bg-primary/5" : "hover:border-border"}`}
                onClick={() => setSelectedProduct(product)}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{product.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className="text-[10px]">{product.product_type}</Badge>
                      {product.price && <Badge variant="outline" className="text-[10px]">R${product.price}</Badge>}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); setEditingProduct(product); setProductFormOpen(true); }}>
                        <Sparkles className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); deleteProduct.mutate({ id: product.id, project_id: projectId }); }}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {product.description && <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>}
                  {product.target_transformation && <p className="text-xs text-primary/80 mt-1">🎯 {product.target_transformation}</p>}
                </CardContent>
              </Card>
            ))}

            {!products?.length && (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum produto cadastrado</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Crie seu primeiro produto para começar</p>
              </div>
            )}

            {selectedProduct && (
              <div className="space-y-4 mt-4 pt-4 border-t border-border/30">
                <h3 className="text-sm font-semibold text-foreground">Detalhes: {selectedProduct.name}</h3>
                <BonusList productId={selectedProduct.id} />
                <BumpList productId={selectedProduct.id} />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right: AI Evaluation */}
      <div className="w-1/2 flex flex-col">
        <div className="p-4 border-b border-border/30 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Avaliação da Oferta</h2>
            <p className="text-xs text-muted-foreground">IA analisa sua oferta com base em M1-M8</p>
          </div>
          <div className="flex gap-2">
            {evaluation && (
              <>
                <Button variant="outline" size="sm" onClick={handleDownloadEvaluation} className="gap-1.5">
                  <Download className="h-4 w-4" /> Download
                </Button>
                <Button variant="outline" size="sm" onClick={handleSaveToModule} className="gap-1.5">
                  <Save className="h-4 w-4" /> Salvar no M9
                </Button>
              </>
            )}
            <Button
              size="sm"
              onClick={handleEvaluateOffer}
              disabled={evaluating || !selectedProduct}
              className="gap-1.5"
            >
              {evaluating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {evaluating ? "Avaliando..." : "Avaliar Oferta"}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {evaluating && evalProgress > 0 && (
          <div className="px-4 py-2 border-b border-border/30 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{evalStage}</span>
              <span className="font-medium text-primary">{Math.round(evalProgress)}%</span>
            </div>
            <Progress value={evalProgress} className="h-1.5" />
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="p-4">
            {evaluation ? (
              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap text-sm leading-relaxed">
                {evaluation}
              </div>
            ) : (
              <div className="text-center py-16">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                <p className="text-sm text-muted-foreground">
                  {selectedProduct
                    ? "Clique em 'Avaliar Oferta' para que a IA analise a viabilidade desta oferta"
                    : "Selecione um produto à esquerda para avaliar a oferta"}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-2">
                  A avaliação considera todo o contexto estratégico dos módulos M1 a M8
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Refinement input */}
        {evaluation && !evaluating && (
          <div className="p-3 border-t border-border/30 space-y-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <RefreshCw className="h-3 w-3" />
              Refinar & Aprofundar — forneça contexto adicional para a IA reconsiderar
            </p>
            <div className="flex gap-2">
              <Textarea
                placeholder="Ex: 'Considere que meu público tem ticket médio de R$200' ou 'Aprofunde a análise dos bônus considerando que o concorrente X oferece...' "
                value={refinementInput}
                onChange={e => setRefinementInput(e.target.value)}
                rows={2}
                className="flex-1 text-sm resize-none"
              />
              <Button
                size="sm"
                onClick={handleRefineEvaluation}
                disabled={refining || !refinementInput.trim()}
                className="gap-1.5 self-end"
              >
                {refining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {refining ? "Refinando..." : "Enviar"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Dialog */}
      <Dialog open={productFormOpen} onOpenChange={setProductFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <ProductForm
            product={editingProduct}
            projectId={projectId}
            onClose={() => setProductFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
