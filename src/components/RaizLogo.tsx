import { useTheme } from 'next-themes';
import { useEffect, useState, forwardRef } from 'react';
import RaizLogoBranca from '@/assets/LOGO_RAIZ_branca.png';
import RaizLogoColorida from '@/assets/LOGO_RAIZ_colorida.png';

interface RaizLogoProps {
  className?: string;
  alt?: string;
}

export const RaizLogo = forwardRef<HTMLImageElement, RaizLogoProps>(
  ({ className = "h-8 w-auto", alt = "Raiz Educação" }, ref) => {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
    }, []);

    if (!mounted) {
      return <img ref={ref} src={RaizLogoBranca} alt={alt} className={className} />;
    }

    const currentTheme = resolvedTheme || theme;
    const logoSrc = currentTheme === 'dark' ? RaizLogoBranca : RaizLogoColorida;

    return <img ref={ref} src={logoSrc} alt={alt} className={className} />;
  }
);

RaizLogo.displayName = 'RaizLogo';
