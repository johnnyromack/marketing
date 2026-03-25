import React from 'react';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import type { Sentiment } from '@/lib/schemas/social-media.schema';

interface SentimentBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  sentiment: Sentiment;
  score?: number;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

const SENTIMENT_CONFIG: Record<
  Sentiment,
  { icon: typeof ThumbsUp; label: string; color: string; bgColor: string }
> = {
  positive: {
    icon: ThumbsUp,
    label: 'Positivo',
    color: 'text-green-600',
    bgColor: 'bg-green-600/10',
  },
  negative: {
    icon: ThumbsDown,
    label: 'Negativo',
    color: 'text-red-600',
    bgColor: 'bg-red-600/10',
  },
  neutral: {
    icon: Minus,
    label: 'Neutro',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
};

export function SentimentBadge({
  sentiment,
  score,
  size = 'md',
  showLabel = true,
  className = '',
  ...props
}: SentimentBadgeProps) {
  const config = SENTIMENT_CONFIG[sentiment];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
  };

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <span
      {...props}
      className={`inline-flex items-center gap-1 rounded-full font-medium ${config.bgColor} ${config.color} ${sizeClasses[size]} ${className}`}
    >
      <Icon className={iconSize} />
      {showLabel && config.label}
      {score !== undefined && (
        <span className="opacity-75">
          ({score > 0 ? '+' : ''}{(score * 100).toFixed(0)}%)
        </span>
      )}
    </span>
  );
}

export function SentimentIndicator({
  score,
  className = '',
}: {
  score: number;
  className?: string;
}) {
  const sentiment: Sentiment =
    score > 0.2 ? 'positive' : score < -0.2 ? 'negative' : 'neutral';

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            sentiment === 'positive'
              ? 'bg-green-600'
              : sentiment === 'negative'
              ? 'bg-red-600'
              : 'bg-muted-foreground'
          }`}
          style={{ width: `${Math.abs(score) * 100}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground">
        {(score * 100).toFixed(0)}%
      </span>
    </div>
  );
}
