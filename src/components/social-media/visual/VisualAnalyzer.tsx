import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, ImageIcon, Loader2, X, Sparkles } from 'lucide-react';

interface AnalysisResult {
  logos: Array<{
    brand: string;
    confidence: number;
    bounding_box: { x: number; y: number; width: number; height: number };
  }>;
  text: Array<{
    content: string;
    confidence: number;
  }>;
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
  } | null;
}

interface VisualAnalyzerProps {
  /** Brand ID for visual analysis */
  brandId: string;
  brands?: string[];
  onAnalysisComplete?: (result: AnalysisResult) => void;
  className?: string;
}

export function VisualAnalyzer({
  brandId,
  brands = [],
  onAnalysisComplete,
  className = '',
}: VisualAnalyzerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione uma imagem');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImageBase64(base64);
      setImageUrl(base64);
      setResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const _handleUrlInput = useCallback((url: string) => {
    setImageUrl(url);
    setImageBase64(null);
    setResult(null);
    setError(null);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!imageUrl && !imageBase64) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/social-media/visual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_id: brandId,
          image_url: imageBase64 ? undefined : imageUrl,
          image_base64: imageBase64 || undefined,
          brands: brands.length > 0 ? brands : undefined,
          detect_logos: true,
          detect_text: true,
          detect_sentiment: true,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Falha na análise');
      }

      setResult(data.data.detections);
      onAnalysisComplete?.(data.data.detections);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao analisar imagem');
    } finally {
      setIsAnalyzing(false);
    }
  }, [imageUrl, imageBase64, brandId, brands, onAnalysisComplete]);

  const handleClear = useCallback(() => {
    setImageUrl(null);
    setImageBase64(null);
    setResult(null);
    setError(null);
  }, []);

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">
            Analisar Imagem
          </h3>
          {(imageUrl || result) && (
            <button
              onClick={handleClear}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Limpar análise visual"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {!imageUrl ? (
          // Upload area
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-md cursor-pointer hover:border-primary transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="w-10 h-10 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground text-center">
              Arraste uma imagem ou clique para selecionar
            </span>
            <span className="text-xs text-muted-foreground mt-1">
              PNG, JPG, GIF ate 10MB
            </span>
          </label>
        ) : (
          // Image preview and analysis
          <div className="space-y-4">
            {/* Preview */}
            <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-full object-contain"
              />

              {/* Detection overlays */}
              {result?.logos.map((logo, idx) => (
                <div
                  key={idx}
                  className="absolute border-2 border-primary rounded"
                  style={{
                    left: `${(logo.bounding_box.x / 1000) * 100}%`,
                    top: `${(logo.bounding_box.y / 1000) * 100}%`,
                    width: `${(logo.bounding_box.width / 1000) * 100}%`,
                    height: `${(logo.bounding_box.height / 1000) * 100}%`,
                  }}
                >
                  <span className="absolute -top-5 left-0 px-1 text-[10px] bg-primary text-white rounded">
                    {logo.brand} ({(logo.confidence * 100).toFixed(0)}%)
                  </span>
                </div>
              ))}
            </div>

            {/* Analysis button */}
            {!result && (
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analisar Imagem
                  </>
                )}
              </Button>
            )}

            {/* Results */}
            {result && (
              <div className="space-y-2">
                {/* Logos */}
                {result.logos.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">
                      Logos Detectados
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.logos.map((logo, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          {logo.brand}
                          <span className="text-muted-foreground">
                            {(logo.confidence * 100).toFixed(0)}%
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Text */}
                {result.text.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">
                      Texto Detectado
                    </h4>
                    <div className="p-3 rounded-md bg-muted">
                      {result.text.map((t, idx) => (
                        <p key={idx} className="text-sm text-muted-foreground">
                          {t.content}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sentiment */}
                {result.sentiment && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">
                      Sentimento Visual
                    </h4>
                    <div className={`
                      inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm
                      ${result.sentiment.label === 'positive' ? 'bg-green-600/10 text-green-600' :
                        result.sentiment.label === 'negative' ? 'bg-red-600/10 text-red-600' :
                        'bg-muted text-muted-foreground'}
                    `}>
                      {result.sentiment.label === 'positive' ? 'Positivo' :
                       result.sentiment.label === 'negative' ? 'Negativo' : 'Neutro'}
                      <span className="text-muted-foreground">
                        ({(result.sentiment.score * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 rounded-md bg-red-600/10 text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
