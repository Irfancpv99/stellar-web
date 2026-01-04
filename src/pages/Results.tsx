import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState, useEffect } from 'react';
import { api } from '@/api/simulationsApi';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { MetricCard } from '@/components/MetricCard';
import { TimeSeriesChart } from '@/components/TimeSeriesChart';
import { StatusBadge } from '@/components/StatusBadge';
import { SimulationComments } from '@/components/SimulationComments';
import { PDFReportGenerator } from '@/components/PDFReportGenerator';
import { StellaratorVisualization } from '@/components/StellaratorVisualization';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, AlertTriangle, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const chartRef = useRef<HTMLDivElement>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const { data: job, isLoading: jobLoading, refetch: refetchJob } = useQuery({
    queryKey: ['simulation', id],
    queryFn: () => api.getSimulation(id!),
    enabled: !!id,
  });

  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ['results', id],
    queryFn: () => api.getResults(id!),
    enabled: !!id && job?.status === 'COMPLETED',
  });

  // Subscribe to realtime updates for this simulation
  useEffect(() => {
    if (!id) return;
    
    const channel = supabase
      .channel(`simulation-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'simulations',
          filter: `id=eq.${id}`,
        },
        () => {
          refetchJob();
          queryClient.invalidateQueries({ queryKey: ['results', id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, refetchJob, queryClient]);

  const handleRetry = async () => {
    if (!id) return;
    setIsRetrying(true);
    try {
      await api.retrySimulation(id);
      toast({ title: 'Simulation retry started' });
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
    } catch (error) {
      toast({ title: 'Retry failed', variant: 'destructive' });
    } finally {
      setIsRetrying(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    if (!id) return;
    
    try {
      const data = await api.exportResults(id, format);
      const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simulation-${id.slice(0, 8)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: `Exported as ${format.toUpperCase()}` });
    } catch {
      toast({ title: 'Export failed', variant: 'destructive' });
    }
  };

  if (jobLoading || resultsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        </main>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-12 text-muted-foreground">Simulation not found</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">
                Simulation Results
              </h1>
              <StatusBadge status={job.status} />
            </div>
            <p className="text-sm text-muted-foreground font-mono mt-1">
              ID: {job.id}
            </p>
          </div>
          
          {job.status === 'COMPLETED' && (
            <div className="flex gap-2">
              <PDFReportGenerator 
                simulation={job} 
                results={results || null} 
                chartRef={chartRef}
              />
              <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
            </div>
          )}
        </div>

        {/* Parameters */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
            Input Parameters
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Coil Count</div>
              <div className="font-mono text-foreground">{job.parameters.coil_count}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">B-Field (T)</div>
              <div className="font-mono text-foreground">{job.parameters.magnetic_field_strength}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Plasma Density (m⁻³)</div>
              <div className="font-mono text-foreground">{job.parameters.plasma_density.toExponential(2)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Resolution</div>
              <div className="font-mono text-foreground capitalize">{job.parameters.simulation_resolution}</div>
            </div>
          </div>
        </div>

        {/* 3D Coil Visualization */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
            Coil Configuration
          </h2>
          <StellaratorVisualization
            coilCount={job.parameters.coil_count}
            magneticFieldStrength={job.parameters.magnetic_field_strength}
          />
        </div>

        {job.status === 'FAILED' && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <h3 className="font-medium text-destructive">Simulation Failed</h3>
                  <p className="text-sm text-destructive/80 mt-1 font-mono">
                    {job.error_message || 'Unknown error'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={isRetrying}
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                {isRetrying ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4 mr-2" />
                )}
                Retry Simulation
              </Button>
            </div>
          </div>
        )}

        {(job.status === 'PENDING' || job.status === 'RUNNING') && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <div>
                <h3 className="font-medium text-primary">Simulation {job.status === 'PENDING' ? 'Queued' : 'Running'}</h3>
                <p className="text-sm text-primary/80 mt-1">
                  {job.status === 'PENDING' 
                    ? 'Waiting to start...' 
                    : 'Processing simulation, please wait...'}
                </p>
              </div>
            </div>
          </div>
        )}

        {results && (
          <>
            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <MetricCard 
                label="Confinement Score" 
                value={results.confinement_score}
                unit="τ_E"
              />
              <MetricCard 
                label="Energy Loss" 
                value={results.energy_loss}
                unit="MW"
              />
              <MetricCard 
                label="Stability Index" 
                value={results.stability_index}
              />
            </div>

            {/* Time Series */}
            <div className="bg-card border border-border rounded-lg p-6 mb-6" ref={chartRef}>
              <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                Confinement Time Series
              </h2>
              <TimeSeriesChart data={results.time_series} height={350} />
            </div>
          </>
        )}

        {/* Comments Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <SimulationComments 
            simulationId={id!} 
            timeSeriesLength={results?.time_series.length}
          />
        </div>
      </main>
    </div>
  );
}