import { supabase } from '@/integrations/supabase/client';

// Inline types to avoid circular dependencies
export type SimulationResolution = 'low' | 'medium' | 'high';
export type SimulationStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

// Types for new features
export interface Experiment {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BatchRun {
  id: string;
  name: string;
  description: string | null;
  sweep_parameter: 'coil_count' | 'magnetic_field_strength' | 'plasma_density';
  start_value: number;
  end_value: number;
  step_count: number;
  base_coil_count: number;
  base_magnetic_field_strength: number;
  base_plasma_density: number;
  base_simulation_resolution: SimulationResolution;
  status: SimulationStatus;
  experiment_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ScheduledSimulation {
  id: string;
  scheduled_at: string;
  coil_count: number;
  magnetic_field_strength: number;
  plasma_density: number;
  simulation_resolution: SimulationResolution;
  experiment_id: string | null;
  simulation_id: string | null;
  status: 'scheduled' | 'executed' | 'cancelled';
  created_at: string;
}

export interface SimulationComment {
  id: string;
  simulation_id: string;
  content: string;
  time_point: number | null;
  created_at: string;
  updated_at: string;
}

export interface CorrelationData {
  parameter: string;
  confinement_correlation: number;
  energy_loss_correlation: number;
  stability_correlation: number;
}

export const advancedApi = {
  // Experiments
  async getExperiments(): Promise<Experiment[]> {
    const { data, error } = await supabase
      .from('experiments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Experiment[];
  },

  async createExperiment(experiment: { name: string; description?: string; notes?: string }): Promise<Experiment> {
    const { data, error } = await supabase
      .from('experiments')
      .insert({
        name: experiment.name,
        description: experiment.description || null,
        notes: experiment.notes || null,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as Experiment;
  },

  async updateExperiment(id: string, updates: Partial<Experiment>): Promise<Experiment> {
    const { data, error } = await supabase
      .from('experiments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Experiment;
  },

  async deleteExperiment(id: string): Promise<void> {
    const { error } = await supabase
      .from('experiments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Batch Runs
  async getBatchRuns(): Promise<BatchRun[]> {
    const { data, error } = await supabase
      .from('batch_runs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as BatchRun[];
  },

  async createBatchRun(batchRun: {
    name: string;
    description?: string;
    sweep_parameter: 'coil_count' | 'magnetic_field_strength' | 'plasma_density';
    start_value: number;
    end_value: number;
    step_count: number;
    base_coil_count: number;
    base_magnetic_field_strength: number;
    base_plasma_density: number;
    base_simulation_resolution: SimulationResolution;
    experiment_id?: string;
  }): Promise<BatchRun> {
    const { data, error } = await supabase
      .from('batch_runs')
      .insert({
        name: batchRun.name,
        description: batchRun.description || null,
        sweep_parameter: batchRun.sweep_parameter,
        start_value: batchRun.start_value,
        end_value: batchRun.end_value,
        step_count: batchRun.step_count,
        base_coil_count: batchRun.base_coil_count,
        base_magnetic_field_strength: batchRun.base_magnetic_field_strength,
        base_plasma_density: batchRun.base_plasma_density,
        base_simulation_resolution: batchRun.base_simulation_resolution,
        experiment_id: batchRun.experiment_id || null,
        status: 'PENDING',
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Trigger batch execution
    supabase.functions.invoke('execute-batch', {
      body: { batch_id: data.id },
    }).catch(err => console.error('Error invoking execute-batch:', err));
    
    return data as BatchRun;
  },

  async deleteBatchRun(id: string): Promise<void> {
    const { error } = await supabase
      .from('batch_runs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Scheduled Simulations
  async getScheduledSimulations(): Promise<ScheduledSimulation[]> {
    const { data, error } = await supabase
      .from('scheduled_simulations')
      .select('*')
      .order('scheduled_at', { ascending: true });
    
    if (error) throw error;
    return data as ScheduledSimulation[];
  },

  async createScheduledSimulation(scheduled: {
    scheduled_at: string;
    coil_count: number;
    magnetic_field_strength: number;
    plasma_density: number;
    simulation_resolution: SimulationResolution;
    experiment_id?: string;
  }): Promise<ScheduledSimulation> {
    const { data, error } = await supabase
      .from('scheduled_simulations')
      .insert({
        scheduled_at: scheduled.scheduled_at,
        coil_count: scheduled.coil_count,
        magnetic_field_strength: scheduled.magnetic_field_strength,
        plasma_density: scheduled.plasma_density,
        simulation_resolution: scheduled.simulation_resolution,
        experiment_id: scheduled.experiment_id || null,
        status: 'scheduled',
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as ScheduledSimulation;
  },

  async cancelScheduledSimulation(id: string): Promise<void> {
    const { error } = await supabase
      .from('scheduled_simulations')
      .update({ status: 'cancelled' })
      .eq('id', id);
    
    if (error) throw error;
  },

  // Comments
  async getComments(simulationId: string): Promise<SimulationComment[]> {
    const { data, error } = await supabase
      .from('simulation_comments')
      .select('*')
      .eq('simulation_id', simulationId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data as SimulationComment[];
  },

  async addComment(comment: {
    simulation_id: string;
    content: string;
    time_point?: number;
  }): Promise<SimulationComment> {
    const { data, error } = await supabase
      .from('simulation_comments')
      .insert({
        simulation_id: comment.simulation_id,
        content: comment.content,
        time_point: comment.time_point || null,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as SimulationComment;
  },

  async updateComment(id: string, content: string): Promise<SimulationComment> {
    const { data, error } = await supabase
      .from('simulation_comments')
      .update({ content })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as SimulationComment;
  },

  async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('simulation_comments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Correlation Analysis
  async getCorrelationData(): Promise<CorrelationData[]> {
    // Fetch all completed simulations with results
    const { data: simulations, error: simError } = await supabase
      .from('simulations')
      .select('id, coil_count, magnetic_field_strength, plasma_density')
      .eq('status', 'COMPLETED');
    
    if (simError) throw simError;
    if (!simulations || simulations.length < 2) {
      return [
        { parameter: 'Coil Count', confinement_correlation: 0, energy_loss_correlation: 0, stability_correlation: 0 },
        { parameter: 'B-Field Strength', confinement_correlation: 0, energy_loss_correlation: 0, stability_correlation: 0 },
        { parameter: 'Plasma Density', confinement_correlation: 0, energy_loss_correlation: 0, stability_correlation: 0 },
      ];
    }

    const { data: results, error: resError } = await supabase
      .from('simulation_results')
      .select('job_id, confinement_score, energy_loss, stability_index')
      .in('job_id', simulations.map(s => s.id));
    
    if (resError) throw resError;
    if (!results) return [];

    // Merge data
    const merged = simulations.map(sim => {
      const result = results.find(r => r.job_id === sim.id);
      return result ? { ...sim, ...result } : null;
    }).filter(Boolean) as Array<{
      coil_count: number;
      magnetic_field_strength: number;
      plasma_density: number;
      confinement_score: number;
      energy_loss: number;
      stability_index: number;
    }>;

    if (merged.length < 2) {
      return [
        { parameter: 'Coil Count', confinement_correlation: 0, energy_loss_correlation: 0, stability_correlation: 0 },
        { parameter: 'B-Field Strength', confinement_correlation: 0, energy_loss_correlation: 0, stability_correlation: 0 },
        { parameter: 'Plasma Density', confinement_correlation: 0, energy_loss_correlation: 0, stability_correlation: 0 },
      ];
    }

    // Calculate correlations using Pearson correlation coefficient
    const calculateCorrelation = (x: number[], y: number[]): number => {
      const n = x.length;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
      const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
      
      const numerator = n * sumXY - sumX * sumY;
      const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
      
      if (denominator === 0) return 0;
      return numerator / denominator;
    };

    const coilCounts = merged.map(m => m.coil_count);
    const bFields = merged.map(m => m.magnetic_field_strength);
    const densities = merged.map(m => m.plasma_density);
    const confinements = merged.map(m => m.confinement_score);
    const energyLosses = merged.map(m => m.energy_loss);
    const stabilities = merged.map(m => m.stability_index);

    return [
      {
        parameter: 'Coil Count',
        confinement_correlation: calculateCorrelation(coilCounts, confinements),
        energy_loss_correlation: calculateCorrelation(coilCounts, energyLosses),
        stability_correlation: calculateCorrelation(coilCounts, stabilities),
      },
      {
        parameter: 'B-Field Strength',
        confinement_correlation: calculateCorrelation(bFields, confinements),
        energy_loss_correlation: calculateCorrelation(bFields, energyLosses),
        stability_correlation: calculateCorrelation(bFields, stabilities),
      },
      {
        parameter: 'Plasma Density',
        confinement_correlation: calculateCorrelation(densities, confinements),
        energy_loss_correlation: calculateCorrelation(densities, energyLosses),
        stability_correlation: calculateCorrelation(densities, stabilities),
      },
    ];
  },

  // Get simulations for an experiment
  async getExperimentSimulations(experimentId: string) {
    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('experiment_id', experimentId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Assign simulation to experiment
  async assignToExperiment(simulationId: string, experimentId: string | null): Promise<void> {
    const { error } = await supabase
      .from('simulations')
      .update({ experiment_id: experimentId })
      .eq('id', simulationId);
    
    if (error) throw error;
  },
};
