import { Zap, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { EmptyStateProps } from './types';

export function EmptyState({ onCreate }: EmptyStateProps) {
  return (
    <Card className="text-center" data-testid="empty-state">
      <CardContent className="py-12 px-4">
        <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-base font-semibold text-foreground mb-2">
          Nenhuma automação configurada
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Crie regras para automatizar ações com base em eventos de social media
        </p>
        <Button onClick={onCreate} data-testid="btn-create-first">
          <Plus className="w-4 h-4 mr-2" />
          Criar Primeira Automação
        </Button>
      </CardContent>
    </Card>
  );
}
