import { useQuery } from '@tanstack/react-query';
import { advancedApi, CorrelationData } from '@/api/advancedApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function CorrelationAnalysis() {
  const { data: correlations = [], isLoading } = useQuery({
    queryKey: ['correlations'],
    queryFn: advancedApi.getCorrelationData,
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Analyzing correlations...</div>;
  }

  const getCorrelationColor = (value: number) => {
    if (value > 0.5) return 'text-success';
    if (value < -0.5) return 'text-destructive';
    if (value > 0.2 || value < -0.2) return 'text-warning';
    return 'text-muted-foreground';
  };

  const getCorrelationIcon = (value: number) => {
    if (value > 0.2) return <TrendingUp className="w-4 h-4" />;
    if (value < -0.2) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const formatCorrelation = (value: number) => {
    return value.toFixed(3);
  };

  const getStrengthLabel = (value: number) => {
    const abs = Math.abs(value);
    if (abs > 0.7) return 'Strong';
    if (abs > 0.4) return 'Moderate';
    if (abs > 0.2) return 'Weak';
    return 'None';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Correlation Analysis</h2>
        <p className="text-sm text-muted-foreground">
          Discover relationships between simulation parameters and outcomes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {correlations.map((corr: CorrelationData) => (
          <Card key={corr.parameter} className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{corr.parameter}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CorrelationRow
                label="Confinement Score"
                value={corr.confinement_correlation}
                formatCorrelation={formatCorrelation}
                getCorrelationColor={getCorrelationColor}
                getCorrelationIcon={getCorrelationIcon}
                getStrengthLabel={getStrengthLabel}
              />
              <CorrelationRow
                label="Energy Loss"
                value={corr.energy_loss_correlation}
                formatCorrelation={formatCorrelation}
                getCorrelationColor={getCorrelationColor}
                getCorrelationIcon={getCorrelationIcon}
                getStrengthLabel={getStrengthLabel}
              />
              <CorrelationRow
                label="Stability Index"
                value={corr.stability_correlation}
                formatCorrelation={formatCorrelation}
                getCorrelationColor={getCorrelationColor}
                getCorrelationIcon={getCorrelationIcon}
                getStrengthLabel={getStrengthLabel}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-secondary/50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-foreground mb-2">Interpretation Guide</h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="text-success font-mono">+0.5 to +1.0</span>
            <span>Strong positive correlation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-destructive font-mono">-0.5 to -1.0</span>
            <span>Strong negative correlation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-warning font-mono">±0.2 to ±0.5</span>
            <span>Moderate correlation</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-mono">-0.2 to +0.2</span>
            <span>Weak/no correlation</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CorrelationRow({
  label,
  value,
  formatCorrelation,
  getCorrelationColor,
  getCorrelationIcon,
  getStrengthLabel,
}: {
  label: string;
  value: number;
  formatCorrelation: (v: number) => string;
  getCorrelationColor: (v: number) => string;
  getCorrelationIcon: (v: number) => JSX.Element;
  getStrengthLabel: (v: number) => string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-mono text-sm ${getCorrelationColor(value)}`}>
          {formatCorrelation(value)}
        </span>
        <span className={getCorrelationColor(value)}>
          {getCorrelationIcon(value)}
        </span>
        <span className={`text-xs ${getCorrelationColor(value)}`}>
          {getStrengthLabel(value)}
        </span>
      </div>
    </div>
  );
}
