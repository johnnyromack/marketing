import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Sparkles, Send, Loader2 } from "lucide-react";

interface AISimulationDialogProps {
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
}

export function AISimulationDialog({ onSubmit, isLoading = false }: AISimulationDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim());
      setPrompt("");
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2 bg-[hsl(var(--chart-1))] hover:bg-[hsl(var(--chart-1))]/90 text-white">
          <Sparkles className="h-4 w-4" />
          Simular com IA
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[hsl(var(--chart-1))]" />
            Simulação com IA
          </DialogTitle>
          <DialogDescription>
            Descreva o cenário que deseja simular e a IA irá sugerir parâmetros otimizados.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Textarea
            placeholder="Ex: Quero atingir 300 matrículas com orçamento de R$ 600.000 mantendo o CAC abaixo de R$ 2.000. Considere uma curva de conversão mais agressiva nos últimos meses..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[120px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isLoading}
            className="w-full gap-2 bg-[hsl(var(--chart-1))] hover:bg-[hsl(var(--chart-1))]/90 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Gerar Simulação
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
