import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { advancedApi, SimulationComment } from '@/api/advancedApi';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { MessageSquare, Plus, Trash2, Edit, Clock, Check, X } from 'lucide-react';
import { format } from 'date-fns';

interface SimulationCommentsProps {
  simulationId: string;
  timeSeriesLength?: number;
}

export function SimulationComments({ simulationId, timeSeriesLength }: SimulationCommentsProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [timePoint, setTimePoint] = useState('');
  const [editContent, setEditContent] = useState('');

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', simulationId],
    queryFn: () => advancedApi.getComments(simulationId),
  });

  const addMutation = useMutation({
    mutationFn: advancedApi.addComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', simulationId] });
      toast({ title: 'Comment added' });
      setIsAdding(false);
      setContent('');
      setTimePoint('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      advancedApi.updateComment(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', simulationId] });
      toast({ title: 'Comment updated' });
      setEditingId(null);
      setEditContent('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: advancedApi.deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', simulationId] });
      toast({ title: 'Comment deleted' });
    },
  });

  const handleAdd = () => {
    addMutation.mutate({
      simulation_id: simulationId,
      content,
      time_point: timePoint ? parseFloat(timePoint) : undefined,
    });
  };

  const handleUpdate = (id: string) => {
    updateMutation.mutate({ id, content: editContent });
  };

  const startEdit = (comment: SimulationComment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  if (isLoading) {
    return <div className="text-muted-foreground text-sm">Loading comments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Comments & Annotations ({comments.length})
        </h3>
        
        {!isAdding && (
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Note
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
          <div>
            <Label htmlFor="comment-content">Comment</Label>
            <Textarea
              id="comment-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add your observation or note..."
              rows={3}
            />
          </div>
          {timeSeriesLength && (
            <div>
              <Label htmlFor="time-point">Time Point (Optional)</Label>
              <Input
                id="time-point"
                type="number"
                value={timePoint}
                onChange={(e) => setTimePoint(e.target.value)}
                placeholder={`0-${timeSeriesLength}`}
                min={0}
                max={timeSeriesLength}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Link this comment to a specific point in the time series
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={!content.trim()}>
              Add Comment
            </Button>
            <Button variant="ghost" size="sm" onClick={() => {
              setIsAdding(false);
              setContent('');
              setTimePoint('');
            }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {comments.length === 0 && !isAdding ? (
        <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
          No comments yet. Add observations or notes about this simulation.
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-card border border-border rounded-lg p-4">
              {editingId === comment.id ? (
                <div className="space-y-3">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdate(comment.id)}>
                      <Check className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                      {comment.time_point !== null && (
                        <span className="bg-primary/20 text-primary px-2 py-0.5 rounded">
                          t = {comment.time_point}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(comment)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteMutation.mutate(comment.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
