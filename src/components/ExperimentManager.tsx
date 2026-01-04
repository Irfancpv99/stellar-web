import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { advancedApi, Experiment } from '@/api/advancedApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, FlaskConical, FileText } from 'lucide-react';
import { format } from 'date-fns';

export function ExperimentManager() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingExperiment, setEditingExperiment] = useState<Experiment | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const { data: experiments = [], isLoading } = useQuery({
    queryKey: ['experiments'],
    queryFn: advancedApi.getExperiments,
  });

  const createMutation = useMutation({
    mutationFn: advancedApi.createExperiment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      toast({ title: 'Experiment created' });
      setIsCreateOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Experiment> }) =>
      advancedApi.updateExperiment(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      toast({ title: 'Experiment updated' });
      setEditingExperiment(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: advancedApi.deleteExperiment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['experiments'] });
      toast({ title: 'Experiment deleted' });
    },
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setNotes('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExperiment) {
      updateMutation.mutate({
        id: editingExperiment.id,
        updates: { name, description, notes },
      });
    } else {
      createMutation.mutate({ name, description, notes });
    }
  };

  const openEdit = (exp: Experiment) => {
    setEditingExperiment(exp);
    setName(exp.name);
    setDescription(exp.description || '');
    setNotes(exp.notes || '');
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading experiments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Experiments</h2>
          <p className="text-sm text-muted-foreground">
            Group related simulations into experiments
          </p>
        </div>
        
        <Dialog open={isCreateOpen || !!editingExperiment} onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingExperiment(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Experiment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingExperiment ? 'Edit Experiment' : 'Create Experiment'}
              </DialogTitle>
              <DialogDescription>
                {editingExperiment 
                  ? 'Update the experiment details'
                  : 'Create a new experiment to group related simulations'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="exp-name">Name</Label>
                <Input
                  id="exp-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Coil Optimization Study"
                  required
                />
              </div>
              <div>
                <Label htmlFor="exp-description">Description</Label>
                <Textarea
                  id="exp-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the experiment goals..."
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="exp-notes">Notes</Label>
                <Textarea
                  id="exp-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add research notes, observations..."
                  rows={4}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingExperiment ? 'Update Experiment' : 'Create Experiment'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {experiments.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <FlaskConical className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No experiments yet</p>
          <p className="text-sm text-muted-foreground">Create one to start organizing your simulations</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {experiments.map((exp) => (
            <Card key={exp.id} className="bg-card border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-primary" />
                    <CardTitle className="text-base">{exp.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(exp)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteMutation.mutate(exp.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {exp.description && (
                  <CardDescription>{exp.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {exp.notes && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                    <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p className="line-clamp-2">{exp.notes}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Created {format(new Date(exp.created_at), 'MMM d, yyyy')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
