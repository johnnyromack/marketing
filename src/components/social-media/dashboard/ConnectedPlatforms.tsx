import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { ALL_PLATFORMS } from './constants';
import type { ConnectedPlatformsProps } from './types';

export function ConnectedPlatforms({ className, connectors, isLoading }: ConnectedPlatformsProps) {
  const navigate = useNavigate();

  const getConnectorStatus = (platform: string) => {
    const connector = connectors.find(c => c.platform === platform);
    return connector?.status ?? 'disconnected';
  };

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">
            Plataformas Conectadas
          </h3>
          <button
            onClick={() => navigate('/social-media/connectors')}
            className="text-sm text-primary hover:underline"
          >
            Gerenciar
          </button>
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            ALL_PLATFORMS.map((platform) => {
              const status = getConnectorStatus(platform.platform);
              return (
                <div
                  key={platform.name}
                  className="flex items-center justify-between p-2 rounded-md bg-muted min-w-0"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <platform.icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground truncate">
                      {platform.name}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      status === 'connected'
                        ? 'bg-green-600/10 text-green-600'
                        : status === 'error' || status === 'expired'
                        ? 'bg-red-600/10 text-red-600'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {status === 'connected' ? 'Conectado' : status === 'error' ? 'Erro' : status === 'expired' ? 'Expirado' : 'Desconectado'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
