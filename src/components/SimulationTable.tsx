import { SimulationJob } from '@/types/simulation';
import { StatusBadge } from './StatusBadge';
import { Link } from 'react-router-dom';
import { Trash2, Eye, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SimulationTableProps {
  simulations: SimulationJob[];
  onDelete: (id: string) => void;
  onRetry?: (id: string) => void;
  retryingIds?: string[];
  selectedIds?: string[];
  onSelect?: (id: string) => void;
  selectable?: boolean;
}

export function SimulationTable({ 
  simulations, 
  onDelete, 
  onRetry,
  retryingIds = [],
  selectedIds = [], 
  onSelect,
  selectable = false 
}: SimulationTableProps) {
  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatScientific = (num: number) => {
    if (num >= 1e6 || num < 0.001) {
      return num.toExponential(2);
    }
    return num.toFixed(2);
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="data-table">
        <thead>
          <tr className="bg-secondary/30">
            {selectable && <th className="w-12"></th>}
            <th>ID</th>
            <th>Status</th>
            <th>Coils</th>
            <th>B-Field (T)</th>
            <th>Density (m⁻³)</th>
            <th>Resolution</th>
            <th>Created</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {simulations.length === 0 ? (
            <tr>
              <td colSpan={selectable ? 9 : 8} className="text-center text-muted-foreground py-8">
                No simulations found
              </td>
            </tr>
          ) : (
            simulations.map((sim) => {
              const isRetrying = retryingIds.includes(sim.id);
              
              return (
                <tr key={sim.id}>
                  {selectable && (
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(sim.id)}
                        onChange={() => onSelect?.(sim.id)}
                        disabled={sim.status !== 'COMPLETED'}
                        className="rounded border-border bg-background"
                      />
                    </td>
                  )}
                  <td className="text-xs text-muted-foreground">
                    {sim.id.slice(0, 8)}...
                  </td>
                  <td>
                    <StatusBadge status={isRetrying ? 'PENDING' : sim.status} />
                  </td>
                  <td>{sim.parameters.coil_count}</td>
                  <td>{sim.parameters.magnetic_field_strength}</td>
                  <td>{formatScientific(sim.parameters.plasma_density)}</td>
                  <td className="capitalize">{sim.parameters.simulation_resolution}</td>
                  <td className="text-muted-foreground">{formatDate(sim.created_at)}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      {sim.status === 'FAILED' && onRetry && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRetry(sim.id)}
                                disabled={isRetrying}
                                className="h-8 w-8 p-0 hover:text-primary"
                              >
                                {isRetrying ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Retry simulation</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {sim.status === 'COMPLETED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-8 w-8 p-0"
                        >
                          <Link to={`/results/${sim.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(sim.id)}
                        className="h-8 w-8 p-0 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}