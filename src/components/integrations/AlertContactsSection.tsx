import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Users, Plus, Pencil, Trash2, Mail, MessageCircle, CheckCircle2, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AlertContact {
  id: string;
  name: string;
  email: string | null;
  whatsapp: string | null;
  is_active: boolean;
  created_at: string;
}

export const AlertContactsSection = () => {
  const [contacts, setContacts] = useState<AlertContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<AlertContact | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("alert_contacts")
        .select("*")
        .order("name");

      if (error) throw error;
      if (data) setContacts(data);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Erro ao carregar contatos");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (contact?: AlertContact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name,
        email: contact.email || "",
        whatsapp: contact.whatsapp || "",
      });
    } else {
      setEditingContact(null);
      setFormData({ name: "", email: "", whatsapp: "" });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!formData.email.trim() && !formData.whatsapp.trim()) {
      toast.error("Informe pelo menos um e-mail ou WhatsApp");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        whatsapp: formData.whatsapp.trim() || null,
      };

      if (editingContact) {
        const { error } = await supabase
          .from("alert_contacts")
          .update(payload)
          .eq("id", editingContact.id);

        if (error) throw error;
        toast.success("Contato atualizado");
      } else {
        const { error } = await supabase
          .from("alert_contacts")
          .insert(payload);

        if (error) throw error;
        toast.success("Contato criado");
      }

      setDialogOpen(false);
      fetchContacts();
    } catch (error) {
      console.error("Error saving contact:", error);
      toast.error("Erro ao salvar contato");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (contact: AlertContact) => {
    try {
      const { error } = await supabase
        .from("alert_contacts")
        .update({ is_active: !contact.is_active })
        .eq("id", contact.id);

      if (error) throw error;

      setContacts((prev) =>
        prev.map((c) => (c.id === contact.id ? { ...c, is_active: !c.is_active } : c))
      );
      toast.success(contact.is_active ? "Contato desativado" : "Contato ativado");
    } catch (error) {
      console.error("Error toggling contact:", error);
      toast.error("Erro ao alterar status");
    }
  };

  const handleDelete = async (contact: AlertContact) => {
    if (!confirm(`Deseja excluir o contato "${contact.name}"?`)) return;

    try {
      const { error } = await supabase
        .from("alert_contacts")
        .delete()
        .eq("id", contact.id);

      if (error) throw error;

      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
      toast.success("Contato excluído");
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Erro ao excluir contato");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contatos para Alertas
            </CardTitle>
            <CardDescription>
              Cadastre as pessoas que receberão alertas de saldo
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Contato
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingContact ? "Editar Contato" : "Novo Contato"}
                </DialogTitle>
                <DialogDescription>
                  Informe os dados do contato para receber alertas
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    placeholder="Nome do contato"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    placeholder="5511999999999"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData((prev) => ({ ...prev, whatsapp: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Formato: código do país + DDD + número (sem espaços ou traços)
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-4">Carregando...</p>
        ) : contacts.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-2 text-muted-foreground">Nenhum contato cadastrado</p>
            <p className="text-sm text-muted-foreground">
              Clique em "Novo Contato" para adicionar
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Contatos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {contact.email && (
                        <span className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" /> {contact.email}
                        </span>
                      )}
                      {contact.whatsapp && (
                        <span className="flex items-center gap-1 text-sm">
                          <MessageCircle className="h-3 w-3" /> {contact.whatsapp}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={
                        contact.is_active
                          ? "bg-success/10 text-success cursor-pointer"
                          : "bg-muted text-muted-foreground cursor-pointer"
                      }
                      onClick={() => handleToggleActive(contact)}
                    >
                      {contact.is_active ? (
                        <>
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Ativo
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-1 h-3 w-3" />
                          Inativo
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(contact)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(contact)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
