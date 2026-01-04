import { SimulationStatus } from '@/types/simulation';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: SimulationStatus;
  className?: string;
}

const statusConfig: Record<SimulationStatus, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'status-pending' },
  RUNNING: { label: 'Running', className: 'status-running' },
  COMPLETED: { label: 'Completed', className: 'status-completed' },
  FAILED: { label: 'Failed', className: 'status-failed' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md',
        config.className,
        status === 'RUNNING' && 'animate-pulse-slow',
        className
      )}
    >
      {status === 'RUNNING' && (
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      )}
      {config.label}
    </span>
  );
}
