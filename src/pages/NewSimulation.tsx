import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/simulationsApi';
import { Header } from '@/components/Header';
import { SimulationForm } from '@/components/SimulationForm';
import { StellaratorVisualization } from '@/components/StellaratorVisualization';
import { toast } from '@/hooks/use-toast';
import { SimulationParameters } from '@/types/simulation';

export default function NewSimulation() {
  const navigate = useNavigate();
  const [previewParams, setPreviewParams] = useState<SimulationParameters>({
    coil_count: 50,
    magnetic_field_strength: 5.5,
    plasma_density: 1e20,
    simulation_resolution: 'medium',
  });
  
  const createMutation = useMutation({
    mutationFn: api.createSimulation,
    onSuccess: () => {
      toast({ 
        title: 'Simulation submitted',
        description: 'Your simulation job has been queued for execution.',
      });
      navigate('/');
    },
    onError: () => {
      toast({ 
        title: 'Submission failed',
        description: 'Could not submit simulation job.',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              New Simulation
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              Configure parameters for a new stellarator equilibrium simulation.
            </p>

            <div className="bg-card border border-border rounded-lg p-6">
              <SimulationForm 
                onSubmit={(params) => createMutation.mutate(params)}
                isLoading={createMutation.isPending}
                onParamsChange={setPreviewParams}
              />
            </div>

            <div className="mt-6 p-4 bg-secondary/30 rounded-lg border border-border">
              <h3 className="text-sm font-medium text-foreground mb-2">Parameter Guidelines</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• <strong>Coil Count:</strong> Higher values increase magnetic field complexity</li>
                <li>• <strong>B-Field:</strong> Typical fusion reactors operate at 5-10T</li>
                <li>• <strong>Plasma Density:</strong> Reactor-relevant range is 10¹⁹ - 10²¹ m⁻³</li>
                <li>• <strong>Resolution:</strong> High resolution increases accuracy but takes longer</li>
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium text-foreground mb-4">3D Preview</h2>
            <StellaratorVisualization
              coilCount={previewParams.coil_count}
              magneticFieldStrength={previewParams.magnetic_field_strength}
            />
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Visualization updates as you adjust parameters
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
