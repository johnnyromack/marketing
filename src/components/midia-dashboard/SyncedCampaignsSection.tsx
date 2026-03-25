import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdsIntegrations, AdsCampaign } from '@/hooks/useAdsIntegrations';
import { useMarcasUnidadesData } from '@/hooks/useMarcasUnidadesData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, Link2, ExternalLink, Facebook, TrendingUp, Eye, MousePointer, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

interface SyncedCampaignsSectionProps {
  marcaFilter?: string[];
}

export const SyncedCampaignsSection = ({ marcaFilter }: SyncedCampaignsSectionProps) => {
  const { campaigns, integrations, loading, syncing, syncAll, updateCampaignMarca } = useAdsIntegrations();
  const { marcas } = useMarcasUnidadesData();
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (integrations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campanhas Sincronizadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Conecte suas contas do Meta Ads e Google Ads para visualizar campanhas ativas
            </p>
            <Link to="/integracoes">
              <Button>
                <Link2 className="h-4 w-4 mr-2" />
                Configurar Integrações
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter campaigns
  let filteredCampaigns = campaigns;
  
  if (platformFilter !== 'all') {
    filteredCampaigns = filteredCampaigns.filter(c => 
      c.integration?.platform === platformFilter
    );
  }
  
  if (statusFilter !== 'all') {
    filteredCampaigns = filteredCampaigns.filter(c => c.status === statusFilter);
  }

  if (marcaFilter && marcaFilter.length > 0) {
    filteredCampaigns = filteredCampaigns.filter(c => 
      c.marca && marcaFilter.includes(c.marca)
    );
  }

  // Calculate totals
  const totals = filteredCampaigns.reduce(
    (acc, c) => ({
      spend: acc.spend + (c.spend || 0),
      impressions: acc.impressions + (c.impressions || 0),
      clicks: acc.clicks + (c.clicks || 0),
    }),
    { spend: 0, impressions: 0, clicks: 0 }
  );

  const avgCtr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-lg">Campanhas Sincronizadas ({filteredCampaigns.length})</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="meta">Meta Ads</SelectItem>
                <SelectItem value="google">Google Ads</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ACTIVE">Ativo</SelectItem>
                <SelectItem value="PAUSED">Pausado</SelectItem>
                <SelectItem value="ARCHIVED">Arquivado</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={syncAll} disabled={syncing}>
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
            <Link to="/integracoes">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Investimento</span>
            </div>
            <p className="text-xl font-semibold">{formatCurrency(totals.spend)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Eye className="h-4 w-4" />
              <span className="text-sm">Impressões</span>
            </div>
            <p className="text-xl font-semibold">{formatNumber(totals.impressions)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <MousePointer className="h-4 w-4" />
              <span className="text-sm">Cliques</span>
            </div>
            <p className="text-xl font-semibold">{formatNumber(totals.clicks)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">CTR Médio</span>
            </div>
            <p className="text-xl font-semibold">{avgCtr.toFixed(2)}%</p>
          </div>
        </div>

        {/* Table */}
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma campanha encontrada com os filtros selecionados
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Campanha</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Investimento</TableHead>
                  <TableHead className="text-right">Impressões</TableHead>
                  <TableHead className="text-right">Cliques</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">CPC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.slice(0, 20).map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      {campaign.integration?.platform === 'meta' ? (
                        <Facebook className="h-4 w-4 text-blue-600" />
                      ) : (
                        <GoogleIcon />
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.integration?.account_name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={campaign.marca || 'none'}
                        onValueChange={(value) => 
                          updateCampaignMarca(campaign.id, value === 'none' ? null : value)
                        }
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {marcas.map(m => (
                            <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {campaign.status === 'ACTIVE' ? 'Ativo' : 
                         campaign.status === 'PAUSED' ? 'Pausado' : campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(campaign.spend)}</TableCell>
                    <TableCell className="text-right">{formatNumber(campaign.impressions)}</TableCell>
                    <TableCell className="text-right">{formatNumber(campaign.clicks)}</TableCell>
                    <TableCell className="text-right">{campaign.ctr.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{formatCurrency(campaign.cpc)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredCampaigns.length > 20 && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Mostrando 20 de {filteredCampaigns.length} campanhas
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SyncedCampaignsSection;
