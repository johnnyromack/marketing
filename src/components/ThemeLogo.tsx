import { useTheme } from 'next-themes';
import { useEffect, useState, forwardRef } from 'react';
import RomackLogoBranco from '@/assets/RomackVision_branco.png';
import RomackLogoColorido from '@/assets/RomackVision.png';

interface ThemeLogoProps {
  className?: string;
  alt?: string;
}

export const ThemeLogo = forwardRef<HTMLImageElement, ThemeLogoProps>(
  ({ className = "h-8 w-auto", alt = "ROMACK.AI" }, ref) => {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) {
      // Return white logo as default during SSR/hydration
      return <img ref={ref} src={RomackLogoBranco} alt={alt} className={className} />;
    }

    const currentTheme = resolvedTheme || theme;
    const logoSrc = currentTheme === 'dark' ? RomackLogoBranco : RomackLogoColorido;

    return <img ref={ref} src={logoSrc} alt={alt} className={className} />;
  }
);

ThemeLogo.displayName = 'ThemeLogo';
