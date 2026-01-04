import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, SimulationFilters as FiltersType } from '@/api/simulationsApi';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { SimulationTable } from '@/components/SimulationTable';
import { SimulationFilters } from '@/components/SimulationFilters';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { SimulationStatus } from '@/types/simulation';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FiltersType>({ search: '', status: 'ALL' });
  const [retryingIds, setRetryingIds] = useState<string[]>([]);
  
  const { data: simulations = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['simulations', filters],
    queryFn: () => api.getSimulations(filters),
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('simulations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'simulations',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['simulations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const deleteMutation = useMutation({
    mutationFn: api.deleteSimulation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      toast({ title: 'Simulation deleted' });
    },
  });

  const handleRetry = async (id: string) => {
    setRetryingIds(prev => [...prev, id]);
    try {
      await api.retrySimulation(id);
      toast({ title: 'Simulation retry started' });
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
    } catch (error) {
      toast({ title: 'Retry failed', variant: 'destructive' });
    } finally {
      // Keep the ID in retrying state briefly to allow realtime update to reflect
      setTimeout(() => {
        setRetryingIds(prev => prev.filter(i => i !== id));
      }, 2000);
    }
  };

  const handleFiltersChange = useCallback((newFilters: { search: string; status: SimulationStatus | 'ALL' }) => {
    setFilters(newFilters);
  }, []);

  // Calculate stats from all simulations (not filtered)
  const { data: allSimulations = [] } = useQuery({
    queryKey: ['simulations', { search: '', status: 'ALL' }],
    queryFn: () => api.getSimulations({ search: '', status: 'ALL' }),
    staleTime: 5000,
  });

  const pendingCount = allSimulations.filter(s => s.status === 'PENDING').length;
  const runningCount = allSimulations.filter(s => s.status === 'RUNNING').length;
  const completedCount = allSimulations.filter(s => s.status === 'COMPLETED').length;
  const failedCount = allSimulations.filter(s => s.status === 'FAILED').length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Simulation Jobs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor and manage stellarator simulation runs
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button asChild>
              <Link to="/new">
                <Plus className="w-4 h-4 mr-2" />
                New Simulation
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-mono font-semibold text-foreground">{allSimulations.length}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Jobs</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-mono font-semibold text-pending">{pendingCount + runningCount}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">In Progress</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-mono font-semibold text-success">{completedCount}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Completed</div>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-2xl font-mono font-semibold text-destructive">{failedCount}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Failed</div>
          </div>
        </div>

        {/* Filters */}
        <SimulationFilters onFiltersChange={handleFiltersChange} />

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading simulations...</div>
        ) : simulations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
            {filters.search || filters.status !== 'ALL' 
              ? 'No simulations match your filters' 
              : 'No simulations yet. Create your first one!'}
          </div>
        ) : (
          <SimulationTable 
            simulations={simulations} 
            onDelete={(id) => deleteMutation.mutate(id)}
            onRetry={handleRetry}
            retryingIds={retryingIds}
          />
        )}
      </main>
    </div>
  );
}
