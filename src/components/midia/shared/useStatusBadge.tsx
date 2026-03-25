import { Badge } from '@/components/ui/badge';

export const useStatusBadge = () => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'rascunho':
        return <Badge variant="outline">Rascunho</Badge>;
      case 'pendente':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Aguardando Aprovação</Badge>;
      case 'aprovado':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Aprovado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return { getStatusBadge };
};
