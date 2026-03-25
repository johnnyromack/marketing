import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Target, CheckCircle2 } from 'lucide-react';

interface LogoDetection {
  brand: string;
  confidence: number;
  bounding_box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface LogoDetectionCardProps {
  imageUrl: string;
  detections: LogoDetection[];
  platform?: string;
  analyzedAt: string;
  onClick?: () => void;
  className?: string;
}

export function LogoDetectionCard({
  imageUrl,
  detections,
  platform,
  analyzedAt,
  onClick,
  className = '',
}: LogoDetectionCardProps) {
  const hasDetections = detections.length > 0;
  const avgConfidence = hasDetections
    ? detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length
    : 0;

  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all hover:border-primary ${className}`}
    >
      <CardContent className="p-4">
        {/* Image preview with overlay */}
        <div className="relative mb-2 aspect-video overflow-hidden rounded-md bg-muted">
          <img src={imageUrl} alt="Analyzed content" className="h-full w-full object-cover" />

          {/* Detection count badge */}
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
            <Target className="h-3 w-3" />
            {detections.length} logos
          </div>

          {/* Bounding boxes overlay */}
          {detections.map((detection, idx) => (
            <div
              key={idx}
              className="absolute rounded border-2 border-primary"
              style={{
                left: `${(detection.bounding_box.x / 1000) * 100}%`,
                top: `${(detection.bounding_box.y / 1000) * 100}%`,
                width: `${(detection.bounding_box.width / 1000) * 100}%`,
                height: `${(detection.bounding_box.height / 1000) * 100}%`,
              }}
            >
              <span className="absolute -top-5 left-0 rounded bg-primary px-1 text-[10px] text-white">
                {detection.brand}
              </span>
            </div>
          ))}
        </div>

        {/* Detection info */}
        <div className="space-y-2">
          {/* Brands detected */}
          {hasDetections ? (
            <div className="flex flex-wrap gap-1">
              {detections.map((detection, idx) => (
                <span
                  key={idx}
                  className="bg-primary/10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-primary text-xs"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {detection.brand}
                  <span className="text-muted-foreground">
                    {(detection.confidence * 100).toFixed(0)}%
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              Nenhum logo detectado
            </span>
          )}

          {/* Meta info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              {platform && <span className="capitalize">{platform}</span>}
              <span>{new Date(analyzedAt).toLocaleDateString('pt-BR')}</span>
            </div>
            {hasDetections && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Confianca: {(avgConfidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function LogoDetectionCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <Skeleton className="mb-2 aspect-video w-full rounded-md" />
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}
