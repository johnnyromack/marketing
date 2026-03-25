import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Heart, MessageCircle, Users, Clock } from 'lucide-react';

interface HealthScore {
  overall: number;
  components: {
    sentiment: number;
    reach: number;
    engagement: number;
    response_time: number;
  };
}

interface HealthScoreCardProps {
  score: HealthScore;
  className?: string;
}

const COMPONENT_CONFIG = {
  sentiment: { label: 'Sentimento', icon: Heart, color: 'text-pink-500' },
  reach: { label: 'Alcance', icon: Users, color: 'text-blue-500' },
  engagement: { label: 'Engajamento', icon: MessageCircle, color: 'text-green-500' },
  response_time: { label: 'Tempo Resposta', icon: Clock, color: 'text-orange-500' },
};

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-600';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Bom';
  if (score >= 40) return 'Regular';
  return 'Precisa Atencao';
}

export function HealthScoreCard({ score, className = '' }: HealthScoreCardProps) {
  const overallColor = getScoreColor(score.overall);
  const overallLabel = getScoreLabel(score.overall);

  return (
    <Card className={className} data-testid="health-score-card">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Health Score
          </h3>
        </div>

        {/* Overall score */}
        <div className="flex items-center justify-center mb-6" data-testid="health-score-overall">
          <div className="relative">
            {/* Score circle */}
            <div className="w-32 h-32 rounded-full border-8 border-muted flex items-center justify-center">
              <div className="text-center">
                <span className={`text-4xl font-bold ${overallColor}`} data-testid="health-score-value">
                  {score.overall}
                </span>
                <span className="block text-xs text-muted-foreground" data-testid="health-score-label">
                  {overallLabel}
                </span>
              </div>
            </div>

            {/* Progress ring (using conic gradient) */}
            <svg
              className="absolute inset-0 w-32 h-32 -rotate-90"
              viewBox="0 0 128 128"
            >
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${score.overall * 3.52} 352`}
                className={overallColor}
              />
            </svg>
          </div>
        </div>

        {/* Components breakdown */}
        <div className="grid grid-cols-2 gap-2" data-testid="health-score-components">
          {(Object.entries(score.components) as Array<[keyof typeof COMPONENT_CONFIG, number]>).map(([key, value]) => {
            const config = COMPONENT_CONFIG[key];
            const Icon = config.icon;
            const valueColor = getScoreColor(value);

            return (
              <div
                key={key}
                className="flex items-center gap-2 p-2 rounded-md bg-muted"
                data-testid={`health-component-${key}`}
              >
                <Icon className={`w-4 h-4 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <span className="block text-xs text-muted-foreground truncate">
                    {config.label}
                  </span>
                  <span className={`text-sm font-semibold ${valueColor}`}>
                    {value}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function HealthScoreCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-5 h-5 rounded-full" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="flex justify-center mb-6">
          <Skeleton className="w-32 h-32 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-14 rounded-md" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
