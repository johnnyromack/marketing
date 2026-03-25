import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Download, Loader2, CheckCircle2, BarChart3, Shield, Users } from 'lucide-react';

interface ReportConfig {
  type: 'executive' | 'crisis' | 'competitive' | 'sentiment' | 'custom';
  title?: string;
  period: {
    from: string;
    to: string;
  };
  sections: string[];
  format: 'json' | 'pdf' | 'docx';
}

interface ReportGeneratorProps {
  /** Business Unit ID for generating reports */
  businessUnitId: string;
  onGenerate?: (config: ReportConfig) => Promise<void>;
  className?: string;
}

const REPORT_TYPES = [
  {
    id: 'executive' as const,
    label: 'Executivo',
    description: 'Visao geral para lideranca',
    icon: BarChart3,
    sections: ['overview', 'sentiment', 'competitive', 'recommendations'],
  },
  {
    id: 'crisis' as const,
    label: 'Crise',
    description: 'Análise de incidentes',
    icon: Shield,
    sections: ['overview', 'crisis', 'sentiment', 'recommendations'],
  },
  {
    id: 'competitive' as const,
    label: 'Competitivo',
    description: 'Share of voice e benchmarks',
    icon: Users,
    sections: ['overview', 'competitive', 'topics', 'engagement'],
  },
];

const PERIODS = [
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
  { label: 'Personalizado', days: 0 },
];

export function ReportGenerator({
  businessUnitId,
  onGenerate,
  className = '',
}: ReportGeneratorProps) {
  const [selectedType, setSelectedType] = useState<(typeof REPORT_TYPES)[0] | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [customPeriod, setCustomPeriod] = useState({ from: '', to: '' });
  const [format, setFormat] = useState<'json' | 'pdf' | 'docx'>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!selectedType) return;

    const now = new Date();
    let fromDate: Date;
    let toDate = now;

    if (selectedPeriod === 0 && customPeriod.from && customPeriod.to) {
      fromDate = new Date(customPeriod.from);
      toDate = new Date(customPeriod.to);
    } else {
      fromDate = new Date(now);
      fromDate.setDate(fromDate.getDate() - selectedPeriod);
    }

    const config: ReportConfig = {
      type: selectedType.id,
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
      sections: selectedType.sections,
      format,
    };

    setIsGenerating(true);
    setGeneratedUrl(null);

    try {
      const response = await fetch('/api/social-media/analytics/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_unit_id: businessUnitId,
          ...config,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.data.report.download_url) {
          setGeneratedUrl(data.data.report.download_url);
        } else if (format === 'json') {
          const blob = new Blob([JSON.stringify(data.data.content, null, 2)], {
            type: 'application/json',
          });
          setGeneratedUrl(URL.createObjectURL(blob));
        }
        onGenerate?.(config);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [selectedType, selectedPeriod, customPeriod, format, businessUnitId, onGenerate]);

  return (
    <Card className={className} data-testid="report-generator">
      <CardContent className="p-4">
        <div className="mb-6 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">
            Gerar Relatório
          </h3>
        </div>

        {/* Report type selection */}
        <div className="mb-4" data-testid="report-type-section">
          <span className="mb-2 block font-medium text-sm text-foreground">
            Tipo de Relatório
          </span>
          <div className="grid grid-cols-3 gap-2" data-testid="report-type-grid">
            {REPORT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType?.id === type.id;

              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type)}
                  data-testid={`btn-report-type-${type.id}`}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                    isSelected
                      ? 'bg-primary/5 border-primary'
                      : 'hover:border-primary/50 border-border'
                  } `}
                >
                  <Icon
                    className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <span
                    className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}
                  >
                    {type.label}
                  </span>
                  <span className="text-center text-xs text-muted-foreground">
                    {type.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Period selection */}
        <div className="mb-4" data-testid="report-period-section">
          <label
            htmlFor="reportgene-lbl-101"
            className="mb-2 block font-medium text-sm text-foreground"
          >
            Período
          </label>
          <div className="flex flex-wrap gap-2" data-testid="report-period-options">
            {PERIODS.map((period) => (
              <button
                key={period.days}
                onClick={() => setSelectedPeriod(period.days)}
                data-testid={`btn-period-${period.days}`}
                className={`rounded-md px-4 py-2 text-sm transition-colors ${
                  selectedPeriod === period.days
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                } `}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Custom period inputs */}
          {selectedPeriod === 0 && (
            <div className="mt-2 flex gap-2" data-testid="custom-period-inputs">
              <Input
                type="date"
                value={customPeriod.from}
                onChange={(e) => setCustomPeriod((p) => ({ ...p, from: e.target.value }))}
                className="flex-1"
                data-testid="input-custom-period-from"
              />
              <span className="flex items-center text-muted-foreground">ate</span>
              <Input
                type="date"
                value={customPeriod.to}
                onChange={(e) => setCustomPeriod((p) => ({ ...p, to: e.target.value }))}
                className="flex-1"
                data-testid="input-custom-period-to"
              />
            </div>
          )}
        </div>

        {/* Format selection */}
        <div className="mb-6" data-testid="report-format-section">
          <span className="mb-2 block font-medium text-sm text-foreground">
            Formato
          </span>
          <div className="flex gap-2" data-testid="report-format-options">
            {(['pdf', 'docx', 'json'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormat(fmt)}
                data-testid={`btn-format-${fmt}`}
                className={`rounded-md px-4 py-2 uppercase text-sm transition-colors ${
                  format === fmt
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                } `}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <div className="flex items-center gap-3" data-testid="report-actions">
          <Button
            onClick={handleGenerate}
            disabled={!selectedType || isGenerating}
            className="flex-1"
            data-testid="btn-generate-report"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Gerar Relatório
              </>
            )}
          </Button>

          {generatedUrl && (
            <a
              href={generatedUrl}
              download={`relatorio-${selectedType?.id}-${new Date().toISOString().split('T')[0]}.${format}`}
              className="bg-green-600/10 flex items-center gap-2 rounded-lg px-4 py-2 text-green-600"
              data-testid="link-download-report"
            >
              <CheckCircle2 className="h-4 w-4" />
              <Download className="h-4 w-4" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
