import { ThemeLogo } from '@/components/ThemeLogo';

export const AppFooter = () => {
  return (
    <footer className="border-t border-border/20 py-1.5 px-4 bg-muted/10">
      <div className="container mx-auto flex justify-center items-center gap-1">
        <span className="text-[13px] text-muted-foreground/40">Powered by</span>
        <ThemeLogo className="h-[40px] w-auto opacity-30" alt="RomackVision" />
      </div>
    </footer>
  );
};
