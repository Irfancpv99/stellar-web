import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/simulationsApi';
import { Header } from '@/components/Header';
import { SimulationTable } from '@/components/SimulationTable';
import { MetricCard } from '@/components/MetricCard';
import { TimeSeriesChart } from '@/components/TimeSeriesChart';
import { SimulationResult } from '@/types/simulation';

export default function Compare() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const { data: simulations = [] } = useQuery({
    queryKey: ['simulations', { search: '', status: 'ALL' }],
    queryFn: () => api.getSimulations({ search: '', status: 'ALL' }),
  });

  const { data: results1 } = useQuery({
    queryKey: ['results', selectedIds[0]],
    queryFn: () => api.getResults(selectedIds[0]),
    enabled: !!selectedIds[0],
  });

  const { data: results2 } = useQuery({
    queryKey: ['results', selectedIds[1]],
    queryFn: () => api.getResults(selectedIds[1]),
    enabled: !!selectedIds[1],
  });

  const completedSimulations = simulations.filter(s => s.status === 'COMPLETED');

  const handleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  };

  const calculateDelta = (a: number, b: number) => {
    if (b === 0) return 0;
    return ((a - b) / b) * 100;
  };

  const getTrend = (delta: number, higherIsBetter: boolean): 'up' | 'down' | 'neutral' => {
    if (Math.abs(delta) < 0.5) return 'neutral';
    if (higherIsBetter) return delta > 0 ? 'up' : 'down';
    return delta < 0 ? 'up' : 'down';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Compare Simulations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select two completed simulations to compare metrics and results
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
            Select Simulations ({selectedIds.length}/2)
          </h2>
          <SimulationTable
            simulations={completedSimulations}
            onDelete={() => {}}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            selectable
          />
        </div>

        {results1 && results2 && (
          <>
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-4">
                  Simulation A <span className="text-muted-foreground font-mono">({selectedIds[0].slice(0, 8)})</span>
                </h3>
                <div className="space-y-3">
                  <MetricCard 
                    label="Confinement Score" 
                    value={results1.confinement_score}
                    unit="τ_E"
                  />
                  <MetricCard 
                    label="Energy Loss" 
                    value={results1.energy_loss}
                    unit="MW"
                  />
                  <MetricCard 
                    label="Stability Index" 
                    value={results1.stability_index}
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-foreground mb-4">
                  Simulation B <span className="text-muted-foreground font-mono">({selectedIds[1].slice(0, 8)})</span>
                </h3>
                <div className="space-y-3">
                  <MetricCard 
                    label="Confinement Score" 
                    value={results2.confinement_score}
                    unit="τ_E"
                    delta={calculateDelta(results2.confinement_score, results1.confinement_score)}
                    trend={getTrend(calculateDelta(results2.confinement_score, results1.confinement_score), true)}
                  />
                  <MetricCard 
                    label="Energy Loss" 
                    value={results2.energy_loss}
                    unit="MW"
                    delta={calculateDelta(results2.energy_loss, results1.energy_loss)}
                    trend={getTrend(calculateDelta(results2.energy_loss, results1.energy_loss), false)}
                  />
                  <MetricCard 
                    label="Stability Index" 
                    value={results2.stability_index}
                    delta={calculateDelta(results2.stability_index, results1.stability_index)}
                    trend={getTrend(calculateDelta(results2.stability_index, results1.stability_index), true)}
                  />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                Time Series Comparison
              </h2>
              <TimeSeriesChart 
                data={results1.time_series} 
                label={`Sim A (${selectedIds[0].slice(0, 8)})`}
                comparisonData={results2.time_series}
                comparisonLabel={`Sim B (${selectedIds[1].slice(0, 8)})`}
                height={400} 
              />
            </div>
          </>
        )}

        {selectedIds.length < 2 && (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
            Select two completed simulations above to compare results
          </div>
        )}
      </main>
    </div>
  );
}
