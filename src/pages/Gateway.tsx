import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Sparkles, Rocket, Cpu, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Gateway() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (err) {
      console.error("Erro ao sair:", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <Sparkles className="h-9 w-9 text-primary animate-pulse" />
            <h1 className="text-4xl font-extrabold tracking-tight gradient-text">SISTEMA A.C.A.D.E.M.I.A.</h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Seja bem-vindo. Selecione a plataforma que deseja acessar no momento.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground/80">
            <span>Sessão ativa: <strong className="text-foreground">{user?.email}</strong></span>
          </div>
        </div>

        {/* System Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mb-10">
          {/* Card 1: Orquestrador */}
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card 
              className="glass-panel border-border/50 h-full flex flex-col cursor-pointer group transition-colors hover:border-primary/50"
              onClick={() => navigate("/dashboard")}
            >
              <CardHeader className="flex-1">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary/20 transition-colors">
                  <Rocket className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl group-hover:text-primary transition-colors flex items-center gap-2">
                  Orquestrador
                </CardTitle>
                <CardDescription className="text-sm mt-2 leading-relaxed">
                  Criação sequencial de infoprodutos do M1 ao M9. Painel com pesquisa de mercado automatizada via Perplexity/Gemini, geração em lote, editor de prompts de IA e integração Canva.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                  Entrar no Orquestrador
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 2: Command Center */}
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card 
              className="glass-panel border-border/50 h-full flex flex-col cursor-pointer group transition-colors hover:border-accent-cyan/50"
              onClick={() => window.location.href = "/command-center/"}
            >
              <CardHeader className="flex-1">
                <div className="w-12 h-12 rounded-lg bg-accent-cyan/10 flex items-center justify-center text-accent-cyan mb-4 group-hover:bg-accent-cyan/20 transition-colors" style={{ color: '#00ffff' }}>
                  <Cpu className="h-6 w-6" />
                </div>
                <CardTitle className="text-2xl group-hover:text-accent-cyan transition-colors flex items-center gap-2" style={{ '--accent-cyan-hover': '#00ffff' }}>
                  Command Center
                </CardTitle>
                <CardDescription className="text-sm mt-2 leading-relaxed">
                  Integração local (FastAPI) e assistente de IA offline. Auditoria de Coerência (M0) em tempo real sincronizada com a sua pasta de arquivos locais.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="secondary" className="w-full mt-4 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                  Entrar no Command Center
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Footer Actions */}
        <Button 
          variant="ghost" 
          onClick={handleLogout}
          className="text-muted-foreground hover:text-destructive flex items-center gap-2 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair da Conta / Desconectar</span>
        </Button>
      </div>
    </div>
  );
}
