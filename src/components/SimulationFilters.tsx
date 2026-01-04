import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { SimulationStatus } from '@/types/simulation';

interface SimulationFiltersProps {
  onFiltersChange: (filters: { search: string; status: SimulationStatus | 'ALL' }) => void;
}

export function SimulationFilters({ onFiltersChange }: SimulationFiltersProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<SimulationStatus | 'ALL'>('ALL');

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      onFiltersChange({ search, status });
    }, 300);
    
    return () => clearTimeout(debounceTimeout);
  }, [search, status, onFiltersChange]);

  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 font-mono text-sm"
        />
      </div>
      
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={status} onValueChange={(v) => setStatus(v as SimulationStatus | 'ALL')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="RUNNING">Running</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
