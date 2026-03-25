import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { AIAnalysisDialog } from './AIAnalysisDialog';

interface AIAnalysisButtonProps {
  dashboardData: Record<string, unknown>;
  analysisType: 'publicidade' | 'midia';
  title?: string;
}

export function AIAnalysisButton({
  dashboardData,
  analysisType,
  title = 'Análise com IA',
}: AIAnalysisButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-pink-500 hover:bg-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
        size="icon"
      >
        <Sparkles className="h-6 w-6" />
      </Button>
      <AIAnalysisDialog
        open={open}
        onOpenChange={setOpen}
        dashboardData={dashboardData}
        analysisType={analysisType}
        title={title}
      />
    </>
  );
}
