import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { advancedApi, ScheduledSimulation, Experiment, SimulationResolution } from '@/api/advancedApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Calendar, Clock, X, Play, Ban } from 'lucide-react';
import { format, parseISO, isFuture } from 'date-fns';

export function ScheduleSimulation() {
  const queryClient = useQueryClient();
  
  const [scheduledAt, setScheduledAt] = useState('');
  const [coilCount, setCoilCount] = useState('8');
  const [bField, setBField] = useState('5.0');
  const [density, setDensity] = useState('1e20');
  const [resolution, setResolution] = useState<SimulationResolution>('medium');
  const [experimentId, setExperimentId] = useState<string>('');

  const { data: scheduledSimulations = [], isLoading } = useQuery({
    queryKey: ['scheduledSimulations'],
    queryFn: advancedApi.getScheduledSimulations,
  });

  const { data: experiments = [] } = useQuery({
    queryKey: ['experiments'],
    queryFn: advancedApi.getExperiments,
  });

  const createMutation = useMutation({
    mutationFn: advancedApi.createScheduledSimulation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledSimulations'] });
      toast({ title: 'Simulation scheduled' });
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Failed to schedule', description: String(error), variant: 'destructive' });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: advancedApi.cancelScheduledSimulation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduledSimulations'] });
      toast({ title: 'Scheduled simulation cancelled' });
    },
  });

  const resetForm = () => {
    setScheduledAt('');
    setCoilCount('8');
    setBField('5.0');
    setDensity('1e20');
    setResolution('medium');
    setExperimentId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scheduledAt) {
      toast({ title: 'Please select a date and time', variant: 'destructive' });
      return;
    }

    const scheduledDate = new Date(scheduledAt);
    if (!isFuture(scheduledDate)) {
      toast({ title: 'Please select a future date and time', variant: 'destructive' });
      return;
    }

    createMutation.mutate({
      scheduled_at: scheduledDate.toISOString(),
      coil_count: parseInt(coilCount),
      magnetic_field_strength: parseFloat(bField),
      plasma_density: parseFloat(density),
      simulation_resolution: resolution,
      experiment_id: experimentId || undefined,
    });
  };

  const pendingScheduled = scheduledSimulations.filter(s => s.status === 'scheduled');
  const executedScheduled = scheduledSimulations.filter(s => s.status === 'executed');
  const cancelledScheduled = scheduledSimulations.filter(s => s.status === 'cancelled');

  return (
    <div className="space-y-8">
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Schedule New Simulation
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="scheduledAt">Schedule For</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="coilCount">Coil Count</Label>
              <Input
                id="coilCount"
                type="number"
                value={coilCount}
                onChange={(e) => setCoilCount(e.target.value)}
                min={2}
                max={20}
                required
              />
            </div>
            <div>
              <Label htmlFor="bField">B-Field (T)</Label>
              <Input
                id="bField"
                type="number"
                value={bField}
                onChange={(e) => setBField(e.target.value)}
                step={0.1}
                min={1}
                max={15}
                required
              />
            </div>
            <div>
              <Label htmlFor="density">Plasma Density (m⁻³)</Label>
              <Input
                id="density"
                type="text"
                value={density}
                onChange={(e) => setDensity(e.target.value)}
                placeholder="1e20"
                required
              />
            </div>
            <div>
              <Label htmlFor="resolution">Resolution</Label>
              <Select value={resolution} onValueChange={(v) => setResolution(v as SimulationResolution)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

          <Button type="submit" className="w-full" disabled={createMutation.isPending}>
            <Clock className="w-4 h-4 mr-2" />
            Schedule Simulation
          </Button>
        </form>
      </div>

      {/* Pending Scheduled */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Upcoming ({pendingScheduled.length})
        </h3>
        
        {isLoading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : pendingScheduled.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
            No scheduled simulations
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingScheduled.map((sim) => (
              <ScheduledCard 
                key={sim.id} 
                simulation={sim} 
                onCancel={() => cancelMutation.mutate(sim.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* History */}
      {(executedScheduled.length > 0 || cancelledScheduled.length > 0) && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-4">History</h3>
          <div className="grid gap-2">
            {[...executedScheduled, ...cancelledScheduled].slice(0, 10).map((sim) => (
              <div 
                key={sim.id} 
                className="flex items-center justify-between text-sm py-2 px-3 bg-card border border-border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {sim.status === 'executed' ? (
                    <Play className="w-4 h-4 text-success" />
                  ) : (
                    <Ban className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="font-mono text-muted-foreground">
                    {format(parseISO(sim.scheduled_at), 'MMM d, HH:mm')}
                  </span>
                </div>
                <span className={sim.status === 'executed' ? 'text-success' : 'text-muted-foreground'}>
                  {sim.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduledCard({ 
  simulation, 
  onCancel 
}: { 
  simulation: ScheduledSimulation; 
  onCancel: () => void;
}) {
  const scheduledDate = parseISO(simulation.scheduled_at);
  
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            {format(scheduledDate, 'EEEE, MMM d, yyyy')}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-primary font-mono">
            <Clock className="w-4 h-4" />
            {format(scheduledDate, 'HH:mm')}
          </div>
          <div className="text-muted-foreground">
            {simulation.coil_count} coils • {simulation.magnetic_field_strength}T • {simulation.simulation_resolution}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
