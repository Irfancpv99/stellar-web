import { supabase } from '@/integrations/supabase/client';
import type { SimulationParameters, SimulationJob, SimulationResult, TimeSeriesPoint } from '@/types/simulation';

// Inline types to avoid complex inference
type SimulationStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
type SimulationResolution = 'low' | 'medium' | 'high';

// Database row types
interface SimulationRow {
  id: string;
  status: string;
  coil_count: number;
  magnetic_field_strength: number;
  plasma_density: number;
  simulation_resolution: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
}

interface SimulationResultRow {
  id: string;
  job_id: string;
  confinement_score: number;
  energy_loss: number;
  stability_index: number;
  time_series: TimeSeriesPoint[];
  created_at: string;
}

export interface ParameterPreset {
  id: string;
  name: string;
  description: string | null;
  coil_count: number;
  magnetic_field_strength: number;
  plasma_density: number;
  simulation_resolution: SimulationResolution;
  is_builtin: boolean;
  created_at: string;
}

// Transform database row to SimulationJob type
function toSimulationJob(row: SimulationRow): SimulationJob {
  return {
    id: row.id,
    status: row.status as SimulationStatus,
    parameters: {
      coil_count: row.coil_count,
      magnetic_field_strength: row.magnetic_field_strength,
      plasma_density: row.plasma_density,
      simulation_resolution: row.simulation_resolution as SimulationResolution,
    },
    created_at: row.created_at,
    started_at: row.started_at,
    completed_at: row.completed_at,
    error_message: row.error_message,
  };
}

export interface SimulationFilters {
  search?: string;
  status?: SimulationStatus | 'ALL';
}

export const api = {
  async getSimulations(filters?: SimulationFilters): Promise<SimulationJob[]> {
    let query = supabase
      .from('simulations')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply status filter
    if (filters?.status && filters.status !== 'ALL') {
      query = query.eq('status', filters.status);
    }
    
    // Apply search filter (search by ID)
    if (filters?.search && filters.search.trim()) {
      query = query.ilike('id', `%${filters.search.trim()}%`);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching simulations:', error);
      throw error;
    }
    
    return (data as SimulationRow[]).map(toSimulationJob);
  },

  async getSimulation(id: string): Promise<SimulationJob | null> {
    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching simulation:', error);
      throw error;
    }
    
    return data ? toSimulationJob(data as SimulationRow) : null;
  },

  async createSimulation(params: SimulationParameters): Promise<SimulationJob> {
    // Insert the simulation
    const { data, error } = await supabase
      .from('simulations')
      .insert({
        coil_count: params.coil_count,
        magnetic_field_strength: params.magnetic_field_strength,
        plasma_density: params.plasma_density,
        simulation_resolution: params.simulation_resolution,
        status: 'PENDING',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating simulation:', error);
      throw error;
    }
    
    const job = toSimulationJob(data as SimulationRow);
    
    // Trigger the simulation execution via edge function
    supabase.functions.invoke('execute-simulation', {
      body: { 
        simulation_id: job.id,
        failure_rate: params.failure_rate ?? 10, // Default 10% failure rate
      },
    }).catch(err => {
      console.error('Error invoking execute-simulation:', err);
    });
    
    return job;
  },

  async retrySimulation(id: string, failureRate?: number): Promise<void> {
    // Reset simulation status to PENDING
    const { error } = await supabase
      .from('simulations')
      .update({
        status: 'PENDING',
        started_at: null,
        completed_at: null,
        error_message: null,
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error resetting simulation:', error);
      throw error;
    }
    
    // Trigger the simulation execution via edge function
    supabase.functions.invoke('execute-simulation', {
      body: { 
        simulation_id: id,
        failure_rate: failureRate ?? 10,
      },
    }).catch(err => {
      console.error('Error invoking execute-simulation:', err);
    });
  },

  async deleteSimulation(id: string): Promise<void> {
    const { error } = await supabase
      .from('simulations')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting simulation:', error);
      throw error;
    }
  },

  async getResults(id: string): Promise<SimulationResult | null> {
    const { data, error } = await supabase
      .from('simulation_results')
      .select('*')
      .eq('job_id', id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching results:', error);
      throw error;
    }
    
    if (!data) return null;
    
    return {
      job_id: data.job_id,
      confinement_score: data.confinement_score,
      energy_loss: data.energy_loss,
      stability_index: data.stability_index,
      time_series: data.time_series as unknown as TimeSeriesPoint[],
    };
  },

  async exportResults(id: string, format: 'json' | 'csv'): Promise<string> {
    const results = await this.getResults(id);
    
    if (!results) {
      throw new Error('Results not found');
    }
    
    if (format === 'json') {
      return JSON.stringify(results, null, 2);
    }
    
    // CSV format
    let csv = 't,value\n';
    results.time_series.forEach(point => {
      csv += `${point.t},${point.value}\n`;
    });
    return csv;
  },

  // Presets API
  async getPresets(): Promise<ParameterPreset[]> {
    const { data, error } = await supabase
      .from('parameter_presets')
      .select('*')
      .order('is_builtin', { ascending: false })
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Error fetching presets:', error);
      throw error;
    }
    
    return data as ParameterPreset[];
  },

  async createPreset(preset: {
    name: string;
    description?: string;
    coil_count: number;
    magnetic_field_strength: number;
    plasma_density: number;
    simulation_resolution: SimulationResolution;
  }): Promise<ParameterPreset> {
    const { data, error } = await supabase
      .from('parameter_presets')
      .insert({
        name: preset.name,
        description: preset.description || null,
        coil_count: preset.coil_count,
        magnetic_field_strength: preset.magnetic_field_strength,
        plasma_density: preset.plasma_density,
        simulation_resolution: preset.simulation_resolution,
        is_builtin: false,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating preset:', error);
      throw error;
    }
    
    return data as ParameterPreset;
  },

  async deletePreset(id: string): Promise<void> {
    const { error } = await supabase
      .from('parameter_presets')
      .delete()
      .eq('id', id)
      .eq('is_builtin', false); // Prevent deleting built-in presets
    
    if (error) {
      console.error('Error deleting preset:', error);
      throw error;
    }
  },
};
