import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { advancedApi, Experiment, SimulationResolution } from '@/api/advancedApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';
import { Layers, Play } from 'lucide-react';

interface BatchRunFormProps {
  onSuccess?: () => void;
}

export function BatchRunForm({ onSuccess }: BatchRunFormProps) {
  const queryClient = useQueryClient();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sweepParameter, setSweepParameter] = useState<'coil_count' | 'magnetic_field_strength' | 'plasma_density'>('coil_count');
  const [startValue, setStartValue] = useState('4');
  const [endValue, setEndValue] = useState('12');
  const [stepCount, setStepCount] = useState(5);
  const [baseCoilCount, setBaseCoilCount] = useState('8');
  const [baseBField, setBaseBField] = useState('5.0');
  const [baseDensity, setBaseDensity] = useState('1e20');
  const [resolution, setResolution] = useState<SimulationResolution>('medium');
  const [experimentId, setExperimentId] = useState<string>('');

  const { data: experiments = [] } = useQuery({
    queryKey: ['experiments'],
    queryFn: advancedApi.getExperiments,
  });

  const createMutation = useMutation({
    mutationFn: advancedApi.createBatchRun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batchRuns'] });
      toast({ title: 'Batch run started', description: `${stepCount} simulations queued` });
      onSuccess?.();
    },
    onError: (error) => {
      toast({ title: 'Failed to create batch run', description: String(error), variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createMutation.mutate({
      name,
      description: description || undefined,
      sweep_parameter: sweepParameter,
      start_value: parseFloat(startValue),
      end_value: parseFloat(endValue),
      step_count: stepCount,
      base_coil_count: parseInt(baseCoilCount),
      base_magnetic_field_strength: parseFloat(baseBField),
      base_plasma_density: parseFloat(baseDensity),
      base_simulation_resolution: resolution,
      experiment_id: experimentId || undefined,
    });
  };

  const getParameterRange = () => {
    switch (sweepParameter) {
      case 'coil_count':
        return { min: 2, max: 20, step: 1, unit: 'coils' };
      case 'magnetic_field_strength':
        return { min: 1, max: 15, step: 0.5, unit: 'T' };
      case 'plasma_density':
        return { min: 1e18, max: 1e22, step: 1e19, unit: 'm⁻³' };
      default:
        return { min: 0, max: 100, step: 1, unit: '' };
    }
  };

  const range = getParameterRange();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Batch Run Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Coil Count Optimization"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the purpose of this parameter sweep..."
            rows={2}
          />
        </div>

        <div>
          <Label htmlFor="experiment">Assign to Experiment (Optional)</Label>
          <Select value={experimentId || "none"} onValueChange={(v) => setExperimentId(v === "none" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select experiment..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {experiments.map((exp: Experiment) => (
                <SelectItem key={exp.id} value={exp.id}>
                  {exp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Sweep Configuration
        </h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="sweepParameter">Parameter to Sweep</Label>
            <Select value={sweepParameter} onValueChange={(v) => setSweepParameter(v as typeof sweepParameter)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coil_count">Coil Count</SelectItem>
                <SelectItem value="magnetic_field_strength">Magnetic Field Strength</SelectItem>
                <SelectItem value="plasma_density">Plasma Density</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startValue">Start Value ({range.unit})</Label>
              <Input
                id="startValue"
                type="number"
                value={startValue}
                onChange={(e) => setStartValue(e.target.value)}
                step={range.step}
                required
              />
            </div>
            <div>
              <Label htmlFor="endValue">End Value ({range.unit})</Label>
              <Input
                id="endValue"
                type="number"
                value={endValue}
                onChange={(e) => setEndValue(e.target.value)}
                step={range.step}
                required
              />
            </div>
          </div>

          <div>
            <Label>Number of Steps: {stepCount}</Label>
            <Slider
              value={[stepCount]}
              onValueChange={([v]) => setStepCount(v)}
              min={2}
              max={20}
              step={1}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Will create {stepCount} simulations
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-sm font-medium text-foreground mb-4">Base Parameters (Fixed)</h3>

        <div className="grid grid-cols-2 gap-4">
          {sweepParameter !== 'coil_count' && (
            <div>
              <Label htmlFor="baseCoilCount">Coil Count</Label>
              <Input
                id="baseCoilCount"
                type="number"
                value={baseCoilCount}
                onChange={(e) => setBaseCoilCount(e.target.value)}
                min={2}
                max={20}
                required
              />
            </div>
          )}
          {sweepParameter !== 'magnetic_field_strength' && (
            <div>
              <Label htmlFor="baseBField">B-Field Strength (T)</Label>
              <Input
                id="baseBField"
                type="number"
                value={baseBField}
                onChange={(e) => setBaseBField(e.target.value)}
                step={0.1}
                min={1}
                max={15}
                required
              />
            </div>
          )}
          {sweepParameter !== 'plasma_density' && (
            <div>
              <Label htmlFor="baseDensity">Plasma Density (m⁻³)</Label>
              <Input
                id="baseDensity"
                type="text"
                value={baseDensity}
                onChange={(e) => setBaseDensity(e.target.value)}
                placeholder="1e20"
                required
              />
            </div>
          )}
          <div>
            <Label htmlFor="resolution">Resolution</Label>
            <Select value={resolution} onValueChange={(v) => setResolution(v as SimulationResolution)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low (Fast)</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High (Slow)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={createMutation.isPending}>
        <Play className="w-4 h-4 mr-2" />
        {createMutation.isPending ? 'Starting...' : `Start Batch Run (${stepCount} simulations)`}
      </Button>
    </form>
  );
}
