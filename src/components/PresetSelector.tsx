import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ParameterPreset } from '@/api/simulationsApi';
import { SimulationParameters, SimulationResolution } from '@/types/simulation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Bookmark, Plus, Trash2, Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface PresetSelectorProps {
  currentParams: SimulationParameters;
  onLoadPreset: (params: SimulationParameters) => void;
}

export function PresetSelector({ currentParams, onLoadPreset }: PresetSelectorProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ['presets'],
    queryFn: api.getPresets,
  });

  const saveMutation = useMutation({
    mutationFn: api.createPreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
      setIsSaveOpen(false);
      setPresetName('');
      setPresetDescription('');
      toast({ title: 'Preset saved' });
    },
    onError: () => {
      toast({ title: 'Failed to save preset', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deletePreset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['presets'] });
      toast({ title: 'Preset deleted' });
    },
  });

  const handleSave = () => {
    if (!presetName.trim()) {
      toast({ title: 'Please enter a preset name', variant: 'destructive' });
      return;
    }
    
    saveMutation.mutate({
      name: presetName.trim(),
      description: presetDescription.trim() || undefined,
      coil_count: currentParams.coil_count,
      magnetic_field_strength: currentParams.magnetic_field_strength,
      plasma_density: currentParams.plasma_density,
      simulation_resolution: currentParams.simulation_resolution,
    });
  };

  const handleLoad = (preset: ParameterPreset) => {
    onLoadPreset({
      coil_count: preset.coil_count,
      magnetic_field_strength: preset.magnetic_field_strength,
      plasma_density: preset.plasma_density,
      simulation_resolution: preset.simulation_resolution as SimulationResolution,
    });
    setIsOpen(false);
    toast({ title: `Loaded preset: ${preset.name}` });
  };

  const builtinPresets = presets.filter(p => p.is_builtin);
  const customPresets = presets.filter(p => !p.is_builtin);

  return (
    <div className="flex gap-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Bookmark className="w-4 h-4 mr-2" />
            Load Preset
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Parameter Presets</DialogTitle>
            <DialogDescription>
              Select a preset to load its parameters into the form.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-4">Loading presets...</div>
            ) : (
              <>
                {builtinPresets.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Built-in Presets
                    </h4>
                    <div className="space-y-2">
                      {builtinPresets.map(preset => (
                        <PresetItem
                          key={preset.id}
                          preset={preset}
                          onLoad={handleLoad}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {customPresets.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 mt-4">
                      Custom Presets
                    </h4>
                    <div className="space-y-2">
                      {customPresets.map(preset => (
                        <PresetItem
                          key={preset.id}
                          preset={preset}
                          onLoad={handleLoad}
                          onDelete={(id) => deleteMutation.mutate(id)}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {presets.length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    No presets available
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Save Preset
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save as Preset</DialogTitle>
            <DialogDescription>
              Save current parameters as a reusable preset.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="presetName">Preset Name</Label>
              <Input
                id="presetName"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="My Custom Preset"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="presetDescription">Description (optional)</Label>
              <Input
                id="presetDescription"
                value={presetDescription}
                onChange={(e) => setPresetDescription(e.target.value)}
                placeholder="Describe this configuration..."
              />
            </div>
            
            <div className="bg-secondary/50 rounded-lg p-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Current Parameters</h4>
              <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                <div>Coils: {currentParams.coil_count}</div>
                <div>B-Field: {currentParams.magnetic_field_strength} T</div>
                <div>Density: {currentParams.plasma_density.toExponential(0)}</div>
                <div>Res: {currentParams.simulation_resolution}</div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save Preset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PresetItem({ 
  preset, 
  onLoad, 
  onDelete 
}: { 
  preset: ParameterPreset; 
  onLoad: (preset: ParameterPreset) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-secondary/50 transition-colors">
      <div className="flex-1 cursor-pointer" onClick={() => onLoad(preset)}>
        <div className="flex items-center gap-2">
          {preset.is_builtin && <Star className="w-3 h-3 text-primary" />}
          <span className="font-medium text-sm">{preset.name}</span>
        </div>
        {preset.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{preset.description}</p>
        )}
        <div className="flex gap-3 mt-1 text-xs text-muted-foreground font-mono">
          <span>{preset.coil_count} coils</span>
          <span>{preset.magnetic_field_strength} T</span>
          <span>{preset.simulation_resolution}</span>
        </div>
      </div>
      
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => onLoad(preset)}>
          Load
        </Button>
        {onDelete && !preset.is_builtin && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDelete(preset.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
