import { useCallback } from 'react';
import { Check } from 'lucide-react';
import { PlatformIcon, PLATFORM_CONFIG } from '../shared/PlatformIcon';
import type { SocialPlatform } from '@/lib/schemas/social-media.schema';

interface PlatformSelectorProps {
  selected: SocialPlatform[];
  onChange: (platforms: SocialPlatform[]) => void;
  availablePlatforms?: SocialPlatform[];
  disabled?: boolean;
  className?: string;
}

const DEFAULT_PLATFORMS: SocialPlatform[] = [
  'instagram',
  'facebook',
  'linkedin',
  'tiktok',
  'twitter',
];

export function PlatformSelector({
  selected,
  onChange,
  availablePlatforms = DEFAULT_PLATFORMS,
  disabled = false,
  className = '',
}: PlatformSelectorProps) {
  const togglePlatform = useCallback(
    (platform: SocialPlatform) => {
      if (disabled) return;

      if (selected.includes(platform)) {
        onChange(selected.filter((p) => p !== platform));
      } else {
        onChange([...selected, platform]);
      }
    },
    [selected, onChange, disabled]
  );

  return (
    <div data-testid="platform-selector" className={className}>
      <span
        data-testid="platform-label"
        className="mb-1 block font-medium text-sm text-foreground"
      >
        Plataformas
      </span>
      <div data-testid="platform-options" className="flex flex-wrap gap-1">
        {availablePlatforms.map((platform) => {
          const isSelected = selected.includes(platform);
          const config = PLATFORM_CONFIG[platform];

          return (
            <button
              key={platform}
              type="button"
              data-testid={`platform-${platform}`}
              data-selected={isSelected}
              onClick={() => togglePlatform(platform)}
              disabled={disabled}
              className={`flex items-center gap-1 rounded-md border px-3 py-2 transition-all duration-150 ${
                isSelected
                  ? `border-primary ${config.bgColor} ring-1 ring-primary`
                  : 'border-border bg-card hover:border-primary'
              } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} `}
            >
              <PlatformIcon platform={platform} size="sm" />
              <span className="text-sm text-foreground">
                {config.label}
              </span>
              {isSelected && (
                <Check
                  className="h-4 w-4 text-primary"
                  data-testid={`platform-check-${platform}`}
                />
              )}
            </button>
          );
        })}
      </div>
      {selected.length === 0 && (
        <p
          data-testid="platform-error"
          className="mt-1 text-xs text-red-600"
        >
          Selecione pelo menos uma plataforma
        </p>
      )}
    </div>
  );
}

export function PlatformChips({
  platforms,
  className = '',
}: {
  platforms: SocialPlatform[];
  className?: string;
}) {
  return (
    <div data-testid="platform-chips" className={`flex flex-wrap gap-1 ${className}`}>
      {platforms.map((platform) => (
        <div
          key={platform}
          data-testid={`chip-${platform}`}
          className={`rounded p-1 ${PLATFORM_CONFIG[platform].bgColor}`}
          title={PLATFORM_CONFIG[platform].label}
        >
          <PlatformIcon platform={platform} size="sm" />
        </div>
      ))}
    </div>
  );
}
