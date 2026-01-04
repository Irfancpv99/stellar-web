import { useState, useEffect } from 'react';
import { SimulationParameters, SimulationResolution } from '@/types/simulation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { PresetSelector } from '@/components/PresetSelector';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Settings } from 'lucide-react';

interface SimulationFormProps {
  onSubmit: (params: SimulationParameters) => void;
  isLoading?: boolean;
  onParamsChange?: (params: SimulationParameters) => void;
}

export function SimulationForm({ onSubmit, isLoading, onParamsChange }: SimulationFormProps) {
  const [coilCount, setCoilCount] = useState('50');
  const [magneticField, setMagneticField] = useState('5.5');
  const [plasmaDensity, setPlasmaDensity] = useState('1e20');
  const [resolution, setResolution] = useState<SimulationResolution>('medium');
  const [failureRate, setFailureRate] = useState(10);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Notify parent of param changes for live preview
  useEffect(() => {
    if (onParamsChange) {
      onParamsChange({
        coil_count: parseInt(coilCount) || 50,
        magnetic_field_strength: parseFloat(magneticField) || 5.5,
        plasma_density: parseFloat(plasmaDensity) || 1e20,
        simulation_resolution: resolution,
        failure_rate: failureRate,
      });
    }
  }, [coilCount, magneticField, plasmaDensity, resolution, failureRate, onParamsChange]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    const coils = parseInt(coilCount);
    if (isNaN(coils) || coils < 10 || coils > 100) {
      newErrors.coilCount = 'Coil count must be between 10 and 100';
    }
    
    const field = parseFloat(magneticField);
    if (isNaN(field) || field < 1 || field > 15) {
      newErrors.magneticField = 'Magnetic field must be between 1 and 15 Tesla';
    }
    
    const density = parseFloat(plasmaDensity);
    if (isNaN(density) || density < 1e18 || density > 1e22) {
      newErrors.plasmaDensity = 'Plasma density must be between 1e18 and 1e22 m⁻³';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    onSubmit({
      coil_count: parseInt(coilCount),
      magnetic_field_strength: parseFloat(magneticField),
      plasma_density: parseFloat(plasmaDensity),
      simulation_resolution: resolution,
      failure_rate: failureRate,
    });
  };

  const getCurrentParams = (): SimulationParameters => ({
    coil_count: parseInt(coilCount) || 50,
    magnetic_field_strength: parseFloat(magneticField) || 5.5,
    plasma_density: parseFloat(plasmaDensity) || 1e20,
    simulation_resolution: resolution,
    failure_rate: failureRate,
  });

  const handleLoadPreset = (params: SimulationParameters) => {
    setCoilCount(params.coil_count.toString());
    setMagneticField(params.magnetic_field_strength.toString());
    setPlasmaDensity(params.plasma_density.toExponential(0));
    setResolution(params.simulation_resolution);
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Preset Controls */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <span className="text-sm text-muted-foreground">Quick load parameter presets</span>
        <PresetSelector
          currentParams={getCurrentParams()}
          onLoadPreset={handleLoadPreset}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="coilCount">Coil Count</Label>
          <Input
            id="coilCount"
            type="number"
            value={coilCount}
            onChange={(e) => setCoilCount(e.target.value)}
            placeholder="10-100"
            className="font-mono"
          />
          {errors.coilCount && (
            <p className="text-xs text-destructive">{errors.coilCount}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Number of modular coils in the stellarator configuration
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="magneticField">Magnetic Field Strength (T)</Label>
          <Input
            id="magneticField"
            type="number"
            step="0.1"
            value={magneticField}
            onChange={(e) => setMagneticField(e.target.value)}
            placeholder="1-15"
            className="font-mono"
          />
          {errors.magneticField && (
            <p className="text-xs text-destructive">{errors.magneticField}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Central magnetic field strength in Tesla
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="plasmaDensity">Plasma Density (m⁻³)</Label>
          <Input
            id="plasmaDensity"
            type="text"
            value={plasmaDensity}
            onChange={(e) => setPlasmaDensity(e.target.value)}
            placeholder="1e18 - 1e22"
            className="font-mono"
          />
          {errors.plasmaDensity && (
            <p className="text-xs text-destructive">{errors.plasmaDensity}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Peak electron density in scientific notation
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="resolution">Simulation Resolution</Label>
          <Select value={resolution} onValueChange={(v) => setResolution(v as SimulationResolution)}>
            <SelectTrigger className="font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low (fast)</SelectItem>
              <SelectItem value="medium">Medium (balanced)</SelectItem>
              <SelectItem value="high">High (accurate)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Grid resolution affects accuracy and compute time
          </p>
        </div>
      </div>

      {/* Advanced Settings */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Settings className="h-4 w-4" />
              Advanced Settings
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4">
          <div className="space-y-4 p-4 bg-secondary/20 rounded-lg border border-border">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="failureRate">Simulation Failure Rate</Label>
                <span className="text-sm font-mono text-muted-foreground">{failureRate}%</span>
              </div>
              <Slider
                id="failureRate"
                value={[failureRate]}
                onValueChange={(v) => setFailureRate(v[0])}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Probability of simulation failure due to numerical instabilities. Set to 0 for guaranteed success.
              </p>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex justify-end pt-4 border-t border-border">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Submitting...' : 'Submit Simulation'}
        </Button>
      </div>
    </form>
  );
}