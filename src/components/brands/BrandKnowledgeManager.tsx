import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBrandKnowledge, BrandKnowledge } from "@/hooks/useBrandKnowledge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  BookOpen, Globe, FileText, Upload, Trash2, Loader2, Brain, ExternalLink,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface BrandKnowledgeManagerProps {
  brandId: string;
  brandName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BrandKnowledgeManager({ brandId, brandName, open, onOpenChange }: BrandKnowledgeManagerProps) {
  const { data: knowledge = [], isLoading, refetch } = useBrandKnowledge(brandId);

  const [activeTab, setActiveTab] = useState("list");
  const [url, setUrl] = useState("");
  const [urlTitle, setUrlTitle] = useState("");
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingItem, setViewingItem] = useState<BrandKnowledge | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileTitle, setFileTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleScrapeUrl = async () => {
    if (!url) return;
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-brand-knowledge", {
        body: { action: "scrape_url", brand_id: brandId, url, title: urlTitle },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const pages = data?.pages_scraped || 1;
      toast.success(`Site processado! ${pages} página(s) lida(s) e adicionada(s) à base de conhecimento.`);
      setUrl("");
      setUrlTitle("");
      setActiveTab("list");
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao processar o site. Verifique a URL.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveDocument = async () => {
    if (!docContent) return;
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-brand-knowledge", {
        body: { action: "save_document", brand_id: brandId, title: docTitle, content: docContent },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Documento processado e adicionado!");
      setDocTitle("");
      setDocContent("");
      setActiveTab("list");
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao processar o documento.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("brand_id", brandId);
      formData.append("title", fileTitle || selectedFile.name);

      const { data, error } = await supabase.functions.invoke("process-brand-knowledge", {
        body: formData,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error || data.hint || "Erro no upload");
      toast.success("Arquivo processado e adicionado!");
      setSelectedFile(null);
      setFileTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setActiveTab("list");
      refetch();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao processar o arquivo. Tente colar o texto na aba 'Adicionar Texto'.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke("process-brand-knowledge", {
        body: { action: "delete", brand_id: brandId, knowledge_id: id },
      });
      if (error) throw error;
      toast.success("Item removido da base de conhecimento.");
      refetch();
      if (viewingItem?.id === id) setViewingItem(null);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao remover item.");
    }
  };

  const sourceIcon = (type: string) => {
    if (type === "website") return <Globe className="h-4 w-4 text-blue-500" />;
    if (type === "document") return <FileText className="h-4 w-4 text-orange-500" />;
    return <BookOpen className="h-4 w-4 text-green-500" />;
  };

  const sourceLabel = (type: string) => {
    if (type === "website") return "Site";
    if (type === "document") return "Documento";
    return "Manual";
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Base de Conhecimento — {brandName}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="list" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Itens ({knowledge.length})
              </TabsTrigger>
              <TabsTrigger value="url" className="gap-2">
                <Globe className="h-4 w-4" />
                Site
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-2">
                <Upload className="h-4 w-4" />
                Arquivo
              </TabsTrigger>
              <TabsTrigger value="doc" className="gap-2">
                <FileText className="h-4 w-4" />
                Texto
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : knowledge.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Brain className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-2">Nenhum conhecimento cadastrado</p>
                  <p className="text-sm text-muted-foreground">
                    Adicione sites, arquivos ou documentos para que a IA conheça melhor esta marca.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3 pr-4">
                    {knowledge.map((item) => (
                      <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setViewingItem(item)}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              {sourceIcon(item.source_type)}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{item.title}</p>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {item.content.slice(0, 150)}...
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {sourceLabel(item.source_type)}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(item.created_at).toLocaleDateString("pt-BR")}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="url" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>URL do site</Label>
                <Input
                  placeholder="https://www.exemplo.com.br"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Título (opcional)</Label>
                <Input
                  placeholder="Ex: Site institucional"
                  value={urlTitle}
                  onChange={(e) => setUrlTitle(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                O site inteiro será rastreado (até 20 páginas) e todo o conteúdo será processado pela IA.
              </p>
              <Button onClick={handleScrapeUrl} disabled={!url || isProcessing} className="w-full gap-2">
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                {isProcessing ? "Processando site..." : "Processar Site"}
              </Button>
            </TabsContent>

            <TabsContent value="upload" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Arquivo (PDF, Word, TXT, CSV)</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.md,.csv,.text,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,text/markdown"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Título (opcional)</Label>
                <Input
                  placeholder="Ex: Proposta pedagógica 2026"
                  value={fileTitle}
                  onChange={(e) => setFileTitle(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Envie arquivos PDF (.pdf), Word (.docx), texto (.txt) ou CSV. O conteúdo será extraído e processado pela IA automaticamente.
              </p>
              <Button onClick={handleFileUpload} disabled={!selectedFile || isProcessing} className="w-full gap-2">
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {isProcessing ? "Processando arquivo..." : "Enviar e Processar"}
              </Button>
            </TabsContent>

            <TabsContent value="doc" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Título do documento</Label>
                <Input
                  placeholder="Ex: Proposta pedagógica 2026"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <Textarea
                  placeholder="Cole aqui o conteúdo do documento, informações sobre a marca, público-alvo, metodologia, tom de voz..."
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Ideal para copiar/colar textos de PDFs, Word ou qualquer documento. O conteúdo será processado pela IA.
              </p>
              <Button onClick={handleSaveDocument} disabled={!docContent || isProcessing} className="w-full gap-2">
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                {isProcessing ? "Processando..." : "Processar e Salvar"}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* View Item Dialog */}
      <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingItem && sourceIcon(viewingItem.source_type)}
              {viewingItem?.title}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[500px] pr-4">
            {viewingItem && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{sourceLabel(viewingItem.source_type)}</Badge>
                  {viewingItem.source_url && (
                    <a href={viewingItem.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" />
                      {viewingItem.source_url}
                    </a>
                  )}
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{viewingItem.content}</ReactMarkdown>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
