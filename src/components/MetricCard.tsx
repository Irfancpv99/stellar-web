import { cn } from '@/lib/utils';

interface MetricCardProps {
  label: string;
  value: number | string;
  unit?: string;
  precision?: number;
  trend?: 'up' | 'down' | 'neutral';
  delta?: number;
  className?: string;
}

export function MetricCard({ 
  label, 
  value, 
  unit, 
  precision = 4, 
  trend,
  delta,
  className 
}: MetricCardProps) {
  const displayValue = typeof value === 'number' ? value.toFixed(precision) : value;
  
  return (
    <div className={cn('metric-card', className)}>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-mono font-semibold text-foreground">
          {displayValue}
        </span>
        {unit && (
          <span className="text-sm text-muted-foreground">{unit}</span>
        )}
      </div>
      {trend && delta !== undefined && (
        <div className={cn(
          'text-xs mt-2 font-mono',
          trend === 'up' && 'text-success',
          trend === 'down' && 'text-destructive',
          trend === 'neutral' && 'text-muted-foreground'
        )}>
          {trend === 'up' && '↑'}
          {trend === 'down' && '↓'}
          {trend === 'neutral' && '→'}
          {' '}{delta > 0 ? '+' : ''}{delta.toFixed(2)}%
        </div>
      )}
    </div>
  );
}
